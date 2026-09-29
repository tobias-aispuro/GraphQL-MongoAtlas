require("dotenv").config();
const mongoose = require("mongoose");
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

const typeDefs = require("./schema/typeDefs");
const resolvers = require("./schema/resolvers");

const {
  ApolloServerPluginLandingPageLocalDefault,
} = require("@apollo/server/plugin/landingPage/default");

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
    plugins: [
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
  });

  console.log(`🚀 Servidor GraphQL corriendo en ${url}`);
  console.log(`🧪 Apollo Sandbox disponible en ${url}`);
}

startServer();
