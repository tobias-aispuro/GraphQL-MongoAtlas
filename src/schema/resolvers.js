const Product = require("../models/Product");

const resolvers = {
  Query: {
    /**
     * Obtiene todos los productos, opcionalmente filtrados.
     * Filtros soportados: category, minPrice, maxPrice, inStock, name (búsqueda parcial).
     */
    products: async (_, { filter }) => {
      const query = {};

      if (filter) {
        // Filtrar por categoría (case-insensitive)
        if (filter.category) {
          query.category = { $regex: new RegExp(filter.category, "i") };
        }

        // Filtrar por rango de precio
        if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
          query.price = {};
          if (filter.minPrice !== undefined) query.price.$gte = filter.minPrice;
          if (filter.maxPrice !== undefined) query.price.$lte = filter.maxPrice;
        }

        // Filtrar solo productos en stock
        if (filter.inStock === true) {
          query.stock = { $gt: 0 };
        } else if (filter.inStock === false) {
          query.stock = 0;
        }

        // Búsqueda parcial por nombre (case-insensitive)
        if (filter.name) {
          query.name = { $regex: new RegExp(filter.name, "i") };
        }
      }

      return Product.find(query).sort({ createdAt: -1 });
    },

    /**
     * Obtiene un producto por su ID.
     */
    product: async (_, { id }) => {
      return Product.findById(id);
    },
  },

  Mutation: {
    /**
     * Crea un nuevo producto.
     */
    createProduct: async (_, { input }) => {
      const product = new Product(input);
      return product.save();
    },

    /**
     * Actualiza campos de un producto existente.
     * Solo modifica los campos presentes en el input.
     */
    updateProduct: async (_, { id, input }) => {
      // Eliminar campos undefined para no sobreescribir con null
      const updateData = {};
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined && value !== null) {
          updateData[key] = value;
        }
      }

      return Product.findByIdAndUpdate(id, updateData, {
        new: true, // devuelve el documento actualizado
        runValidators: true, // ejecuta las validaciones del esquema
      });
    },

    /**
     * Elimina un producto por su ID.
     */
    deleteProduct: async (_, { id }) => {
      const result = await Product.findByIdAndDelete(id);
      return !!result;
    },
  },
};

module.exports = resolvers;
