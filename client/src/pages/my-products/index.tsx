import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Card from "@mui/material/Card";
import { styled, useTheme } from "@mui/material/styles";
import { Button } from "@mui/material";

// Styled component for the triangle shaped background image
const StyledCard = styled(Card)(({ theme, isSelected }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  position: "relative",
  backgroundColor: "#ffffff",
  transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.025)",
    cursor: "pointer",
  },
  border: isSelected ? "2px solid #E8B600" : "2px solid transparent",
  boxShadow: isSelected ? "0 0 10px rgba(232, 182, 0, 0.5)" : "none",
}));

const MyProductsPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const dropdownRef = useRef<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    const response = await fetch("/api/products?page=1&limit=100");
    if (response.ok) {
      const data = await response.json();
      setProducts(data.products);
      console.log(data.products);
    } else {
      toast.error("Error al cargar productos", { position: "top-center" });
    }
    setLoadingProducts(false);
  };

  const handleDelete = async (productId: string) => {
    const response = await fetch(`/api/delete-product/${productId}`, { method: "DELETE" });
    if (response.ok) {
      toast.success("Producto eliminado", { position: "top-center" });
      fetchProducts();
    } else {
      toast.error("Error al eliminar producto", { position: "top-center" });
    }
  };

  const handleEdit = (productId: string) => {
    router.push(`/edit-product/${productId}`);
  };

  return (
    <div>
      <div className="flex justify-end items-center gap-4 p-4">
        <Button
          onClick={() => router.push("/add-product")}
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
          Añadir Producto
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 lg:py-8">
        {loadingProducts
          ? Array.from({ length: 8 }).map((_, idx) => (
            <StyledCard key={idx}>
              <div className="w-48 h-48 mt-5 mx-auto bg-gray-200 rounded-full"></div>
              <div className="mt-5 flex flex-col items-center">
                <div className="bg-gray-200 w-2/3 h-4 my-2 rounded"></div>
                <div className="bg-gray-200 w-1/2 h-4 my-2 rounded"></div>
              </div>
            </StyledCard>
          ))
          : products.map((product) => (
            <StyledCard key={product._id}>
              <img
                src={product.mainImageUrl}
                alt={product.name}
                className="w-48 h-48 mt-5 mx-auto rounded-full object-cover"
              />
              <div className="mt-5 flex flex-col items-center">
                <h3 className="font-bold text-[1.1rem] text-center">
                  {product.name}
                </h3>
              </div>
              <div className="mt-3 flex justify-around">
                <Button
                  onClick={() => handleEdit(product._id)}
                  variant="outlined"
                  color="primary"
                >
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(product._id)}
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

export default MyProductsPage;
