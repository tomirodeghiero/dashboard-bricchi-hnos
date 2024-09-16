// Configuración de formidable para manejar archivos
export const config = {
  api: {
    bodyParser: false, // Desactiva el bodyParser porque vamos a manejar archivos con formidable
  },
};

import Product from "./models/Product"; // Importa tu modelo Product
import formidable from "formidable"; // Asegúrate de que lo tienes instalado y configurado

export default async function handler(req: any, res: any) {
  if (req.method === "PUT") {
    const form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error al procesar el formulario:", err);
        return res.status(500).json({ error: "Error al procesar el formulario" });
      }

      try {
        // Extrae los campos del formulario
        const { name, description, category, stock, specifications, additional_info } = fields;
        const productId = req.query.id;

        // Verifica si el producto existe en la base de datos
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ error: "Producto no encontrado" });
        }

        // Manejo de archivos subidos (Ficha Técnica, Manuales, Imágenes)
        const technicalSheet = files.technical_sheet ? files.technical_sheet : null;
        const manuals = files.manuals ? files.manuals : [];
        const mainImageUrl = files.images ? files.images : null;
        const secondaryImages = files.secondaryImages ? files.secondaryImages : [];

        // Actualización de los campos del producto (si los nuevos datos existen en el formulario)
        product.name = name || product.name;
        product.description = description || product.description;
        product.category = category || product.category;
        product.specifications = specifications || product.specifications;
        product.stock = stock ? parseInt(stock as string) : product.stock;
        product.additional_info = additional_info || product.additional_info;

        // Si hay nuevos archivos, los actualizamos
        if (mainImageUrl) {
          product.mainImageUrl = mainImageUrl.filepath; // Actualiza la URL de la imagen principal
        }

        if (secondaryImages.length > 0) {
          product.secondaryImageUrls = secondaryImages.map((img: any) => img.filepath); // Actualiza las URLs de las imágenes secundarias
        }

        if (technicalSheet) {
          product.technical_sheet = {
            file_name: technicalSheet.originalFilename,
            url: technicalSheet.filepath, // Actualiza la URL de la ficha técnica
          };
        }

        if (manuals.length > 0) {
          product.manuals = manuals.map((manual: any) => ({
            file_name: manual.originalFilename,
            url: manual.filepath, // Actualiza los manuales subidos
          }));
        }

        // Guarda el producto actualizado en la base de datos
        await product.save();

        res.status(200).json({ message: "Producto actualizado exitosamente", product });
      } catch (error) {
        console.error("Error al actualizar el producto:", error);
        res.status(500).json({ error: "Error al actualizar el producto" });
      }
    });
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}
