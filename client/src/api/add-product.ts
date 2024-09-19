// Configuración de formidable para manejar archivos
export const config = {
  api: {
    bodyParser: false,
  },
};

// Función de manejo para la API
export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    const form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing the form:", err);
        return res.status(500).json({ error: "Error parsing the form" });
      }

      try {
        // Extracción de los campos del formulario
        const {
          name,
          description,
          category,
          subCategory,
          stock,
          specifications,
          additional_info,
        } = fields;

        // Validar campos requeridos
        if (!name || !description || !category || !specifications) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Manejo de archivos subidos (Ficha Técnica, Manuales, Imágenes)
        const technicalSheet = files.technical_sheet ? files.technical_sheet : null;
        const manuals = files.manuals ? files.manuals : [];
        const mainImageUrl = files.images ? files.images : null;
        const secondaryImages = files.secondaryImages ? files.secondaryImages : [];

        // Guardar producto en MongoDB
        const newProduct = new Product({
          name,
          category,
          subCategory,
          specifications,
          stock: stock ? parseInt(stock as string) : 0,
          additional_info,
          images: [
            { url: mainImageUrl?.filepath, description: "Main image" },
            ...secondaryImages.map((img: any) => ({
              url: img.filepath,
              description: "Secondary image",
            })),
          ],
          technical_sheet: technicalSheet
            ? {
              file_name: technicalSheet.originalFilename,
              url: technicalSheet.filepath,
            }
            : null,
          manuals: manuals.map((manual: any) => ({
            file_name: manual.originalFilename,
            url: manual.filepath,
          })),
        });

        await newProduct.save();

        // Responder con éxito
        res.status(200).json({ message: "Product added successfully", product: newProduct });
      } catch (error) {
        console.error("Error saving product:", error);
        res.status(500).json({ error: "Error saving product" });
      }
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
