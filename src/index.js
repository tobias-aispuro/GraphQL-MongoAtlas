require("dotenv").config();
const mongoose = require("mongoose");
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

const typeDefs = require("./schema/typeDefs");
const resolvers = require("./schema/resolvers");

// ─── Plugin: Landing Page con GraphiQL embebido ───────────────
// GraphiQL corre 100% desde localhost, sin problemas de
// bloqueo de Chrome 142+ sobre acceso a red local.
const graphiqlPlugin = {
  async serverWillStart() {
    return {
      async renderLandingPage() {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>GraphiQL – Productos API</title>
  <link rel="stylesheet" href="https://unpkg.com/graphiql@3/graphiql.min.css" />
  <style>
    body { margin: 0; height: 100vh; }
    #graphiql { height: 100vh; }
  </style>
</head>
<body>
  <div id="graphiql"></div>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/graphiql@3/graphiql.min.js"></script>
  <script>
    const fetcher = GraphiQL.createFetcher({ url: window.location.href });
    const root = ReactDOM.createRoot(document.getElementById('graphiql'));
    root.render(React.createElement(GraphiQL, {
      fetcher,
      defaultQuery: \`# 🚀 Bienvenido a la API de Productos
#
# Probá estas queries y mutations:

# Crear un producto
mutation CrearProducto {
  createProduct(input: {
    name: "Notebook Lenovo"
    price: 899.99
    stock: 25
    category: "Electrónica"
    description: "Notebook con 16GB RAM y SSD 512GB"
  }) {
    id
    name
    price
    stock
    category
  }
}

# Obtener todos los productos
# query Productos {
#   products {
#     id
#     name
#     price
#     stock
#     category
#   }
# }
\`
    }));
  </script>
</body>
</html>`;
        return { html };
      },
    };
  },
};

async function startServer() {
  const PORT = parseInt(process.env.PORT, 10) || 4000;

  // ─── Conexión a MongoDB Atlas ───────────────────────────────────
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB Atlas");
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB:", error.message);
    process.exit(1);
  }

  // ─── Apollo Server (standalone) ─────────────────────────────────
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [graphiqlPlugin],
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
  });

  console.log(`🚀 Servidor GraphQL corriendo en ${url}`);
  console.log(`🧪 GraphiQL disponible en ${url}`);
}

startServer();
