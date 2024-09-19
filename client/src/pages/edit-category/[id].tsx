import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";

const EditCategoryPage = () => {
  const [categoryName, setCategoryName] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [loading, setLoading] = useState(true); // Estado para cargar datos
  const router = useRouter();
  const { id } = router.query; // Obtener el id de la categoría de la URL

  // Cargar la categoría actual y las categorías existentes para seleccionar subcategorías
  useEffect(() => {
    if (id) {
      const fetchCategory = async () => {
        try {
          // Obtener la categoría que vamos a editar
          const categoryResponse = await fetch(`/api/category/${id}`);
          const categoryData = await categoryResponse.json();

          setCategoryName(categoryData.category.name);
          setSelectedSubcategories(categoryData.category.subcategories.map(sub => sub._id));

          // Obtener todas las categorías para mostrar opciones de subcategorías
          const categoriesResponse = await fetch("/api/categories");
          const categoriesData = await categoriesResponse.json();
          setAllCategories(categoriesData.categories);

          setLoading(false); // Cargar completada
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
