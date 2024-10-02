import React, { useState, useEffect, useRef } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Box,
} from "@mui/material";
import dynamic from "next/dynamic";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { addBreaksAfterPeriods } from "src/utils/functions";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const AddProductPage = () => {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [technicalSheet, setTechnicalSheet] = useState<File | null>(null);
  const [manuals, setManuals] = useState<File[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<File[]>([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  // Estado para almacenar las subcategorías
  const [subCategories, setSubCategories] = useState([]);

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

  const showErrorMessage = (message) => {
    toast.error(message, { position: "top-center", autoClose: 5000 });
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!productName) {
      showErrorMessage("El nombre del producto está vacío");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", productName);
    if (category) formData.append("category", category);
    if (brand) formData.append("brand", brand);
    if (subCategory) formData.append("subCategory", subCategory);
    formData.append("specifications", specifications || "");

    if (technicalSheet) formData.append("technical_sheet", technicalSheet, technicalSheet.name);
    manuals.forEach((manual) => formData.append("manuals", manual, manual.name));
    if (mainImageUrl) formData.append("images", mainImageUrl, mainImageUrl.name);
    previewImages.forEach((image, index) => formData.append("images", image, `secondary-image-${index}`));

    try {
      const response = await fetch("/api/add-product", { method: "POST", body: formData });
      if (response.ok) {
        toast.success("Producto agregado exitosamente", { position: "top-center", autoClose: 5000 });
        setProductName("");
        setCategory("");
        setBrand("");
        setSubCategory("");
        setSpecifications("");
        setMainImageUrl(null);
        setPreviewImages([]);
        setTechnicalSheet(null);
        setManuals([]);
        formRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        toast.error("Falló al agregar el producto", { position: "top-center" });
      }
    } catch (error) {
      console.error(error);
      showErrorMessage("Error al agregar el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleMainImageChange = (event) => {
    const file = event.target.files[0];
    if (file) setMainImageUrl(file);
  };

  const handleSecondaryImagesChange = (event) => {
    const files = Array.from(event.target.files);
    setPreviewImages((prevImages) => [...prevImages, ...files]);
  };

  const handleManualChange = (event) => {
    const files = Array.from(event.target.files);
    setManuals((prev) => [...prev, ...files]);
  };

  const selectedCategory = categories?.find((cat) => cat._id === category);
  const selectedBrand = selectedCategory?.subcategories?.find((subCat) => subCat._id === brand);

  // Actualiza las subcategorías cuando se selecciona una marca
  useEffect(() => {
    if (selectedBrand) {
      setSubCategories(selectedBrand.subSubCategories || []); // Suponiendo que 'subSubCategories' tiene la información de las subcategorías
      setSubCategory(""); // Reiniciar la subcategoría cuando se cambia la marca
    } else {
      setSubCategories([]); // Reiniciar las subcategorías si no hay marca seleccionada
    }
  }, [selectedBrand]);

  return (
    <>
      <div ref={formRef} className="flex justify-center items-center w-full">
        <Card className="shadow-lg w-full max-w-7xl">
          <CardContent>
            <p className="uppercase font-medium text-lg text-gray-500 mb-6">
              🛍️ ¡Agregar un nuevo producto!
            </p>
            <input
              className="text-gray-800 px-3 h-16 bg-gray-200 mt-2 mb-5 text-2xl w-full font-medium border-b-2 border-gray-300 focus:border-blue-500 transition"
              value={productName}
              placeholder="Nombre del Producto"
              onChange={(e) => setProductName(e.target.value)}
            />
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select value={category} onChange={(e) => setCategory(e.target.value)} label="Categoría">
                {categories.map((categoryOption) => (
                  <MenuItem key={categoryOption._id} value={categoryOption._id}>
                    {categoryOption.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedCategory && selectedCategory.subcategories.length > 0 && (
              <Box mt={4}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel>Marca</InputLabel>
                  <Select value={brand} onChange={(e) => setBrand(e.target.value)} label="Marca">
                    {selectedCategory.subcategories.map((subCat) => (
                      <MenuItem key={subCat._id} value={subCat._id}>
                        {subCat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {selectedBrand && subCategories.length > 0 && (
              <Box mt={4}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel>Subcategoría</InputLabel>
                  <Select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} label="Subcategoría">
                    {subCategories.map((subSubCat) => (
                      <MenuItem key={subSubCat._id} value={subSubCat._id}>
                        {subSubCat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            <div className="mt-8">
              <ReactQuill value={addBreaksAfterPeriods(specifications)} onChange={setSpecifications} />
            </div>

            <div className="mt-8">
              <Button variant="contained" component="label">
                Subir Imagen Principal
                <input type="file" onChange={handleMainImageChange} hidden />
              </Button>
              {mainImageUrl && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(mainImageUrl)}
                    alt="Main Image Preview"
                    className="object-cover h-72 w-72 rounded mt-2"
                  />
                </div>
              )}
            </div>

            <div className="mt-8">
              <Button variant="contained" component="label">
                Subir Imágenes Secundarias
                <input type="file" multiple onChange={handleSecondaryImagesChange} hidden />
              </Button>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full mt-4">
                {previewImages.map((previewImage, index) => (
                  <div key={index}>
                    <img
                      src={URL.createObjectURL(previewImage)}
                      alt={`Secundaria ${index}`}
                      className="object-cover h-72 w-full rounded"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Button variant="contained" component="label">
                Subir Ficha Técnica (PDF)
                <input type="file" onChange={(e) => setTechnicalSheet(e.target.files[0])} accept="application/pdf" hidden />
              </Button>
              {technicalSheet && <p className="mt-2 text-gray-600">Archivo subido: {technicalSheet.name}</p>}
            </div>

            <div className="mt-8">
              <Button variant="contained" component="label">
                Subir Manuales (PDF)
                <input type="file" multiple onChange={handleManualChange} accept="application/pdf" hidden />
              </Button>
              {manuals.length > 0 && (
                <ul className="mt-2">
                  {manuals.map((manual, index) => (
                    <li key={index} className="text-gray-600">{manual.name}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="w-full mt-8">
              <Button onClick={handleSubmitProduct} variant="contained" disabled={loading} className="w-full">
                {loading ? <CircularProgress size={24} /> : "Agregar Producto"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
};

export default AddProductPage;
