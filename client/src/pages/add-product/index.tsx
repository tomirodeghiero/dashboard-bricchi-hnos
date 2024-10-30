import React, { useState } from "react";
import {
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Container,
  Box,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import { UploadFile } from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Papa from "papaparse";

const CSVUploadPage = () => {
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setCsvData(result.data);
          toast.success("Archivo CSV cargado con éxito", { position: "top-center", autoClose: 3000 });
        },
        error: (error) => {
          console.error("Error al procesar el archivo CSV:", error);
          toast.error("Error al cargar el archivo CSV", { position: "top-center" });
        },
      });
    }
  };

  const handleSaveData = async () => {
    setLoading(true);
    try {
      if (csvData.length === 0) {
        toast.error("Cargue el archivo CSV primero", { position: "top-center" });
        setLoading(false);
        return;
      }

      const csvText = Papa.unparse(csvData);

      const response = await fetch("http://localhost:5001/api/upload-csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csvData: csvText }),
      });

      if (response.ok) {
        toast.success("Datos guardados en la base de datos con éxito", { position: "top-center", autoClose: 3000 });
        setCsvData([]);
      } else {
        toast.error("Error al guardar los datos", { position: "top-center" });
      }
    } catch (error) {
      console.error("Error al guardar los datos:", error);
      toast.error("Error al guardar los datos en la base de datos", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Card elevation={4} sx={{ borderRadius: 3, width: "100%", maxWidth: "800px", p: 4 }}>
        <CardContent sx={{ textAlign: "center" }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Subir y Guardar CSV
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Carga un archivo CSV para previsualizar sus datos y guardarlos en la base de datos.
          </Typography>

          <Box sx={{ my: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <input
              accept=".csv"
              style={{ display: "none" }}
              id="csv-file-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="csv-file-upload">
              <IconButton
                color="primary"
                component="span"
                sx={{
                  p: 2,
                  bgcolor: "primary.light",
                  color: "white",
                  "&:hover": { bgcolor: "primary.main" },
                  boxShadow: 3,
                  borderRadius: "50%",
                }}
              >
                <UploadFile fontSize="large" />
              </IconButton>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Seleccionar archivo CSV
              </Typography>
            </label>
          </Box>

          {csvData.length > 0 && (
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, mt: 4, width: "100%" }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {Object.keys(csvData[0]).map((key, index) => (
                      <TableCell key={index} sx={{ fontWeight: "bold", bgcolor: "secondary.main", color: "white" }}>
                        {key}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {csvData.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.values(row).map((value, cellIndex) => (
                        <TableCell key={cellIndex}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {csvData.length > 0 && (
            <Button
              variant="contained"
              onClick={handleSaveData}
              disabled={loading}
              sx={{
                mt: 3,
                px: 4,
                py: 1.5,
                width: "100%",
                bgcolor: "#008000",
                color: "white",
                fontWeight: "bold",
                "&:hover": { bgcolor: "success.dark" },
                boxShadow: 2,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Guardar en Base de Datos"}
            </Button>
          )}
        </CardContent>
      </Card>
      <ToastContainer position="top-center" autoClose={3000} />
    </Container>
  );
};

export default CSVUploadPage;
