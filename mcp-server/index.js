#!/usr/bin/env node

/**
 * Servidor MCP (Model Context Protocol) para la API GraphQL de Productos.
 * Comunicación vía transporte stdio utilizando el SDK oficial de MCP.
 */

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

// Endpoint del servidor GraphQL (Render por defecto)
const GRAPHQL_ENDPOINT =
  process.env.GRAPHQL_ENDPOINT || "https://graphql-mongoatlas.onrender.com/";

/**
 * Función auxiliar para enviar queries y mutaciones a la API GraphQL.
 */
async function fetchGraphQL(query, variables = {}) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Error HTTP ${response.status} (${response.statusText}): ${errorText}`
    );
  }

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    const errorMessages = result.errors.map((e) => e.message).join(", ");
    throw new Error(`Error en GraphQL: ${errorMessages}`);
  }

  return result.data;
}

// ─── Inicialización del Servidor MCP ───────────────────────────
const server = new McpServer({
  name: "graphql-products-server",
  version: "1.0.0",
  description:
    "Servidor MCP para consultar y actualizar productos del servidor GraphQL en Render",
});

// ─── Herramienta 1: get_products ───────────────────────────────
server.tool(
  "get_products",
  "Llama al servidor GraphQL para obtener el listado completo de productos del catálogo.",
  {},
  async () => {
    try {
      console.error("[MCP] Ejecutando get_products...");

      const query = `
        query GetProducts {
          products {
            id
            name
            price
            stock
            category
            description
            createdAt
            updatedAt
          }
        }
      `;

      const data = await fetchGraphQL(query);
      const products = data.products || [];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                total: products.length,
                products,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("[MCP Error] Error en get_products:", error.message);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error al obtener productos: ${error.message}`,
          },
        ],
      };
    }
  }
);

// ─── Herramienta 2: update_product ─────────────────────────────
server.tool(
  "update_product",
  "Modifica el precio, stock o categoría de un producto existente dado su ID a través de una mutación GraphQL.",
  {
    id: z.string().describe("ID de MongoDB del producto a modificar"),
    price: z
      .number()
      .positive("El precio debe ser un número positivo")
      .optional()
      .describe("Nuevo precio del producto"),
    stock: z
      .number()
      .int("El stock debe ser un número entero")
      .min(0, "El stock no puede ser negativo")
      .optional()
      .describe("Nueva cantidad de stock disponible"),
    category: z
      .string()
      .min(1, "La categoría no puede estar vacía")
      .optional()
      .describe("Nueva categoría del producto (ej: Electrónica, Hogar, Deportes, Herramientas)"),
  },
  async ({ id, price, stock, category }) => {
    try {
      console.error(`[MCP] Ejecutando update_product para ID: ${id}...`);

      // Armamos el objeto input únicamente con los campos que fueron enviados
      const input = {};
      if (price !== undefined) input.price = price;
      if (stock !== undefined) input.stock = stock;
      if (category !== undefined) input.category = category;

      if (Object.keys(input).length === 0) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Debes especificar al menos un campo para actualizar: 'price', 'stock' o 'category'.",
            },
          ],
        };
      }

      const mutation = `
        mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
          updateProduct(id: $id, input: $input) {
            id
            name
            price
            stock
            category
            description
            updatedAt
          }
        }
      `;

      const data = await fetchGraphQL(mutation, { id, input });
      const updated = data.updateProduct;

      if (!updated) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No se encontró ningún producto con el ID "${id}".`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: "Producto actualizado exitosamente.",
                product: updated,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("[MCP Error] Error en update_product:", error.message);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error al actualizar el producto: ${error.message}`,
          },
        ],
      };
    }
  }
);

// ─── Conexión al Transporte stdio ──────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 Servidor MCP de Productos iniciado y escuchando en stdio");
  console.error(`📡 GraphQL Endpoint conectado: ${GRAPHQL_ENDPOINT}`);
}

main().catch((error) => {
  console.error("❌ Error fatal al iniciar el servidor MCP:", error);
  process.exit(1);
});
