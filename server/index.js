require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");
const mongoose = require("mongoose");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const cookieParser = require("cookie-parser");
const Product = require("./models/Product");
const { Category, SubCategory, SubSubCategory } = require('./models/Category');
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(morgan("dev"));

// Ruta estática del archivo CSV
const staticFilePath = "./uploads/Productos-BricchiHnos.csv";

// Configuración de Cloudinary
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
    origin: [
      "https://server-dashboardbricchihnos.vercel.app",
      "https://www.bricchihnos.com",
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.FRONTEND_PUBLIC_URL
    ],
  })
);

// Función para convertir URLs de Google Drive a enlaces de descarga directa
function convertGoogleDriveUrl(url) {
  const regex = /\/d\/([a-zA-Z0-9-_]+)\//;
  const match = url.match(regex);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url; // Retorna la URL original si no coincide con el patrón
}

// Conexión a la base de datos
mongoose.connect(process.env.DB_HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// // Manejar la conexión a la base de datos
// mongoose.connection.once("open", async () => {
//   try {
//     console.log("Connected to the database");

//     // Cargar los productos desde el CSV
//     await loadCSVOnStartup();

//     console.log("Server ready with products loaded");

//     // No cerrar la conexión aquí para mantener el servidor activo
//     // mongoose.connection.close();
//   } catch (error) {
//     console.error("Error deleting products or loading CSV:", error);
//     // mongoose.connection.close();
//   }
// });

// Función para subir un archivo a Cloudinary desde una URL
async function uploadFileToCloudinary(fileUrl, folder = "bricchihnos") {
  try {
    // Convertir la URL de Google Drive a enlace de descarga directa
    const directUrl = convertGoogleDriveUrl(fileUrl);

    // Descargar el archivo como stream
    const response = await axios({
      url: directUrl,
      method: "GET",
      responseType: "stream",
    });

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto" }, // resource_type para manejar diferentes tipos de archivos
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

// Función para cargar y procesar el CSV al iniciar el servidor
// Función para cargar y procesar el CSV al iniciar el servidor
// Función para cargar y procesar el CSV al iniciar el servidor
const loadCSVOnStartup = async () => {
  const products = [];
  let totalProducts = 0;
  let successfullyLoaded = 0;
  let failedLoads = 0;

  try {
    if (!fs.existsSync(staticFilePath)) {
      console.log("El archivo CSV no existe en la ubicación especificada.");
      return;
    }

    // Crear un stream para leer el CSV
    const csvStream = fs.createReadStream(staticFilePath).pipe(csv());

    for await (const row of csvStream) {
      totalProducts += 1;
      console.log(`Procesando producto ${totalProducts}: ${row.name || "Sin nombre"}`);

      // Validar que los campos obligatorios existan
      if (!row.name || !row.category) {
        console.warn(`Producto ${totalProducts} ignorado debido a datos faltantes:`, row);
        failedLoads += 1;
        continue; // Ignorar registros incompletos
      }

      try {
        // Subir imagen principal a Cloudinary si existe
        let mainImageUrlCloudinary = null;
        if (row.mainImageUrl && isValidUrlSync(row.mainImageUrl)) {
          mainImageUrlCloudinary = await uploadFileToCloudinary(row.mainImageUrl);
          if (mainImageUrlCloudinary) {
            console.log(`Imagen principal subida para producto ${row.name}`);
          } else {
            console.warn(`Fallo al subir la imagen principal para producto ${row.name}`);
          }
        }

        // Subir imágenes secundarias a Cloudinary si existen
        let secondaryImageUrlsCloudinary = [];
        if (row.secondaryImageUrls) {
          const secondaryUrls = row.secondaryImageUrls
            .split(";")
            .map(url => url.trim())
            .filter(url => isValidUrlSync(url));

          for (const url of secondaryUrls) {
            const uploadedUrl = await uploadFileToCloudinary(url);
            if (uploadedUrl) {
              secondaryImageUrlsCloudinary.push(uploadedUrl);
              console.log(`Imagen secundaria subida para producto ${row.name}`);
            } else {
              console.warn(`Fallo al subir una imagen secundaria para producto ${row.name}`);
            }
          }
        }

        // Subir hoja técnica a Cloudinary si existe
        let technicalSheetUrlCloudinary = null;
        if (row.technicalSheetUrl && isValidUrlSync(row.technicalSheetUrl)) {
          technicalSheetUrlCloudinary = await uploadFileToCloudinary(row.technicalSheetUrl, "bricchihnos/pdfs");
          if (technicalSheetUrlCloudinary) {
            console.log(`Hoja técnica subida para producto ${row.name}`);
          } else {
            console.warn(`Fallo al subir la hoja técnica para producto ${row.name}`);
          }
        }

        // Subir manuales a Cloudinary si existen
        let manualsCloudinary = [];
        if (row.manuals) {
          const manualUrls = row.manuals
            .split(";")
            .map(url => url.trim())
            .filter(url => isValidUrlSync(url));

          for (const url of manualUrls) {
            const uploadedUrl = await uploadFileToCloudinary(url, "bricchihnos/manuals");
            if (uploadedUrl) {
              manualsCloudinary.push({ url: uploadedUrl });
              console.log(`Manual subido para producto ${row.name}`);
            } else {
              console.warn(`Fallo al subir un manual para producto ${row.name}`);
            }
          }
        }

        // Crear el objeto del producto
        const product = {
          name: row.name,
          category: row.category,
          subCategory: row.subCategory || null,
          brand: row.brand || null,
          specifications: row.specifications || null,
          mainImageUrl: mainImageUrlCloudinary,
          secondaryImageUrls: secondaryImageUrlsCloudinary,
          technical_sheet: {
            file_name: row.technicalSheetFileName || null,
            url: technicalSheetUrlCloudinary,
          },
          manuals: manualsCloudinary,
        };

        products.push(product);
        successfullyLoaded += 1;
        console.log(`Producto ${totalProducts} (${row.name}) cargado exitosamente.`);
      } catch (productError) {
        console.error(`Error al procesar el producto ${totalProducts}:`, productError);
        failedLoads += 1;
      }
    }

    // Insertar los productos en la base de datos
    if (products.length > 0) {
      try {
        await Product.insertMany(products);
        console.log("Todos los productos han sido insertados en la base de datos.");
      } catch (dbError) {
        console.error("Error al insertar productos en la base de datos:", dbError);
      }
    }

    // Resumen de la carga
    console.log(`\nResumen de la carga CSV:`);
    console.log(`Total de productos procesados: ${totalProducts}`);
    console.log(`Productos cargados exitosamente: ${successfullyLoaded}`);
    console.log(`Productos fallidos: ${failedLoads}`);
    console.log("Carga de productos completada.");
  } catch (error) {
    console.error("Error al procesar el archivo CSV:", error);
  }
};

// Validar URL
function isValidUrlSync(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

app.get("/api/categories-structured", async (req, res) => {
  try {
    if (!fs.existsSync(staticFilePath)) {
      return res.status(400).json({ message: "El archivo CSV no existe." });
    }

    const categories = {};

    // Leer y procesar el archivo CSV
    const csvStream = fs.createReadStream(staticFilePath).pipe(csv());

    for await (const row of csvStream) {
      const category = row.category?.trim();
      const subCategory = row.subCategory?.trim();
      const brand = row.brand?.trim();

      if (!category || !subCategory || !brand) continue;

      if (!categories[category]) {
        categories[category] = {};
      }

      if (!categories[category][subCategory]) {
        categories[category][subCategory] = new Set();
      }

      categories[category][subCategory].add(brand);
    }

    // Transformar a estructura JSON
    const structuredData = Object.keys(categories).map((category) => ({
      category,
      subcategories: Object.keys(categories[category]).map((subCategory) => ({
        name: subCategory,
        brands: Array.from(categories[category][subCategory]),
      })),
    }));

    res.status(200).json(structuredData);
  } catch (error) {
    console.error("Error al procesar las categorías:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
});

// Endpoint para cargar el CSV manualmente (opcional)
app.post("/api/upload-csv", uploadMiddleware, async (req, res) => {
  const csvFile = req.files && req.files["csv"] ? req.files["csv"][0] : null;

  if (!csvFile) {
    return res.status(400).send("No se recibió ningún archivo CSV");
  }

  const results = [];
  const csvStream = fs.createReadStream(csvFile.path).pipe(csv());

  try {
    for await (const row of csvStream) {
      // Similar al loadCSVOnStartup
      if (!row.name || !row.category) {
        console.warn("Registro ignorado debido a datos faltantes:", row);
        continue;
      }

      // Subir imágenes a Cloudinary
      let mainImageUrlCloudinary = null;
      if (row.mainImageUrl && isValidUrlSync(row.mainImageUrl)) {
        mainImageUrlCloudinary = await uploadFileToCloudinary(row.mainImageUrl);
      }

      let secondaryImageUrlsCloudinary = [];
      if (row.secondaryImageUrls) {
        const secondaryUrls = row.secondaryImageUrls.split(";").map(url => url.trim()).filter(url => isValidUrlSync(url));
        for (const url of secondaryUrls) {
          const uploadedUrl = await uploadFileToCloudinary(url);
          if (uploadedUrl) {
            secondaryImageUrlsCloudinary.push(uploadedUrl);
          }
        }
      }

      let technicalSheetUrlCloudinary = null;
      if (row.technicalSheetUrl && isValidUrlSync(row.technicalSheetUrl)) {
        technicalSheetUrlCloudinary = await uploadFileToCloudinary(row.technicalSheetUrl, "bricchihnos/pdfs");
      }

      let manualsCloudinary = [];
      if (row.manuals) {
        const manualUrls = row.manuals.split(";").map(url => url.trim()).filter(url => isValidUrlSync(url));
        for (const url of manualUrls) {
          const uploadedUrl = await uploadFileToCloudinary(url, "bricchihnos/manuals");
          if (uploadedUrl) {
            manualsCloudinary.push({ url: uploadedUrl });
          }
        }
      }

      const product = new Product({
        name: row.name,
        category: row.category,
        subCategory: row.subCategory || null,
        brand: row.brand || null,
        specifications: row.specifications || null,
        mainImageUrl: mainImageUrlCloudinary,
        secondaryImageUrls: secondaryImageUrlsCloudinary,
        technical_sheet: {
          file_name: row.technicalSheetFileName || null,
          url: technicalSheetUrlCloudinary,
        },
        manuals: manualsCloudinary,
      });

      await product.save();
      results.push(product);
    }

    res.status(200).send(`Productos agregados exitosamente. Total: ${results.length}`);
  } catch (error) {
    console.error("Error al guardar los productos:", error);
    res.status(500).send("Error al procesar los datos CSV");
  } finally {
    // Eliminar el archivo CSV temporal
    fs.unlink(csvFile.path, (err) => {
      if (err) console.error("Error al eliminar el archivo CSV temporal:", err);
    });
  }
});

// Endpoint para consultar los productos cargados
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error al obtener los productos:", error);
    res.status(500).send("Error al obtener los productos.");
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
        if (parentBrand && !parentBrand.subSubCategories.includes(updatedCategory._id)) {
          parentBrand.subSubCategories.push(updatedCategory._id);
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

// // DELETE - Delete a product by ID
// app.delete("/api/delete-product/:id", async (req, res) => {
//   try {
//     const productId = req.params.id;
//     const product = await Product.findByIdAndRemove(productId);
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }
//     res.status(200).json({ message: "Product deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

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
      await SubCategory.findByIdAndUpdate(parentCategory, { $pull: { subSubCategories: req.params.id } });
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

// // DELETE - Delete a product by name
// app.delete("/api/delete-product-by-name/:name", async (req, res) => {
//   try {
//     const productName = req.params.name;
//     const product = await Product.findOneAndDelete({ name: productName });
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }
//     res.status(200).json({ message: "Product deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

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
        file_name: req.files["technical_sheet"] ? req.files["technical_sheet"][0].originalname : "",
        url: req.files["technical_sheet"][0].path,
      };
    }

    if (req.files && req.files["manuals"] && req.files["manuals"].length > 0) {
      updatedFields.manuals = req.files["manuals"].map((file, index) => ({
        file_name: req.files["manuals"] ? req.files["manuals"][index].originalname : "",
        url: file.path,
      }));
    }

    const product = await Product.findByIdAndUpdate(productId, updatedFields, { new: true });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error("Error updating product:", err);
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

// Listen port
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
