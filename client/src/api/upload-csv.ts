// pages/api/upload-csv.js
import formidable from "formidable";
import fs from "fs";
import Papa from "papaparse";
import Product from "../../models/Product"; // Asegúrate de que Product esté correctamente importado desde tu modelo

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error al procesar el formulario:", err);
        return res.status(500).json({ error: "Error al procesar el formulario" });
      }

      try {
        const filePath = files.file[0].filepath;
        const fileData = fs.readFileSync(filePath, "utf8");

        // Analizar CSV y convertirlo a JSON
        const parsedData = Papa.parse(fileData, { header: true, skipEmptyLines: true }).data;

        // Filtrar y eliminar datos duplicados antes de guardar en la base de datos
        const existingProductNames = new Set(
          (await Product.find({}, "name")).map((product) => product.name)
        );

        const newProducts = parsedData
          .slice(1) // Eliminar el primer registro de ejemplo
          .filter((row) => row.name && !existingProductNames.has(row.name)); // Validar y omitir duplicados

        const productsToSave = newProducts.map((row) => ({
          name: row.name,
          category: row.category || null,
          subCategory: row.subCategory || null,
          brand: row.brand || null,
          specifications: row.specifications || "",
          mainImageUrl: row.mainImageUrl || null,
          secondaryImageUrls: row.secondaryImageUrls ? row.secondaryImageUrls.split(";") : [],
          technical_sheet: row.technicalSheetFileName
            ? {
                file_name: row.technicalSheetFileName,
                url: row.technicalSheetUrl || null,
              }
            : null,
          manuals: row.manuals ? row.manuals.split(";").map((url) => ({ url })) : [],
        }));

        await Product.insertMany(productsToSave);

        res.status(200).json({ message: "Productos agregados exitosamente" });
      } catch (error) {
        console.error("Error al guardar productos:", error);
        res.status(500).json({ error: "Error al guardar productos en la base de datos" });
      }
    });
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}
