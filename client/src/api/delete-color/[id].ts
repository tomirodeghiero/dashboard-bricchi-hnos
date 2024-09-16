export default async function handler(req: any, res: any) {
  if (req.method === "DELETE") {
    const { colorId } = req.query; // Get the color ID from the request query

    try {
      const requestOptions = {
        method: "DELETE", // Use DELETE method
        headers: { "Content-Type": "application/json" },
      };

      // Assume you have an endpoint like /api/colors/{colorId} for deletion
      const response = await fetch(
        `${process.env.BACKEND_URL}/api/colors/${colorId}`,
        requestOptions
      );
      if (!response.ok) {
        // Handle any errors from your backend
        throw new Error("Failed to delete color");
      }

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
