import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Button, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";

const AddCategoryPage = () => {
  const [categoryName, setCategoryName] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setAllCategories(data.categories);
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName) {
      return toast.error("El nombre de la categoría está vacío", { position: "top-center" });
    }

    const categoryData = {
      name: categoryName,
      subcategories: selectedSubcategories
    };

    const response = await fetch("/api/add-category", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoryData),
    });

    if (response.ok) {
      toast.success("Categoría añadida con éxito", { position: "top-center" });
      setCategoryName("");
      setSelectedSubcategories([]);
      router.push("/my-categories");
    } else {
      toast.error("Error al añadir categoría", { position: "top-center" });
    }
  };

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
            Añadir Categoría
          </Button>
        </div>
      </form>

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default AddCategoryPage;
