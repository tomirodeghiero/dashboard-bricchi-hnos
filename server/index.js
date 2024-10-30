require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");
const stream = require('stream');
const axios = require("axios");
const mongoose = require("mongoose");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const cookieParser = require("cookie-parser");
const Product = require("./models/Product");
const { Category, SubCategory, SubSubCategory } = require('./models/Category');
const app = express();

const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

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

console.log("front url:", process.env.FRONTEND_PUBLIC_URL);

app.use(
  cors({
    credentials: true,
    origin: ["https://server-dashboardbricchihnos.vercel.app", "https://www.bricchihnos.com", "http://localhost:3000", "http://localhost:3001", process.env.FRONTEND_PUBLIC_URL],
  })
);


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


// Convertir URLs de Google Drive a URLs directas para Cloudinary
function convertGoogleDriveUrl(url) {
  const fileId = url.match(/\/d\/(.*?)\//);
  return fileId ? `https://drive.google.com/uc?export=view&id=${fileId[1]}` : url;
}

// Validar URL
function isValidUrlSync(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Subir archivo a Cloudinary
async function uploadFileToCloudinary(fileUrl, folder = "bricchihnos") {
  try {
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
    });

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) {
            console.error("Error al subir archivo a Cloudinary:", error);
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      );

      response.data.pipe(uploadStream);
    });
  } catch (error) {
    console.error("Error al procesar el archivo:", error);
    return null;
  }
}

app.post("/api/upload-csv", express.json(), async (req, res) => {
  const { csvData } = req.body;
  console.log("CSV data:", csvData);

  if (!csvData) {
    return res.status(400).send("No se recibió ningún dato CSV");
  }

  const results = [];
  const csvStream = new stream.Readable();
  csvStream.push(csvData);
  csvStream.push(null);

  csvStream
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        // Ignorar el primer registro de datos (que podría ser un ejemplo)
        const filteredResults = results.slice(1); 

        const existingProductNames = new Set(
          (await Product.find({}, "name")).map((product) => product.name)
        );

        for (let row of filteredResults) {
          console.log("Row:", row);

          // Verificar si el producto ya existe en la base de datos
          if (existingProductNames.has(row.name)) {
            console.log(`El producto "${row.name}" ya existe. Saltando...`);
            continue;
          }

          // Subir imagen principal a Cloudinary si es una URL válida
          const mainImageUrlDirect = convertGoogleDriveUrl(row.mainImageUrl);
          const mainImageUrlCloudinary = isValidUrlSync(mainImageUrlDirect)
            ? await uploadFileToCloudinary(mainImageUrlDirect)
            : null;
          console.log("Main image URL in Cloudinary:", mainImageUrlCloudinary);

          // Subir imágenes secundarias a Cloudinary si son URLs válidas
          const secondaryImageUrls = row.secondaryImageUrls
            ? (
                await Promise.all(
                  row.secondaryImageUrls
                    .split(";")
                    .map((url) => convertGoogleDriveUrl(url.trim()))
                    .map(async (url) => (isValidUrlSync(url) ? await uploadFileToCloudinary(url) : null))
                )
              ).filter((url) => url !== null) // Filtrar nulos después de Promise.all
            : [];

          // Subir archivo PDF de la hoja técnica a Cloudinary solo si es una URL válida
          const technicalSheetUrl = isValidUrlSync(row.technicalSheetUrl)
            ? await uploadFileToCloudinary(convertGoogleDriveUrl(row.technicalSheetUrl), "bricchihnos/pdfs")
            : null;

          // Subir archivos PDF de los manuales a Cloudinary si son URLs válidas
          const manuals = row.manuals
            ? (
                await Promise.all(
                  row.manuals
                    .split(";")
                    .map((url) => convertGoogleDriveUrl(url.trim()))
                    .map(async (url) => (isValidUrlSync(url) ? { url: await uploadFileToCloudinary(url, "bricchihnos/manuals") } : null))
                )
              ).filter((manual) => manual !== null) // Filtrar nulos después de Promise.all
            : [];

          // Crear el producto con las URLs en Cloudinary
          const product = new Product({
            name: row.name,
            category: row.category,
            subCategory: row.subCategory || null,
            brand: row.brand || null,
            specifications: row.specifications,
            mainImageUrl: mainImageUrlCloudinary,
            secondaryImageUrls,
            technical_sheet: {
              file_name: row.technicalSheetFileName,
              url: technicalSheetUrl,
            },
            manuals,
          });

          await product.save();
          existingProductNames.add(row.name); // Añadir a los productos existentes para evitar duplicados en el mismo archivo
        }
        res.status(200).send("Productos agregados exitosamente");
      } catch (error) {
        console.error("Error al guardar los productos:", error);
        res.status(500).send("Error al procesar los datos CSV");
      }
    });
});


// GET all products with pagination
app.get("/api/products", async (req, res) => {
  try {
    console.log("Query params:", req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();
    // Aquí se usa populate para traer los nombres de las categorías en lugar de los IDs
    const products = await Product.find()
      .populate("category", "name")  // populate trae solo el campo "name"
      .populate("subCategory", "name")  // Traer subcategoría si aplica
      .skip(skip)
      .limit(limit);

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
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate({
        path: "brand",
        select: "name subSubCategories",
        populate: {
          path: "subSubCategories",
          model: "SubSubCategory",
        },
      })
      .populate({
        path: "subCategory",
        select: "name",
      });

    console.log("product:", product);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Estructurar la respuesta
    const response = {
      name: product.name,
      category: product.category ? { _id: product.category._id, name: product.category.name } : null,
      brand: product.brand ? {
        _id: product.brand._id,
        name: product.brand.name,
        subSubCategories: product.brand.subSubCategories // Aquí se incluyen las sub-subcategorías de la marca
      } : null,
      subCategory: product.subCategory ? { _id: product.subCategory._id, name: product.subCategory.name, subSubCategories: product.subCategory.subSubCategories } : null,
      specifications: product.specifications,
      mainImageUrl: product.mainImageUrl,
      secondaryImageUrls: product.secondaryImageUrls || [],
      technical_sheet: product.technical_sheet
        ? {
          file_name: product.technical_sheet.file_name,
          url: product.technical_sheet.url,
        }
        : null,
      manuals: product.manuals
        ? product.manuals.map((manual) => ({
          file_name: manual.file_name,
          url: manual.url,
        }))
        : [],
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// POST - Add a new product
app.post("/api/add-product", uploadMiddleware, async (req, res) => {
  try {
    console.log("Body:", req.body);
    console.log("Files:", req.files);

    const { name, category, brand, subCategory, specifications } = req.body;

    // Validar el nombre del producto
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "El nombre del producto es obligatorio." });
    }

    // Procesar imágenes
    let mainImageUrl = "";
    let secondaryImageUrls = [];
    if (req.files && req.files["images"] && req.files["images"].length > 0) {
      mainImageUrl = req.files["images"][0].path;
      secondaryImageUrls = req.files["images"].slice(1).map((file) => file.path);
    }

    // Procesar la ficha técnica
    let technicalSheetUrl = "";
    if (req.files && req.files["technical_sheet"] && req.files["technical_sheet"].length > 0) {
      technicalSheetUrl = req.files["technical_sheet"][0].path;
    }

    // Procesar los manuales
    let manualUrls = [];
    if (req.files && req.files["manuals"]) {
      manualUrls = req.files["manuals"].map((file) => file.path);
    }

    // Crear el producto
    const product = new Product({
      name,
      category,
      brand, // Incluir marca
      subCategory, // Incluir subcategoría
      specifications,
      mainImageUrl,
      secondaryImageUrls,
      technical_sheet: {
        file_name: req.files["technical_sheet"] ? req.files["technical_sheet"][0].originalname : "",
        url: technicalSheetUrl,
      },
      manuals: manualUrls.map((url, index) => ({
        file_name: req.files["manuals"] ? req.files["manuals"][index].originalname : "",
        url,
      })),
    });

    await product.save();
    console.log("Producto guardado:", product);

    // Recuperar el producto para asegurarse que la subcategoría esté correctamente guardada
    const savedProduct = await Product.findById(product._id)
      .populate("category", "name")
      .populate({
        path: "brand",
        select: "name subSubCategories",
        populate: {
          path: "subSubCategories",
          model: "SubSubCategory",
        },
      })
      .populate({
        path: "subCategory",
        select: "name",
      });

    console.log("Producto guardado con las referencias:", savedProduct);

    res.status(200).json({ message: "Producto agregado exitosamente", product: savedProduct });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});


// GET - Obtener una marca específica por ID
app.get("/api/brand/:id", async (req, res) => {
  try {
    const brand = await SubCategory.findById(req.params.id).populate('subcategories');

    if (!brand) {
      return res.status(404).json({ message: "Marca no encontrada" });
    }

    res.status(200).json({ category: brand });
  } catch (err) {
    console.error("Error fetching brand:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// GET - Obtener una subcategoría específica por ID
app.get("/api/subcategory/:id", async (req, res) => {
  try {
    const subcategory = await SubSubCategory.findById(req.params.id);

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategoría no encontrada" });
    }

    res.status(200).json({ category: subcategory });
  } catch (err) {
    console.error("Error fetching subcategory:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});


// PUT - Actualizar una categoría por ID
app.put("/api/edit-category/:id", async (req, res) => {
  try {
    const { name, isMainCategory, parentCategory, categoryType, mainCategoryId } = req.body;

    console.log("Body:", req.body);

    // Validar nombre de la categoría
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "El nombre de la categoría es obligatorio." });
    }

    let updatedCategory;

    // Lógica para categorías no principales
    if (!isMainCategory) {
      if (!parentCategory || !mainCategoryId) {
        return res.status(400).json({ message: "Categoría padre o ID de categoría principal no especificado." });
      }

      if (categoryType === "brand") {
        // Actualizar una marca dentro de la categoría principal
        updatedCategory = await SubCategory.findByIdAndUpdate(
          req.params.id,
          { name },
          { new: true }
        );

        // Verificar si la marca está correctamente asociada a la categoría principal
        const mainCategory = await Category.findById(mainCategoryId);
        if (mainCategory && !mainCategory.subcategories.includes(updatedCategory._id)) {
          mainCategory.subcategories.push(updatedCategory._id);
          await mainCategory.save();
        }
      } else if (categoryType === "subcategory") {
        // Actualizar una subcategoría dentro de una marca específica
        updatedCategory = await SubSubCategory.findByIdAndUpdate(
          req.params.id,
          { name },
          { new: true }
        );

        // Verificar si la subcategoría está correctamente asociada a la marca padre
        const parentBrand = await SubCategory.findById(parentCategory);
        if (parentBrand && !parentBrand.subcategories.includes(updatedCategory._id)) {
          parentBrand.subcategories.push(updatedCategory._id);
          await parentBrand.save();
        }
      } else {
        return res.status(400).json({ message: "Tipo de categoría inválido." });
      }
    } else {
      // Actualizar una categoría principal
      updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        { name, isMainCategory: true },
        { new: true }
      );
    }

    res.status(200).json({ message: "Categoría actualizada con éxito", category: updatedCategory });
  } catch (err) {
    console.error("Error actualizando categoría:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
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


// DELETE - Eliminar una categoría por ID
app.delete("/api/delete-category/:id", async (req, res) => {
  try {
    const { categoryType, parentCategory } = req.query;

    if (categoryType === "brand") {
      // Eliminar marca
      const brand = await SubCategory.findByIdAndRemove(req.params.id);
      if (!brand) {
        return res.status(404).json({ message: "Marca no encontrada." });
      }

      // Remover la marca de la categoría principal
      await Category.findByIdAndUpdate(parentCategory, { $pull: { subcategories: req.params.id } });
    } else if (categoryType === "subcategory") {
      // Eliminar subcategoría
      const subcategory = await SubSubCategory.findByIdAndRemove(req.params.id);
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategoría no encontrada." });
      }

      // Remover la subcategoría de la marca padre
      await SubCategory.findByIdAndUpdate(parentCategory, { $pull: { subcategories: req.params.id } });
    } else {
      // Eliminar una categoría principal
      await Category.findByIdAndRemove(req.params.id);
    }

    res.status(200).json({ message: "Categoría eliminada con éxito" });
  } catch (err) {
    console.error("Error eliminando categoría:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
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

// POST - Añadir una nueva categoría, subcategoría o sub-subcategoría
app.post("/api/add-category", async (req, res) => {
  try {
    const { name, parentCategory, isMainCategory, categoryType } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "El nombre de la categoría es obligatorio." });
    }

    let newCategory;

    // Lógica para categorías no principales
    if (!isMainCategory) {
      if (!parentCategory) {
        return res.status(400).json({ message: "Categoría padre no especificada." });
      }

      if (categoryType === "brand") {
        // Crear una nueva marca dentro de la categoría principal
        const parent = await Category.findById(parentCategory);
        if (!parent) {
          return res.status(404).json({ message: "Categoría principal no encontrada." });
        }

        newCategory = new SubCategory({ name });
        parent.subcategories.push(newCategory._id);
        await newCategory.save();
        await parent.save();
      } else if (categoryType === "subcategory") {
        // Crear una subcategoría dentro de una marca específica
        const parentBrand = await SubCategory.findById(parentCategory);
        if (!parentBrand) {
          return res.status(404).json({ message: "Marca padre no encontrada." });
        }

        newCategory = new SubSubCategory({ name });
        parentBrand.subSubCategories.push(newCategory._id); // Asegúrate de que sea subSubCategories
        await newCategory.save();
        await parentBrand.save();
      } else {
        return res.status(400).json({ message: "Tipo de categoría inválido." });
      }
    } else {
      // Crear una categoría principal
      newCategory = new Category({
        name,
        subcategories: [],
      });
      await newCategory.save();
    }

    res.status(200).json({ message: "Categoría añadida con éxito", category: newCategory });
  } catch (err) {
    console.error("Error añadiendo categoría:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});




// GET - Obtener todas las categorías (sin filtro, devolver todas)
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find()
      .populate({
        path: 'subcategories',
        populate: {
          path: 'subSubCategories', // Asegúrate de que este campo sea correcto
          model: 'SubSubCategory',
        },
      });

    res.status(200).json({ categories });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT - Actualizar una categoría por ID
app.put("/api/edit-category/:id", async (req, res) => {
  try {
    const { name, isMainCategory, parentCategory, categoryType, mainCategoryId } = req.body;

    console.log("Body:", req.body);

    // Validar nombre de la categoría
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "El nombre de la categoría es obligatorio." });
    }

    let updatedCategory;

    // Lógica para categorías no principales
    if (!isMainCategory) {
      if (!parentCategory || !mainCategoryId) {
        return res.status(400).json({ message: "Categoría padre o ID de categoría principal no especificado." });
      }

      if (categoryType === "brand") {
        // Actualizar una marca dentro de la categoría principal
        updatedCategory = await SubCategory.findByIdAndUpdate(
          req.params.id,
          { name },
          { new: true }
        );

        // Verificar si la marca está correctamente asociada a la categoría principal
        const mainCategory = await Category.findById(mainCategoryId);
        if (mainCategory && !mainCategory.subcategories.includes(updatedCategory._id)) {
          mainCategory.subcategories.push(updatedCategory._id);
          await mainCategory.save();
        }
      } else if (categoryType === "subcategory") {
        // Actualizar una subcategoría dentro de una marca específica
        updatedCategory = await SubSubCategory.findByIdAndUpdate(
          req.params.id,
          { name },
          { new: true }
        );

        // Verificar si la subcategoría está correctamente asociada a la marca padre
        const parentBrand = await SubCategory.findById(parentCategory);
        if (parentBrand && !parentBrand.subcategories.includes(updatedCategory._id)) {
          parentBrand.subcategories.push(updatedCategory._id);
          await parentBrand.save();
        }
      } else {
        return res.status(400).json({ message: "Tipo de categoría inválido." });
      }
    } else {
      // Actualizar una categoría principal
      updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        { name, isMainCategory: true },
        { new: true }
      );
    }

    res.status(200).json({ message: "Categoría actualizada con éxito", category: updatedCategory });
  } catch (err) {
    console.error("Error actualizando categoría:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});


// Listen port
app.listen(5001, () => {
  console.log("Server listening on port", 5001);
});

