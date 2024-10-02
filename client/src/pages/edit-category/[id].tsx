import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Checkbox, FormControlLabel } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";

const EditCategoryPage = () => {
  const [categoryName, setCategoryName] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [isMainCategory, setIsMainCategory] = useState(true);
  const [selectedParentCategory, setSelectedParentCategory] = useState("");
  const [selectedCategoryType, setSelectedCategoryType] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id, categoryType, mainCategoryId, parentCategory, isMainCategory: queryIsMainCategory } = router.query;

  useEffect(() => {
    if (id) {
      const fetchCategory = async () => {
        try {
          let categoryResponse;
          let categoryData;

          // Determinar el tipo de categoría (mainCategory, brand, subcategory)
          if (categoryType === "main") {
            categoryResponse = await fetch(`/api/category/${id}`);
            categoryData = await categoryResponse.json();
            setIsMainCategory(true);
          } else if (categoryType === "brand") {
            categoryResponse = await fetch(`/api/brand/${id}`);
            categoryData = await categoryResponse.json();
            setIsMainCategory(false);
            setSelectedCategoryType("brand");
            setSelectedParentCategory(mainCategoryId);
          } else if (categoryType === "subcategory") {
            categoryResponse = await fetch(`/api/subcategory/${id}`);
            categoryData = await categoryResponse.json();
            setIsMainCategory(false);
            setSelectedCategoryType("subcategory");
            setSelectedParentCategory(parentCategory);
          }

          setCategoryName(categoryData.category.name);

          // Obtener todas las categorías para las opciones del formulario
          const categoriesResponse = await fetch("/api/categories");
          const categoriesData = await categoriesResponse.json();
          setAllCategories(categoriesData.categories);

          setLoading(false);
        } catch (err) {
          console.error("Error fetching category data", err);
          toast.error("Error al cargar la categoría", { position: "top-center" });
          setLoading(false);
        }
      };

      fetchCategory();
    }
  }, [id, categoryType, mainCategoryId, parentCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName) {
      return toast.error("El nombre de la categoría está vacío", { position: "top-center" });
    }

    // Construir el objeto de datos para la solicitud
    const categoryData = {
      name: categoryName,
      subcategories: isMainCategory ? selectedSubcategories : [],
      isMainCategory,
      parentCategory: !isMainCategory ? selectedParentCategory : null,
      categoryType: !isMainCategory ? selectedCategoryType : null,
      mainCategoryId: !isMainCategory ? mainCategoryId : null, // Incluir el `mainCategoryId` si no es una categoría principal
    };

    console.log("Datos enviados:", categoryData);

    const response = await fetch(`/api/edit-category/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoryData),
    });

    if (response.ok) {
      toast.success("Categoría actualizada con éxito", { position: "top-center" });
      router.push("/my-categories");
    } else {
      toast.error("Error al actualizar categoría", { position: "top-center" });
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <div>
          <TextField
            label="Nombre de Categoría"
            variant="outlined"
            fullWidth
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
        </div>

        {isMainCategory && (
          <div className="mt-4">
            <FormControl fullWidth variant="outlined">
              <InputLabel>Subcategorías</InputLabel>
              <Select
                multiple
                value={selectedSubcategories}
                onChange={(e) => setSelectedSubcategories(e.target.value)}
                label="Subcategorías"
              >
                {allCategories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        )}

        <div className="mt-4">
          <FormControlLabel
            control={
              <Checkbox
                checked={isMainCategory}
                onChange={(e) => {
                  setIsMainCategory(e.target.checked);
                  if (e.target.checked) {
                    setSelectedParentCategory("");
                    setSelectedCategoryType("");
                  }
                }}
              />
            }
            label="¿Es una categoría principal?"
          />
        </div>

        {!isMainCategory && (
          <>
            <div className="mt-4">
              <FormControl fullWidth variant="outlined">
                <InputLabel>Tipo de Categoría</InputLabel>
                <Select
                  value={selectedCategoryType}
                  onChange={(e) => setSelectedCategoryType(e.target.value)}
                  label="Tipo de Categoría"
                >
                  <MenuItem value="brand">Marca</MenuItem>
                  <MenuItem value="subcategory">Subcategoría</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div className="mt-4">
              <FormControl fullWidth variant="outlined">
                <InputLabel>Categoría Padre</InputLabel>
                <Select
                  value={selectedParentCategory}
                  onChange={(e) => setSelectedParentCategory(e.target.value)}
                  label="Categoría Padre"
                >
                  {allCategories
                    .filter(category => category.isMainCategory)
                    .map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </div>
          </>
        )}

        <div className="mt-4">
          <Button type="submit" variant="contained" fullWidth>
            Actualizar Categoría
          </Button>
        </div>
      </form>

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default EditCategoryPage;
