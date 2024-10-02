import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Button, TextField, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Box } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";

const AddCategoryPage = () => {
  const [categoryName, setCategoryName] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const [selectedParentCategory, setSelectedParentCategory] = useState(""); // Para la categoría padre
  const [selectedBrand, setSelectedBrand] = useState(""); // Para la marca padre
  const [isMainCategory, setIsMainCategory] = useState(true); // Por defecto, es categoría principal
  const [categoryType, setCategoryType] = useState(""); // Para identificar tipo de categoría
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

    if (!isMainCategory && !categoryType) {
      return toast.error("Selecciona un tipo de categoría para las subcategorías", { position: "top-center" });
    }

    if (!isMainCategory && categoryType === "subcategory" && !selectedBrand) {
      return toast.error("Selecciona una marca para la subcategoría", { position: "top-center" });
    }

    const categoryData = {
      name: categoryName,
      parentCategory: isMainCategory ? null : (categoryType === "brand" ? selectedParentCategory : selectedBrand),
      isMainCategory,
      categoryType,
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
      setSelectedParentCategory("");
      setSelectedBrand("");
      setCategoryType("");
      setIsMainCategory(true);
      router.push("/my-categories");
    } else {
      toast.error("Error al añadir categoría", { position: "top-center" });
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <TextField
          label="Nombre de Categoría"
          variant="outlined"
          fullWidth
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={isMainCategory}
              onChange={(e) => {
                setIsMainCategory(e.target.checked);
                setCategoryType("");
                setSelectedParentCategory("");
                setSelectedBrand("");
              }}
            />
          }
          label="¿Es una categoría principal?"
        />

        {!isMainCategory && (
          <>
            <Box className="my-4">
              <FormControl fullWidth variant="outlined">
                <InputLabel>Tipo de Categoría</InputLabel>
                <Select
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value)}
                  label="Tipo de Categoría"
                >
                  <MenuItem value="brand">Marca</MenuItem>
                  <MenuItem value="subcategory">Subcategoría</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {categoryType === "brand" && (
              <Box className="my-4">
                <FormControl fullWidth variant="outlined" className="mt-4">
                  <InputLabel>Categoría Principal</InputLabel>
                  <Select
                    value={selectedParentCategory}
                    onChange={(e) => setSelectedParentCategory(e.target.value)}
                    label="Categoría Principal"
                  >
                    {allCategories
                      .filter((category) => category.isMainCategory)
                      .map((category) => (
                        <MenuItem key={category._id} value={category._id}>
                          {category.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>

            )}

            {categoryType === "subcategory" && (
              <>
                <FormControl fullWidth variant="outlined" className="mt-4">
                  <InputLabel>Categoría Principal</InputLabel>
                  <Select
                    value={selectedParentCategory}
                    onChange={(e) => setSelectedParentCategory(e.target.value)}
                    label="Categoría Principal"
                  >
                    {allCategories
                      .filter((category) => category.isMainCategory)
                      .map((category) => (
                        <MenuItem key={category._id} value={category._id}>
                          {category.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth variant="outlined" className="mt-4">
                  <InputLabel>Marca</InputLabel>
                  <Select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    label="Marca"
                  >
                    {allCategories
                      .filter((category) => category._id === selectedParentCategory)
                      .flatMap((category) => category.subcategories)
                      .map((subCategory) => (
                        <MenuItem key={subCategory._id} value={subCategory._id}>
                          {subCategory.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </>
            )}
          </>
        )}

        <Button type="submit" variant="contained" fullWidth className="mt-4">
          Añadir Categoría
        </Button>
      </form>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default AddCategoryPage;
