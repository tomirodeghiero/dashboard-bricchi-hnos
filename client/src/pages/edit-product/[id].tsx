import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { CATEGORIES } from "src/utils/constants";
import { toast, ToastContainer } from "react-toastify";
import { FormControl, InputLabel, MenuItem, Select, Button } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const EditProductPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [technicalSheet, setTechnicalSheet] = useState<File | null>(null);
  const [manuals, setManuals] = useState<File[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<File[]>([]);

  const [existingTechnicalSheetUrl, setExistingTechnicalSheetUrl] = useState<string | null>(null);
  const [existingManualUrls, setExistingManualUrls] = useState<string[]>([]);
  const [existingMainImageUrl, setExistingMainImageUrl] = useState<string | null>(null);
  const [existingPreviewImagesUrls, setExistingPreviewImagesUrls] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await fetch(`/api/product/${id}`);
          if (response.ok) {
            const data = await response.json();
            setProductName(data.name);
            setCategory(data.category);
            setSpecifications(data.specifications);

            setExistingMainImageUrl(data.mainImageUrl);
            setExistingPreviewImagesUrls(data.secondaryImageUrls || []);
            setExistingTechnicalSheetUrl(data.technical_sheet?.url || null);
            setExistingManualUrls(data.manuals.map((manual: any) => manual.url));
          } else {
            toast.error("Error al cargar el producto", { position: "top-center" });
          }
        } catch (error) {
          console.error("Error al cargar el producto:", error);
        }
      };
      fetchProduct();
    }
  }, [id]);

  const handleSubmitProduct = async (e: any) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", productName);
    formData.append("category", category);
    formData.append("specifications", specifications);

    if (technicalSheet) {
      formData.append("technical_sheet", technicalSheet, technicalSheet.name);
    }

    manuals.forEach((manual, index) => {
      formData.append("manuals", manual, manual.name);
    });

    if (mainImageUrl) {
      formData.append("images", mainImageUrl, mainImageUrl.name);
    }

    previewImages.forEach((image, index) => {
      formData.append("images", image, `secondary-image-${index}`);
    });

    try {
      const response = await fetch(`/api/edit-product/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        toast.success("Producto editado exitosamente", { position: "top-center" });
        router.push("/my-products");
      } else {
        toast.error("Error al editar el producto", { position: "top-center" });
      }
    } catch (error) {
      console.error("Error al editar el producto:", error);
      toast.error("Error inesperado", { position: "top-center" });
    }
  };

  const handleFileChange = (setter: Function) => (event: any) => {
    const file = event.target.files[0];
    if (file) setter(file);
  };

  return (
    <>
      <div className="lg:flex w-full gap-8">
        <div className="w-full lg:1/2">
          <p className="uppercase font-medium text-sm text-gray-500">✏️ ¡Editar producto!</p>

          <input
            className="text-gray-800 px-2 h-14 bg-gray-200 mt-1 text-4xl w-full font-medium"
            value={productName}
            placeholder="Nombre del producto"
            onChange={(e) => setProductName(e.target.value)}
          />

          <div className="mt-5">
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Categoría"
              >
                {CATEGORIES.map((categoryOption, index) => (
                  <MenuItem key={index} value={categoryOption}>
                    {categoryOption}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="mt-5">
            <ReactQuill value={specifications} onChange={setSpecifications} />
          </div>

          <div className="mt-5">
            {existingTechnicalSheetUrl ? (
              <a href={existingTechnicalSheetUrl} target="_blank" rel="noopener noreferrer">
                Ver ficha técnica actual
              </a>
            ) : (
              "No hay ficha técnica subida."
            )}
            <input
              type="file"
              onChange={handleFileChange(setTechnicalSheet)}
              accept="application/pdf"
              className="hidden"
              id="technicalSheet"
            />
            <label htmlFor="technicalSheet" className="bg-gray-200 px-4 py-2 rounded cursor-pointer">
              Subir nueva Ficha Técnica (PDF)
            </label>
          </div>

          <div className="mt-5">
            {existingManualUrls.length > 0 ? (
              <div>
                {existingManualUrls.map((manualUrl, index) => (
                  <a key={index} href={manualUrl} target="_blank" rel="noopener noreferrer">
                    Ver manual {index + 1}
                  </a>
                ))}
              </div>
            ) : (
              "No hay manuales subidos."
            )}
            <input
              type="file"
              multiple
              onChange={handleFileChange(setManuals)}
              accept="application/pdf"
              className="hidden"
              id="manualFiles"
            />
            <label htmlFor="manualFiles" className="bg-gray-200 px-4 py-2 rounded cursor-pointer">
              Subir nuevos Manuales (PDF)
            </label>
          </div>

          <div className="mt-5">
            {existingMainImageUrl && (
              <img src={existingMainImageUrl} alt="Imagen principal actual" className="w-48 h-48 mt-5 mx-auto rounded" />
            )}
            <input
              type="file"
              onChange={handleFileChange(setMainImageUrl)}
              accept="image/*"
              className="hidden"
              id="mainImage"
            />
            <label htmlFor="mainImage" className="bg-gray-200 px-4 py-2 rounded cursor-pointer">
              Subir nueva Imagen Principal
            </label>
          </div>

          <div className="mt-5">
            {existingPreviewImagesUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full mt-4">
                {existingPreviewImagesUrls.map((url, index) => (
                  <img key={index} src={url} alt={`Imagen secundaria ${index}`} className="object-cover h-full w-full rounded" />
                ))}
              </div>
            )}
            <input
              type="file"
              multiple
              onChange={handleFileChange(setPreviewImages)}
              accept="image/*"
              className="hidden"
              id="secondaryImages"
            />
            <label htmlFor="secondaryImages" className="bg-gray-200 px-4 py-2 rounded cursor-pointer">
              Subir nuevas Imágenes Secundarias
            </label>
          </div>

          <div className="w-full lg:1/2 mt-4">
            <Button onClick={handleSubmitProduct} variant="contained">
              Editar Producto
            </Button>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
};

export default EditProductPage;
