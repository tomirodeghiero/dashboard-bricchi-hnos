import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import { Button, Accordion, AccordionSummary, AccordionDetails, Typography, Box, Divider } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import "react-toastify/dist/ReactToastify.css";

// Styled component para las tarjetas
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5),
  backgroundColor: "#ffffff",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  "&:hover": {
    transform: "scale(1.01)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
  },
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  marginBottom: theme.spacing(2),
}));

// Títulos estilizados
const Title = styled(Typography)(({ theme }) => ({
  color: "#333",
  backgroundColor: "#f7f7f7",
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(2, 0),
  fontWeight: 500,
  textAlign: "center",
}));

const CategoryCard = ({ category, label, onEdit, onDelete }) => (
  <StyledCard>
    <Typography variant="subtitle1" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{category.name}</Typography>
    <Typography variant="body2" color="textSecondary">{label}</Typography>
    <Box mt={1} display="flex" justifyContent="center">
      <Button
        variant="outlined"
        startIcon={<EditIcon />}
        onClick={() => onEdit(category._id, label)}
        color="primary"
        size="small"
        style={{ marginRight: "8px" }}
      >
        Editar
      </Button>
      <Button
        variant="outlined"
        startIcon={<DeleteIcon />}
        onClick={() => onDelete(category._id)}
        color="secondary"
        size="small"
      >
        Eliminar
      </Button>
    </Box>
  </StyledCard>
);

const MyCategoriesPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    const response = await fetch("/api/categories");
    if (response.ok) {
      const data = await response.json();
      setCategories(data.categories);
    } else {
      toast.error("Error al cargar categorías", { position: "top-center" });
    }
    setLoadingCategories(false);
  };

  const handleDelete = async (categoryId, categoryType, parentCategoryId) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta categoría y todo lo relacionado?")) {
      const response = await fetch(`/api/delete-category/${categoryId}?categoryType=${categoryType}&parentCategory=${parentCategoryId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Categoría eliminada correctamente", { position: "top-center" });
        fetchCategories();
      } else {
        toast.error("Error al eliminar la categoría", { position: "top-center" });
      }
    }
  };

  const handleEdit = (categoryId, categoryType, mainCategoryId, parentCategoryId) => {
    router.push({
      pathname: `/edit-category/${categoryId}`,
      query: {
        categoryType,
        mainCategoryId: mainCategoryId || null,
        parentCategory: parentCategoryId || null,
        isMainCategory: categoryType === 'main',
      },
    });
  };

  // Renderizar la categoría principal con sus marcas y subcategorías
  const renderCategoryTree = (category) => {
    return (
      <Accordion key={category._id} sx={{ backgroundColor: "#fafafa", borderRadius: 1, marginTop: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ padding: "0 16px" }}>
          <Typography variant="subtitle1" sx={{ fontSize: '0.875rem' }}>
            <strong>{category.name}</strong>
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <CategoryCard
            category={category}
            label={category.isMainCategory ? "Categoría Principal" : "Marca"}
            onEdit={() => handleEdit(category._id, category.isMainCategory ? "main" : "brand", category._id)}
            onDelete={handleDelete}
          />
          {/* Renderizar las marcas */}
          {category.subcategories && category.subcategories.length > 0 && (
            <Box mt={1.5}>
              <Typography variant="body1" sx={{ fontSize: '0.875rem', fontWeight: 500 }} gutterBottom>Marcas:</Typography>
              {category.subcategories.map((subCategory) => (
                <Accordion key={subCategory._id} sx={{ backgroundColor: "#f5f5f5", marginTop: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ padding: "0 16px" }}>
                    <Typography variant="subtitle1" sx={{ fontSize: '0.875rem' }}><strong>{subCategory.name}</strong> - Marca</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <CategoryCard
                      category={subCategory}
                      label="Marca"
                      onEdit={() => handleEdit(subCategory._id, "brand", category._id)}
                      onDelete={() => handleDelete(subCategory._id, "brand", category._id)}
                    />
                    {/* Renderizar las sub-subcategorías */}
                    {subCategory.subSubCategories && subCategory.subSubCategories.length > 0 && (
                      <Box mt={1.5}>
                        <Typography variant="body1" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Subcategorías:</Typography>
                        {subCategory.subSubCategories.map((subSubCategory) => (
                          <CategoryCard
                            key={subSubCategory._id}
                            category={subSubCategory}
                            label="Subcategoría"
                            onEdit={() => handleEdit(subSubCategory._id, "subcategory", category._id, subCategory._id)}
                            onDelete={() => handleDelete(subSubCategory._id, "subcategory", subCategory._id)}
                          />
                        ))}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box p={3}>
      <Title style={{ textAlign: "start", fontSize: 22, fontWeight: 500 }}>Categorías</Title>
      <Divider sx={{ marginBottom: 3 }} />
      <Box>
        {loadingCategories ? (
          <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <StyledCard key={idx}>
                <Box className="w-48 h-48 mt-5 mx-auto bg-gray-200 rounded-full"></Box>
                <Box mt={2} className="flex flex-col items-center">
                  <Box className="bg-gray-200 w-2/3 h-4 my-1 rounded"></Box>
                  <Box className="bg-gray-200 w-1/2 h-4 my-1 rounded"></Box>
                </Box>
              </StyledCard>
            ))}
          </Box>
        ) : (
          <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
            {categories
              .filter((category) => category.isMainCategory)
              .map((category) => renderCategoryTree(category))}
          </Box>
        )}
      </Box>

      <ToastContainer position="top-right" autoClose={5000} />
    </Box>
  );
};

export default MyCategoriesPage;
