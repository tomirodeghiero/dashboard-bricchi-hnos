import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import { Button } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";

// Styled component para el diseño
const StyledCard = styled(Card)(({ theme, isSelected }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  backgroundColor: "#ffffff",
  transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.025)",
    cursor: "pointer",
  },
  border: isSelected ? "2px solid #E8B600" : "2px solid transparent",
  boxShadow: isSelected ? "0 0 10px rgba(232, 182, 0, 0.5)" : "none",
}));

const MyCategoriesPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    const response = await fetch("/api/categories"); // Endpoint para obtener categorías
    if (response.ok) {
      const data = await response.json();
      setCategories(data.categories);
    } else {
      toast.error("Error al cargar categorías", { position: "top-center" });
    }
    setLoadingCategories(false);
  };

  const handleDelete = async (categoryId: string) => {
    const response = await fetch(`/api/delete-category/${categoryId}`, { method: "DELETE" });
    if (response.ok) {
      toast.success("Categoría eliminada", { position: "top-center" });
      fetchCategories();
    } else {
      toast.error("Error al eliminar categoría", { position: "top-center" });
    }
  };

  const handleEdit = (categoryId: string) => {
    router.push(`/edit-category/${categoryId}`);
  };

  return (
    <div>
      <div className="flex justify-end items-center gap-4 p-4">
        <Button
          onClick={() => router.push("/add-category")}
          variant="contained"
          sx={{
            backgroundColor: "#2a3243",
            boxShadow: "0 1px 14px 1px #2a3243",
            "&:hover": {
              boxShadow: "none",
              backgroundColor: "#2a3243",
            },
            marginRight: "10px",
          }}
        >
          Añadir Categoría
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 lg:py-8">
        {loadingCategories
          ? Array.from({ length: 8 }).map((_, idx) => (
            <StyledCard key={idx}>
              <div className="w-48 h-48 mt-5 mx-auto bg-gray-200 rounded-full"></div>
              <div className="mt-5 flex flex-col items-center">
                <div className="bg-gray-200 w-2/3 h-4 my-2 rounded"></div>
                <div className="bg-gray-200 w-1/2 h-4 my-2 rounded"></div>
              </div>
            </StyledCard>
          ))
          : categories.map((category) => (
            <StyledCard key={category._id}>
              <div className="mt-5 flex flex-col items-center">
                <h3 className="font-bold text-[1.1rem] text-center">
                  {category.name}
                </h3>
              </div>
              <div className="mt-3 flex justify-around">
                <Button
                  onClick={() => handleEdit(category._id)}
                  variant="outlined"
                  color="primary"
                >
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(category._id)}
                  variant="outlined"
                  color="secondary"
                >
                  Eliminar
                </Button>
              </div>
            </StyledCard>
          ))}
      </div>

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default MyCategoriesPage;
