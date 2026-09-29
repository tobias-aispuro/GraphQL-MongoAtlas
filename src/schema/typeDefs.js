const typeDefs = `#graphql
  """
  Representa un producto en el catálogo.
  """
  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
    category: String!
    description: String
    createdAt: String
    updatedAt: String
  }

  """
  Campos de entrada para crear un producto.
  """
  input CreateProductInput {
    name: String!
    price: Float!
    stock: Int!
    category: String!
    description: String
  }

  """
  Campos de entrada para actualizar un producto.
  Todos los campos son opcionales: solo se actualizan los que se envíen.
  """
  input UpdateProductInput {
    name: String
    price: Float
    stock: Int
    category: String
    description: String
  }

  """
  Filtros opcionales para la consulta de productos.
  """
  input ProductFilterInput {
    category: String
    minPrice: Float
    maxPrice: Float
    inStock: Boolean
    name: String
  }

  type Query {
    """
    Obtiene todos los productos, con filtros opcionales.
    """
    products(filter: ProductFilterInput): [Product!]!

    """
    Obtiene un producto por su ID.
    """
    product(id: ID!): Product
  }

  type Mutation {
    """
    Crea un nuevo producto.
    """
    createProduct(input: CreateProductInput!): Product!

    """
    Actualiza campos de un producto existente por su ID.
    Solo se modifican los campos incluidos en el input.
    """
    updateProduct(id: ID!, input: UpdateProductInput!): Product

    """
    Elimina un producto por su ID. Devuelve true si fue eliminado.
    """
    deleteProduct(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;
