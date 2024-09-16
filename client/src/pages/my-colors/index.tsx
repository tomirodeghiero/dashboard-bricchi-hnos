import "react-toastify/dist/ReactToastify.css";
import React, { useEffect, useState } from "react";
import { Button, Paper, Grid, TextField } from "@mui/material";
import { SketchPicker } from "react-color";
import { Color } from "src/utils/interfaces";
import { ToastContainer, toast } from "react-toastify";

const ColorsPage = () => {
  const [colors, setColors] = useState<Color[]>([]);
  const [newColor, setNewColor] = useState<string>("#ffffff");
  const [newColorName, setNewColorName] = useState<string>("");

  useEffect(() => {
    const fetchColors = async () => {
      const response = await fetch("/api/colors");
      const data = await response.json();
      setColors(data);
    };

    fetchColors();
  }, []);

  const handleColorChange = (index: number, color: any) => {
    const newColors = [...colors];
    newColors[index] = { ...newColors[index], hex: color.hex };
    setColors(newColors);
  };

  const handleColorNameChange = (index: number, name: string) => {
    const newColors = [...colors];
    newColors[index] = { ...newColors[index], name };
    setColors(newColors);
  };

  const addNewColorRow = () => {
    // If the name is not empty, proceed to add the new color
    setColors([...colors, { hex: newColor, name: newColorName }]);
    setNewColorName("");
    setNewColor("#ffffff");
  };

  const updateColors = async () => {
    try {
      const response = await fetch("/api/update-colors", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ colors }),
      });

      if (!response.ok) {
        throw new Error("Failed to update colors");
      }

      await response.json();
      toast.success("Los colores se han actualizado correctamente", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch (error) {
      console.error("Error updating colors:", error);
      toast.error("Error al acutalizar los colores", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  return (
    <>
      <div style={{ padding: 20 }}>
        <p className="uppercase mb-4 font-medium text-sm text-gray-500">
          🎨 Mis Colores
        </p>
        <Grid container spacing={10}>
          {colors.map((color, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Paper
                style={{
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                <div>
                  <SketchPicker
                    color={color.hex}
                    onChangeComplete={(color) =>
                      handleColorChange(index, color)
                    }
                    disableAlpha
                    presetColors={[]}
                    width="92.5%"
                  />
                </div>
                <TextField
                  label="Color Name"
                  variant="outlined"
                  value={color.name}
                  onChange={(e) => handleColorNameChange(index, e.target.value)}
                />
              </Paper>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={addNewColorRow}
            >
              Añadir un Nuevo Color
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={updateColors}
              style={{ marginLeft: 10 }}
            >
              Actualizar Colores
            </Button>
          </Grid>
        </Grid>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default ColorsPage;
