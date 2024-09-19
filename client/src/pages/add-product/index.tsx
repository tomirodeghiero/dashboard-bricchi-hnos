import React, { useState, useEffect, useRef } from "react";
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
import { addBreaksAfterPeriods } from "src/utils/functions";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const AddProductPage = () => {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [technicalSheet, setTechnicalSheet] = useState<File | null>(null);
  const [manuals, setManuals] = useState<File[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<File[]>([]);
  const [categories, setCategories] = useState([]);
  const formRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

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

    const formData = new FormData();
    formData.append("name", productName);

    if (category) formData.append("category", category);
    if (subCategory) formData.append("subCategory", subCategory);
    formData.append("specifications", specifications || "");

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
        setProductName("");
        setCategory("");
        setSubCategory("");
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

  const selectedCategory = categories.find((cat) => cat._id === category);

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
                {categories.map((categoryOption) => (
                  <MenuItem key={categoryOption._id} value={categoryOption._id}>
                    {categoryOption.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <div className="mt-5">
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Subcategoría</InputLabel>
                <Select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  label="Subcategoría"
                >
                  {selectedCategory.subcategories.map((subCat) => (
                    <MenuItem key={subCat._id} value={subCat._id}>
                      {subCat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          )}

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
