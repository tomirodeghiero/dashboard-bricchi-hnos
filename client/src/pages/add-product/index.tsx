import React, { useState, useRef } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
} from "@mui/material";
import dynamic from "next/dynamic";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CATEGORIES } from "src/utils/constants";
import { addBreaksAfterPeriods } from "src/utils/functions";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const AddProductPage = () => {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [technicalSheet, setTechnicalSheet] = useState<File | null>(null);
  const [manuals, setManuals] = useState<File[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<File[]>([]);
  const formRef = useRef(null);

  const showErrorMessage = (message: string) => {
    toast.error(message, {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  };

  const handleSubmitProduct = async (e: any) => {
    e.preventDefault();

    if (!productName) return showErrorMessage("El nombre del producto está vacío");
    if (!category) return showErrorMessage("La categoría no está especificada");
    if (!mainImageUrl) return showErrorMessage("La imagen principal está vacía");
    if (!technicalSheet) return showErrorMessage("La ficha técnica está vacía");

    const formData = new FormData();
    formData.append("name", productName);
    formData.append("category", category);
    formData.append("specifications", specifications);
    formData.append("additional_info", "");

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
      const response = await fetch("/api/add-product", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Reset form and scroll to top
        setProductName("");
        setCategory("");
        setSpecifications("");
        setMainImageUrl(null);
        setPreviewImages([]);
        setTechnicalSheet(null);
        setManuals([]);
        toast.success("Producto agregado exitosamente", {
          position: "top-center",
          autoClose: 5000,
        });

        // Scroll to top
        formRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        toast.error("Falló al agregar el producto", { position: "top-center" });
      }
    } catch (error) {
      console.error(error);
      alert("Error al agregar el producto");
    }
  };

  const handleSecondaryImagesChange = (event: any) => {
    const files = Array.from(event.target.files);
    setPreviewImages((prevImages) => [...prevImages, ...files]);
  };

  const handleManualChange = (event: any) => {
    const files = Array.from(event.target.files);
    setManuals((prev) => [...prev, ...files]);
  };

  const handleMainImageChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      setMainImageUrl(file);
    }
  };

  return (
    <>
      <div ref={formRef} className="lg:flex w-full gap-8">
        <div className="w-full lg:1/2">
          <p className="uppercase font-medium text-sm text-gray-500">
            🛍️ ¡Agregar un nuevo producto!
          </p>
          <div className="flex gap-5 items-center">
            <input
              className="text-gray-800 px-2 h-14 bg-gray-200 mt-1 text-4xl w-full font-medium"
              value={productName}
              placeholder="Nombre del producto"
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

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
            <ReactQuill
              value={addBreaksAfterPeriods(specifications)}
              onChange={setSpecifications}
            />
          </div>

          <div className="mt-5">
            <input
              type="file"
              onChange={(e: any) => setTechnicalSheet(e.target.files[0])}
              accept="application/pdf"
              className="hidden"
              id="technicalSheet"
            />
            <label
              htmlFor="technicalSheet"
              className="bg-gray-200 px-4 py-2 rounded cursor-pointer"
            >
              {technicalSheet
                ? `Archivo subido: ${technicalSheet.name}`
                : "Subir Ficha Técnica (PDF)"}
            </label>
          </div>

          <div className="mt-5">
            <input
              type="file"
              multiple
              onChange={handleManualChange}
              accept="application/pdf"
              className="hidden"
              id="manualFiles"
            />
            <label
              htmlFor="manualFiles"
              className="bg-gray-200 px-4 py-2 rounded cursor-pointer"
            >
              Subir Manuales (PDF)
            </label>
            {manuals.length > 0 && (
              <ul className="mt-2">
                {manuals.map((manual, index) => (
                  <li key={index}>{manual.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-5">
            <input
              type="file"
              onChange={handleMainImageChange}
              accept="image/*"
              className="hidden"
              id="mainImage"
            />
            <label
              htmlFor="mainImage"
              className="bg-gray-200 px-4 py-2 rounded cursor-pointer"
            >
              {mainImageUrl
                ? `Imagen principal cargada: ${mainImageUrl.name}`
                : "Subir Imagen Principal"}
            </label>

            {mainImageUrl && (
              <div className="mt-4">
                <img
                  src={URL.createObjectURL(mainImageUrl)}
                  alt="Main Image Preview"
                  className="object-cover h-48 w-48 rounded"
                />
              </div>
            )}
          </div>

          <div className="mt-5">
            <input
              type="file"
              multiple
              onChange={handleSecondaryImagesChange}
              accept="image/*"
              className="hidden"
              id="secondaryImages"
            />
            <label
              htmlFor="secondaryImages"
              className="bg-gray-200 px-4 py-2 rounded cursor-pointer"
            >
              Subir Imágenes Secundarias
            </label>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full mt-4">
              {previewImages.map((previewImage, index) => (
                <div key={index}>
                  <img
                    src={URL.createObjectURL(previewImage)}
                    alt={`Secundaria ${index}`}
                    className="object-cover h-full w-full rounded"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:1/2 mt-4">
            <Button onClick={handleSubmitProduct} variant="contained">
              Agregar Producto
            </Button>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
};

export default AddProductPage;
