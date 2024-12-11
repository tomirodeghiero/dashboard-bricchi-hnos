import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import { Button } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";

// Styled component for product card
const StyledCard = styled(Card)(({ theme, isSelected }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  position: "relative",
  backgroundColor: "#ffffff",
  transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.03)",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  },
  border: isSelected ? "2px solid #E8B600" : "2px solid transparent",
  boxShadow: isSelected ? "0 0 10px rgba(232, 182, 0, 0.5)" : "none",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  height: "100%",
}));

const ProductInfo = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  marginTop: "1rem",
});

const EllipsisText = styled("h3")({
  fontWeight: "bold",
  fontSize: "1.1rem",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "90%",
  margin: "0 auto",
});

const CategoryText = styled("p")({
  fontSize: "0.9rem",
  color: "#666",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "90%",
  marginTop: "0.5rem",
});

const MyProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 lg:py-8">
        {loadingProducts
          ? Array.from({ length: 8 }).map((_, idx) => (
            <StyledCard key={idx}>
              <div className="w-48 h-48 mt-5 mx-auto bg-gray-200 rounded-lg"></div>
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
                className="w-full h-72 mt-5 mx-auto rounded-lg object-cover"
              />
              <ProductInfo>
                <EllipsisText title={product.name}>{product.name}</EllipsisText>
                <CategoryText title={product.category || "Sin categoría"}>
                  {product.category || "Sin categoría"}
                </CategoryText>
              </ProductInfo>
              <div className="mt-3 flex justify-around mb-4">
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
