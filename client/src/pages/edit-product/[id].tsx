import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
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
import IconButton from "@mui/material/IconButton";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const EditProductPage = () => {
  const router = useRouter();
  const { id } = router.query;

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
  const [deletedImages, setDeletedImages] = useState([]);

  const handleExistingImageDelete = (index) => {
    const imageToDelete = existingPreviewImagesUrls[index];
    setDeletedImages((prev) => [...prev, imageToDelete]);
    setExistingPreviewImagesUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewImageDelete = (index) => {
    setPreviewImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };


  // Existing data for preview
  const [existingTechnicalSheetUrl, setExistingTechnicalSheetUrl] = useState<string | null>(null);
  const [existingManualUrls, setExistingManualUrls] = useState<string[]>([]);
  const [existingMainImageUrl, setExistingMainImageUrl] = useState<string | null>(null);
  const [existingPreviewImagesUrls, setExistingPreviewImagesUrls] = useState<string[]>([]);

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

  // Fetch the product data for editing
  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await fetch(`/api/product/${id}`);
          if (response.ok) {
            const data = await response.json();
            console.log("Product data:", data);
            setProductName(data.name);
            setCategory(data.category || "");
            setBrand(data.brand || "");
            setSubCategory(data.subCategory || "");
            setSpecifications(data.specifications);
            setExistingMainImageUrl(data.mainImageUrl);
            setExistingPreviewImagesUrls(data.secondaryImageUrls || []);
            setExistingTechnicalSheetUrl(data.technical_sheet?.url || null);
            setExistingManualUrls(data.manuals.map((manual) => manual.url));
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


  const showErrorMessage = (message) => {
    toast.error(message, { position: "top-center", autoClose: 5000 });
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!productName) {
      showErrorMessage("El nombre del producto es obligatorio");
      setLoading(false);
      return;
    }

    if (!category) {
      showErrorMessage("La categoría del producto es obligatoria");
      setLoading(false);
      return;
    }

    if (!mainImageUrl && !existingMainImageUrl) {
      showErrorMessage("La imagen principal del producto es obligatoria");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", productName);
    formData.append("category", category);
    if (brand) formData.append("brand", brand);
    if (subCategory) formData.append("subCategory", subCategory);
    formData.append("specifications", specifications || "");

    if (mainImageUrl) {
      formData.append("images", mainImageUrl, mainImageUrl.name);
    }

    previewImages.forEach((image, index) => formData.append("images", image, `secondary-image-${index}`));

    if (technicalSheet) formData.append("technical_sheet", technicalSheet, technicalSheet.name);
    manuals.forEach((manual) => formData.append("manuals", manual, manual.name));

    // Incluir imágenes eliminadas
    deletedImages.forEach((deletedImageUrl) => formData.append("deletedImages", deletedImageUrl));

    try {
      const response = await fetch(`/api/edit-product/${id}`, { method: "PUT", body: formData });
      if (response.ok) {
        toast.success("Producto editado exitosamente", { position: "top-center", autoClose: 5000 });
        router.push("/my-products");
      } else {
        toast.error("Error al editar el producto", { position: "top-center" });
      }
    } catch (error) {
      console.error(error);
      showErrorMessage("Error al editar el producto");
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

  useEffect(() => {
    if (selectedBrand) {
      // Al cargar un producto existente, asegúrate de que la subcategoría se establezca correctamente
      const foundSubCategory = selectedBrand.subSubCategories.find((subSubCat) => subSubCat._id === subCategory);
      setSubCategory(foundSubCategory ? foundSubCategory._id : "");
    }
  }, [selectedBrand, subCategory]);


  return (
    <>
      <div ref={formRef} className="flex justify-center items-center w-full">
        <Card className="shadow-lg w-full max-w-7xl">
          <CardContent>
            <p className="uppercase font-medium text-lg text-gray-500 mb-6">
              ✏️ ¡Editar Producto!
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

            {selectedBrand && selectedBrand.subSubCategories?.length > 0 && (
              <Box mt={4}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel>Subcategoría</InputLabel>
                  <Select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} label="Subcategoría">
                    {selectedBrand.subSubCategories.map((subSubCat) => {
                      console.log("selectedBrand.subSubCategories", selectedBrand.subSubCategories);
                      return (
                        <MenuItem key={subSubCat._id} value={subSubCat._id}>
                          {subSubCat.name}
                        </MenuItem>
                      );
                    }
                    )}
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
              {existingMainImageUrl && !mainImageUrl && (
                <div className="mt-4">
                  <img
                    src={existingMainImageUrl}
                    alt="Imagen Principal Actual"
                    className="object-cover h-72 w-72 rounded mt-2"
                  />
                </div>
              )}
              {mainImageUrl && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(mainImageUrl)}
                    alt="Nueva Imagen Principal"
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

              {existingPreviewImagesUrls.length > 0 && !previewImages.length && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full mt-4">
                  {existingPreviewImagesUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <div className="flex w-full justify-end">
                        <IconButton
                          className="bg-red-500 h-12 w-12 p-1 text-white rounded-full transition-colors duration-300 ease-in-out"
                          onClick={() => handleExistingImageDelete(index)}
                        >
                          ❌
                        </IconButton>
                      </div>
                      <img src={url} alt={`Secundaria ${index}`} className="h-72 w-full object-contain rounded" />
                    </div>
                  ))}
                </div>
              )}

              {previewImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full mt-4">
                  {previewImages.map((previewImage, index) => (
                    <div key={index} className="relative">
                      <div className="flex w-full justify-end">
                        <IconButton
                          className="bg-red-500 h-12 w-12 p-1 text-white rounded-full transition-colors duration-300 ease-in-out"
                          onClick={() => handleNewImageDelete(index)}
                        >
                          ❌
                        </IconButton>
                      </div>
                      <img
                        src={URL.createObjectURL(previewImage)}
                        alt={`Secundaria ${index}`}
                        className="h-72 w-full object-contain rounded"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <Button variant="contained" component="label">
                Subir Ficha Técnica (PDF)
                <input type="file" onChange={(e) => setTechnicalSheet(e.target.files[0])} accept="application/pdf" hidden />
              </Button>
              {existingTechnicalSheetUrl && !technicalSheet && (
                <p className="mt-2">
                  <a href={existingTechnicalSheetUrl} target="_blank" rel="noopener noreferrer">
                    Ver ficha técnica actual
                  </a>
                </p>
              )}
              {technicalSheet && <p className="mt-2 text-gray-600">Archivo subido: {technicalSheet.name}</p>}
            </div>

            <div className="mt-8">
              <Button variant="contained" component="label">
                Subir Manuales (PDF)
                <input type="file" multiple onChange={handleManualChange} accept="application/pdf" hidden />
              </Button>
              {existingManualUrls.length > 0 && !manuals.length && (
                <ul className="mt-2">
                  {existingManualUrls.map((manualUrl, index) => (
                    <li key={index}>
                      <a href={manualUrl} target="_blank" rel="noopener noreferrer">
                        Ver manual {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {manuals.length > 0 && (
                <ul className="mt-2">
                  {manuals.map((manual, index) => (
                    <li key={index} className="text-gray-600">
                      {manual.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="w-full mt-8">
              <Button onClick={handleSubmitProduct} variant="contained" disabled={loading} className="w-full">
                {loading ? <CircularProgress size={24} /> : "Editar Producto"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
};

export default EditProductPage;
