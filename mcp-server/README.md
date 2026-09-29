# 🔌 Servidor MCP – API GraphQL de Productos

Servidor **MCP (Model Context Protocol)** implementado en **Node.js** utilizando el **SDK oficial de MCP (`@modelcontextprotocol/sdk`)** y transporte **`stdio`**. Permite a modelos de lenguaje (LLMs) como Claude, Gemini, ChatGPT o IDEs con soporte MCP (Cursor, Antigravity, Windsurf, Claude Desktop) interactuar directamente con nuestro servidor GraphQL desplegado en **Render**.

---

## 🛠️ Herramientas Expuestas (Tools)

El servidor registra dos herramientas tipadas con **Zod**:

### 1. `get_products`
Consulta el servidor GraphQL para obtener el listado completo de productos del catálogo.

- **Entrada:** Sin parámetros obligatorios.
- **Salida:** JSON con el total y la lista de productos (`id`, `name`, `price`, `stock`, `category`, `description`, `createdAt`, `updatedAt`).

### 2. `update_product`
Modifica campos específicos de un producto a través de la mutación GraphQL `updateProduct(id: ID!, input: UpdateProductInput!)`.

- **Parámetros de Entrada:**
  | Parámetro | Tipo | Requerido | Descripción |
  |---|---|---|---|
  | `id` | `string` | **Sí** | ID de MongoDB del producto a modificar. |
  | `price` | `number` | No | Nuevo precio del producto (positivo). |
  | `stock` | `integer` | No | Nueva cantidad de stock disponible (mínimo 0). |
  | `category` | `string` | No | Nueva categoría del producto. |

- **Salida:** JSON con el producto actualizado confirmando los nuevos valores.

---

## 🚀 Requisitos e Instalación

1. Node.js v18+ (soporte nativo para `fetch`).
2. Instalar dependencias en la carpeta `mcp-server`:
   ```bash
   cd mcp-server
   npm install
   ```

---

## ⚙️ Configuración en Clientes MCP

### Configuración en Claude Desktop (`claude_desktop_config.json`)
Agrega lo siguiente en tu archivo de configuración:

```json
{
  "mcpServers": {
    "graphql-products": {
      "command": "node",
      "args": [
        "/Users/tobiasaispuro/Developer/Clase-MongoAtlas/mcp-server/index.js"
      ],
      "env": {
        "GRAPHQL_ENDPOINT": "https://graphql-mongoatlas.onrender.com/"
      }
    }
  }
}
```

### Configuración en Cursor / Windsurf / Antigravity (`mcp_config.json`)
```json
{
  "mcpServers": {
    "graphql-products": {
      "command": "node",
      "args": ["mcp-server/index.js"],
      "env": {
        "GRAPHQL_ENDPOINT": "https://graphql-mongoatlas.onrender.com/"
      }
    }
  }
}
```

---

## 🧪 Pruebas con MCP Inspector

Puedes probar interactivamente el servidor con la herramienta oficial de inspección de MCP:

```bash
npx @modelcontextprotocol/inspector node mcp-server/index.js
```
