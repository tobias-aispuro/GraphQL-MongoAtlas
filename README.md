# Clase-MongoAtlas — GraphQL API de Productos

API GraphQL construida con **Apollo Server v5** (standalone) + **Mongoose** + **MongoDB Atlas**.

## 📁 Estructura del proyecto

```
├── src/
│   ├── index.js              # Entry point: Apollo Server + conexión MongoDB
│   ├── models/
│   │   └── Product.js        # Modelo Mongoose de Producto
│   └── schema/
│       ├── typeDefs.js        # Esquema SDL de GraphQL
│       └── resolvers.js       # Resolvers (queries + mutations)
├── .env                       # Variables de entorno (NO subir a git)
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Crear un archivo .env con:
PORT=4000
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/productsDB?retryWrites=true&w=majority

# 3. Levantar el servidor en modo desarrollo
npm run dev
```

El servidor arranca en `http://localhost:4000` y abre Apollo Sandbox automáticamente.

## 🧪 Apollo Sandbox

Con la introspección habilitada, podés usar Apollo Sandbox para probar las queries:

👉 [Abrir Apollo Sandbox](https://studio.apollographql.com/sandbox/explorer)

Configurar el endpoint como: `http://localhost:4000` (local) o la URL de Render (producción).

## 📡 Queries y Mutations de ejemplo

### Crear un producto

```graphql
mutation {
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
    description
    createdAt
  }
}
```

### Obtener todos los productos

```graphql
query {
  products {
    id
    name
    price
    stock
    category
  }
}
```

### Filtrar productos

```graphql
query {
  products(filter: {
    category: "Electrónica"
    minPrice: 100
    maxPrice: 1000
    inStock: true
  }) {
    id
    name
    price
    stock
    category
  }
}
```

### Buscar producto por nombre

```graphql
query {
  products(filter: { name: "notebook" }) {
    id
    name
    price
  }
}
```

### Obtener un producto por ID

```graphql
query {
  product(id: "64f...abc") {
    id
    name
    price
    stock
    category
    description
  }
}
```

### Actualizar un producto

```graphql
mutation {
  updateProduct(id: "64f...abc", input: {
    price: 749.99
    stock: 20
  }) {
    id
    name
    price
    stock
    updatedAt
  }
}
```

### Eliminar un producto

```graphql
mutation {
  deleteProduct(id: "64f...abc")
}
```

## 🌐 Deploy en Render

1. Crear un **Web Service** en [render.com](https://render.com)
2. Conectar el repositorio de GitHub
3. Configurar:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Agregar la variable de entorno en Render:
   - `MONGODB_URI` → tu connection string de MongoDB Atlas
5. En **MongoDB Atlas → Network Access**, agregar IP `0.0.0.0/0` para permitir conexiones desde Render

## 📦 Tecnologías

- Node.js
- Apollo Server v5 (standalone)
- GraphQL
- Mongoose / MongoDB Atlas
- Render (deploy)
