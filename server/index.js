require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const cookieParser = require("cookie-parser");
const Product = require("./models/Product");
const Category = require('./models/Category');
const app = express();

mongoose.set("strictQuery", false);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "bricchihnos",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "pdf"],
  },
});

const uploadMiddleware = multer({
  storage: storage,
}).fields([
  { name: "images", maxCount: 10 },
  { name: "technical_sheet", maxCount: 1 },
  { name: "manuals", maxCount: 5 },
]);

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", process.env.FRONTEND_PUBLIC_URL],
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

mongoose.connect(process.env.DB_HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// mongoose.connection.once("open", async () => {
//   try {
//     console.log("Connected to the database");

//     const result = await Product.deleteMany({});
//     console.log(`Deleted ${result.deletedCount} products from the database`);

//     mongoose.connection.close();
//     console.log("Database connection closed");
//   } catch (error) {
//     console.error("Error deleting products:", error);
//     mongoose.connection.close();
//   }
// });

// GET all products with pagination
app.get("/api/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();
    const products = await Product.find().skip(skip).limit(limit);

    const totalPages = Math.ceil(total / limit);

    res.json({
      totalPages,
      currentPage: page,
      totalProducts: total,
      products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET a specific product by id
app.get("/api/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST - Add a new product
app.post("/api/add-product", uploadMiddleware, async (req, res) => {
  try {
    // Mostrar el cuerpo de la solicitud y los archivos para depurar
    console.log("Body:", req.body);
    console.log("Files:", req.files);

    const { name, description, category, subCategory, specifications } = req.body;

    // Validar si el campo 'name' está vacío
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "El nombre del producto es obligatorio." });
    }

    // Procesar las imágenes si están presentes
    let mainImageUrl = "";
    let secondaryImageUrls = [];
    if (req.files && req.files["images"] && req.files["images"].length > 0) {
      mainImageUrl = req.files["images"][0].path; // URL de la imagen principal
      secondaryImageUrls = req.files["images"].slice(1).map((file) => file.path); // URLs de las imágenes secundarias
    }

    // Procesar la ficha técnica si está presente
    const technicalSheetUrl = req.files && req.files["technical_sheet"]
      ? req.files["technical_sheet"][0].path
      : "";

    // Procesar los manuales si están presentes
    const manualUrls = req.files && req.files["manuals"]
      ? req.files["manuals"].map((file) => file.path)
      : [];

    // Crear el producto
    const product = new Product({
      name,
      description,
      mainImageUrl, // Esta será una cadena vacía si no hay imagen principal
      specifications,
      secondaryImageUrls, // Será un array vacío si no hay imágenes secundarias
      technical_sheet: {
        file_name: req.files && req.files["technical_sheet"] ? req.files["technical_sheet"][0].originalname : "",
        url: technicalSheetUrl, // Será una cadena vacía si no hay ficha técnica
      },
      manuals: manualUrls.map((url, index) => ({
        file_name: req.files && req.files["manuals"] ? req.files["manuals"][index].originalname : "",
        url,
      })),
      category,
      subCategory: subCategory || null,
    });

    await product.save();
    res.status(200).json({ message: "Producto agregado exitosamente", product });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// PUT - Update a product by ID
app.put("/api/edit-product/:id", uploadMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedFields = req.body;

    // Handle images if they exist
    if (req.files && req.files["images"] && req.files["images"].length > 0) {
      updatedFields.mainImageUrl = req.files["images"][0]?.path || "";
      updatedFields.secondaryImageUrls = req.files["images"]
        .slice(1)
        .map((file) => file.path);
    }

    const product = await Product.findByIdAndUpdate(productId, updatedFields, { new: true });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE - Delete a product by ID
app.delete("/api/delete-product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdAndRemove(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - Obtener una categoría específica por ID
app.get("/api/category/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId).populate('subcategories');

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ category });
  } catch (err) {
    console.error("Error fetching category:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// DELETE - Eliminar una categoría y sus subcategorías
app.delete("/api/delete-category/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findByIdAndRemove(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await Category.updateMany(
      { subcategories: categoryId },
      { $pull: { subcategories: categoryId } }
    );

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE - Delete a product by name
app.delete("/api/delete-product-by-name/:name", async (req, res) => {
  try {
    const productName = req.params.name;
    const product = await Product.findOneAndDelete({ name: productName });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT - Update a product by ID
app.put("/api/edit-product/:id", uploadMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedFields = req.body;

    if (req.files && req.files["images"] && req.files["images"].length > 0) {
      updatedFields.mainImageUrl = req.files["images"][0]?.path || ""; // Actualizar la imagen principal
      updatedFields.secondaryImageUrls = req.files["images"]
        .slice(1)
        .map((file) => file.path); // Actualizar las imágenes secundarias
    }

    if (req.files && req.files["technical_sheet"] && req.files["technical_sheet"].length > 0) {
      updatedFields.technical_sheet = {
        file_name: req.files["technical_sheet"][0].originalname,
        url: req.files["technical_sheet"][0].path,
      };
    }

    if (req.files && req.files["manuals"] && req.files["manuals"].length > 0) {
      updatedFields.manuals = req.files["manuals"].map((file, index) => ({
        file_name: file.originalname,
        url: file.path,
      }));
    }

    const product = await Product.findByIdAndUpdate(productId, updatedFields, { new: true });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST - Add a new category or subcategory
app.post("/api/add-category", async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    const category = new Category({
      name,
      subcategories: subcategories || []
    });

    await category.save();

    if (subcategories && subcategories.length > 0) {
      await Category.updateMany(
        { _id: { $in: subcategories } },
        { $push: { subcategories: category._id } }
      );
    }

    res.status(200).json({ message: "Category added successfully", category });
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// GET - Obtener todas las categorías
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find().populate('subcategories');
    res.status(200).json({ categories });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT - Actualizar una categoría por ID
app.put("/api/edit-category/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, subcategories } = req.body;

    // Actualizar la categoría con los nuevos datos
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      {
        name,
        subcategories: subcategories || [],
      },
      { new: true }
    ).populate("subcategories");

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Actualizar la relación en las subcategorías
    if (subcategories && subcategories.length > 0) {
      await Category.updateMany(
        { _id: { $in: subcategories } },
        { $push: { subcategories: categoryId } }
      );
    }

    res.status(200).json({ message: "Category updated successfully", category: updatedCategory });
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



// Listen port
app.listen(5001, () => {
  console.log("Server listening on port", 5001);
});

