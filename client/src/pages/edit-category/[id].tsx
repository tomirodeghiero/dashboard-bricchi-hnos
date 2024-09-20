import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Checkbox, FormControlLabel } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";

const EditCategoryPage = () => {
  const [categoryName, setCategoryName] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [isMainCategory, setIsMainCategory] = useState(true); // Cargar si es una categoría principal
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      const fetchCategory = async () => {
        try {
          const categoryResponse = await fetch(`/api/category/${id}`);
          const categoryData = await categoryResponse.json();

          setCategoryName(categoryData.category.name);
          setSelectedSubcategories(categoryData.category.subcategories.map(sub => sub._id));
          setIsMainCategory(categoryData.category.isMainCategory); // Cargar el valor de "isMainCategory"

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
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName) {
      return toast.error("El nombre de la categoría está vacío", { position: "top-center" });
    }

    const categoryData = {
      name: categoryName,
      subcategories: selectedSubcategories,
      isMainCategory, // Enviar si es categoría principal o no
    };

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
      <div className="flex justify-center items-center h-screen">
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

        {/* Checkbox para seleccionar si es una categoría principal */}
        <div className="mt-4">
          <FormControlLabel
            control={
              <Checkbox
                checked={isMainCategory}
                onChange={(e) => setIsMainCategory(e.target.checked)}
              />
            }
            label="¿Es una categoría principal?"
          />
        </div>

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
