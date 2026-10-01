#!/usr/bin/env node

/**
 * Agente Auditor de Catálogo de Productos
 *
 * Utiliza Vercel AI SDK + @ai-sdk/mcp para conectarse al servidor MCP
 * de productos (mcpdist/index.js) y auditar el catálogo identificando
 * problemas como precios negativos, stock negativo, categorías inconsistentes, etc.
 *
 * Solicita autorización al usuario antes de realizar cualquier corrección.
 */

const path = require("path");
const readline = require("readline");

// Cargar variables de entorno desde .env en la raíz del proyecto
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { generateText, isStepCount } = require("ai");
const { anthropic } = require("@ai-sdk/anthropic");
const { createMCPClient } = require("@ai-sdk/mcp");
const {
  Experimental_StdioMCPTransport,
} = require("@ai-sdk/mcp/mcp-stdio");

// ─── Configuración ─────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.LLM_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error(
    "❌ Error: La variable de entorno LLM_API_KEY no está configurada.\n" +
      "Definila en tu archivo .env con tu API Key de Anthropic."
  );
  process.exit(1);
}

const MCP_SERVER_PATH = path.resolve(__dirname, "../mcpdist/index.js");

// ─── Utilidades de Interfaz de Usuario ─────────────────────────
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
}

function printHeader(title) {
  const line = "═".repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(`${line}\n`);
}

function printSection(title) {
  console.log(`\n── ${title} ${"─".repeat(50 - title.length)}\n`);
}

// ─── Prompt del Sistema ────────────────────────────────────────
const SYSTEM_PROMPT = `Sos un agente auditor de catálogo de productos. Tu trabajo es:

1. FASE DE ANÁLISIS: Usar la herramienta get_products para obtener el catálogo completo.
2. FASE DE DIAGNÓSTICO: Analizar TODOS los productos e identificar problemas como:
   - Precios negativos o en cero (debe ser > 0)
   - Stock negativo (debe ser >= 0)
   - Categorías inconsistentes (misma categoría escrita de formas diferentes, ej: "electronica", "Electrónica", "ELECTRONICA")
   - Descripciones vacías
   - Cualquier otra anomalía que encuentres
3. FASE DE REPORTE: Presentar un informe claro con:
   - Resumen ejecutivo (cantidad de productos, cantidad de problemas)
   - Lista detallada de cada problema encontrado (producto, campo, valor actual, valor sugerido)
   - Clasificar cada problema como "SEGURO de corregir automáticamente" o "REQUIERE revisión manual"
4. FASE DE CORRECCIÓN: Para los problemas clasificados como SEGUROS:
   - Proponer las correcciones concretas
   - ESPERAR a que el usuario te diga "sí" o "no" antes de ejecutar cada corrección
   - Si el usuario aprueba, usar la herramienta update_product para aplicar la corrección
   - Si el usuario rechaza, pasar al siguiente problema

REGLAS IMPORTANTES:
- Cuando normalices categorías, elegí la forma más común o la que tenga mayúscula inicial (ej: "Electrónica").
- Para precios negativos, convertí a positivo (valor absoluto).
- Para stock negativo, poné en 0.
- Para precios en 0, marcalo como "REQUIERE revisión manual" (no sabemos el precio correcto).
- Presentá todo en español.
- Sé conciso pero completo en tu análisis.

IMPORTANTE: Después de presentar el reporte, preguntá al usuario si quiere que procedas con las correcciones seguras.`;

// ─── Ejecución Principal ───────────────────────────────────────
async function main() {
  printHeader("🔍 AGENTE AUDITOR DE CATÁLOGO DE PRODUCTOS");
  console.log("Conectando al servidor MCP de productos...\n");

  // Crear cliente MCP con transporte stdio al servidor compilado
  let mcpClient;
  try {
    mcpClient = await createMCPClient({
      transport: new Experimental_StdioMCPTransport({
        command: "node",
        args: [MCP_SERVER_PATH],
      }),
    });
    console.log("✅ Conectado al servidor MCP\n");
  } catch (error) {
    console.error("❌ Error al conectar al servidor MCP:", error.message);
    process.exit(1);
  }

  // Obtener las herramientas MCP
  const tools = await mcpClient.tools();
  console.log(
    "🛠️  Herramientas disponibles:",
    Object.keys(tools).join(", ")
  );

  try {
    // ─── FASE 1: Análisis y Diagnóstico ───────────────────────
    printSection("FASE 1: Obteniendo y analizando el catálogo");

    const analysisResult = await generateText({
      model: anthropic("claude-sonnet-4-20250514", {
        apiKey: ANTHROPIC_API_KEY,
      }),
      tools,
      system: SYSTEM_PROMPT,
      prompt:
        "Obtené el catálogo completo de productos usando get_products. " +
        "Analizá todos los productos y generá un informe detallado de todos " +
        "los problemas que encuentres. No corrijas nada todavía, solo presentá " +
        "el reporte de auditoría.",
      stopWhen: isStepCount(5),
    });

    console.log(analysisResult.text);

    // ─── FASE 2: Solicitar autorización ───────────────────────
    printSection("FASE 2: Autorización para correcciones");

    const respuesta = await askUser(
      "¿Querés que el agente proceda con las correcciones seguras? (sí/no): "
    );

    if (respuesta !== "sí" && respuesta !== "si" && respuesta !== "s") {
      console.log(
        "\n⏸️  Correcciones canceladas. El reporte queda como referencia.\n"
      );
      await mcpClient.close();
      rl.close();
      return;
    }

    // ─── FASE 3: Correcciones automáticas con confirmación ────
    printSection("FASE 3: Aplicando correcciones");

    const correctionResult = await generateText({
      model: anthropic("claude-sonnet-4-20250514", {
        apiKey: ANTHROPIC_API_KEY,
      }),
      tools,
      system:
        SYSTEM_PROMPT +
        "\n\nEl usuario autorizó las correcciones seguras. " +
        "Procedé a ejecutar update_product para CADA problema clasificado como SEGURO. " +
        "Para cada corrección, explicá qué estás haciendo antes de ejecutarla. " +
        "Al finalizar, mostrá un resumen de todas las correcciones aplicadas.",
      prompt:
        "El usuario autorizó las correcciones. Basándote en el análisis previo, " +
        "ejecutá TODAS las correcciones seguras usando update_product. " +
        "Recordá los problemas encontrados:\n\n" +
        analysisResult.text +
        "\n\nProcedé con las correcciones ahora.",
      stopWhen: isStepCount(30),
    });

    console.log(correctionResult.text);

    printSection("AUDITORÍA COMPLETADA");
    console.log("✅ El agente finalizó la auditoría y las correcciones.\n");
  } catch (error) {
    console.error("\n❌ Error durante la ejecución del agente:", error.message);
    if (error.cause) console.error("Causa:", error.cause);
  } finally {
    await mcpClient.close();
    rl.close();
  }
}

main();
