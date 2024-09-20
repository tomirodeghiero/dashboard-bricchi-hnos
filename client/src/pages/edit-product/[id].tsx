import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { toast, ToastContainer } from "react-toastify";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import "react-toastify/dist/ReactToastify.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const EditProductPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [technicalSheet, setTechnicalSheet] = useState<File | null>(null);
  const [manuals, setManuals] = useState<File[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<File[]>([]);

  const [existingTechnicalSheetUrl, setExistingTechnicalSheetUrl] = useState<string | null>(null);
  const [existingManualUrls, setExistingManualUrls] = useState<string[]>([]);
  const [existingMainImageUrl, setExistingMainImageUrl] = useState<string | null>(null);
  const [existingPreviewImagesUrls, setExistingPreviewImagesUrls] = useState<string[]>([]);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories and subcategories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        setCategories(data.categories); // Set categories with subcategories included
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch product data when id is available
  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await fetch(`/api/product/${id}`);
          if (response.ok) {
            const data = await response.json();
            setProductName(data.name);
            setCategory(data.category?._id); // Ensure category ID is set correctly
            setSubCategory(data.subCategory?._id || ""); // Ensure subcategory ID is set correctly
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
    setLoading(true);

    const formData = new FormData();
    formData.append("name", productName);
    formData.append("category", category);
    if (subCategory) formData.append("subCategory", subCategory);
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
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (setter: Function) => (event: any) => {
    const file = event.target.files[0];
    if (file) setter(file);
  };

  return (
    <>
      <div className="flex justify-center items-center w-full py-12">
        <Card className="shadow-lg w-full max-w-7xl">
          <CardContent>
            <p className="uppercase font-medium text-lg text-gray-500 mb-6">
              ✏️ ¡Editar producto!
            </p>
            <input
              className="text-gray-800 px-3 h-16 bg-gray-200 mt-2 mb-5 text-2xl w-full font-medium border-b-2 border-gray-300 focus:border-blue-500 transition"
              value={productName}
              placeholder="Nombre del producto"
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

            {/* Subcategories dropdown only shown if category has subcategories */}
            {category && categories.find((cat) => cat._id === category)?.subcategories?.length > 0 && (
              <FormControl variant="outlined" fullWidth className="mt-8">
                <InputLabel>Subcategoría</InputLabel>
                <Select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} label="Subcategoría">
                  {categories
                    .find((cat) => cat._id === category)
                    ?.subcategories.map((subCat) => (
                      <MenuItem key={subCat._id} value={subCat._id}>
                        {subCat.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}

            <div className="mt-8">
              <ReactQuill value={specifications} onChange={setSpecifications} />
            </div>

            <div className="mt-8">
              <Button variant="contained" component="label">
                Subir Imagen Principal
                <input type="file" onChange={handleFileChange(setMainImageUrl)} hidden />
              </Button>
              {existingMainImageUrl && !mainImageUrl && (
                <div className="mt-4">
                  <img
                    src={existingMainImageUrl}
                    alt="Imagen Principal Actual"
                    className="object-cover h-28 w-28 rounded mt-2"
                  />
                </div>
              )}
              {mainImageUrl && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(mainImageUrl)}
                    alt="Nueva Imagen Principal"
                    className="object-cover h-28 w-28 rounded mt-2"
                  />
                </div>
              )}
            </div>

            <div className="mt-8">
              <Button variant="contained" component="label">
                Subir Imágenes Secundarias
                <input type="file" multiple onChange={handleFileChange(setPreviewImages)} hidden />
              </Button>
              {existingPreviewImagesUrls.length > 0 && !previewImages.length && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full mt-4">
                  {existingPreviewImagesUrls.map((url, index) => (
                    <img key={index} src={url} alt={`Imagen Secundaria ${index}`} className="object-cover h-full w-full rounded" />
                  ))}
                </div>
              )}
              {previewImages.length > 0 && (
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
              )}
            </div>

            <div className="mt-4">
              <Button variant="contained" component="label">
                Subir Ficha Técnica (PDF)
                <input type="file" onChange={handleFileChange(setTechnicalSheet)} accept="application/pdf" hidden />
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
                <input type="file" multiple onChange={handleFileChange(setManuals)} accept="application/pdf" hidden />
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
