export default async function handler(req: any, res: any) {
  if (req.method === "PUT") {
    // Cambia a PUT para coincidir con el método del servidor
    const colors = req.body.colors; // Asegúrate de recibir los colores desde el cuerpo de la solicitud

    try {
      const requestOptions = {
        method: "PUT", // Cambia a PUT para coincidir con el método del servidor
        body: JSON.stringify({ colors }), // Envía los colores como parte del cuerpo de la solicitud
        headers: { "Content-Type": "application/json" },
      };

      const response = await fetch(
        `${process.env.BACKEND_URL}/api/update-colors`,
        requestOptions
      );
      const result = await response.json();

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
