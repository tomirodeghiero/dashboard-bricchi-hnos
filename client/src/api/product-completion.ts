export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    const { product } = req.body;

    try {
      const response = await fetch(
        `${process.env.BACKEND_URL}/api/product-completion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product }),
        }
      );

      if (response.ok) {
        // Check if response status is 200-299
        const responseData = await response.json(); // Await the json promise
        res.status(200).json({ message: responseData }); // Wrap the string into a JSON object
      } else {
        res
          .status(500)
          .json({ error: "Error al crear el mensaje con el chatbot" });
      }
    } catch (error) {
      res.status(500).json({ error: "Error" });
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}
