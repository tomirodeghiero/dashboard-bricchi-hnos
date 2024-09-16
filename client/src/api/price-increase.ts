// Importing necessary constants and types from external modules
import {
  ERROR_MESSAGES,
  INTERNAL_SERVER_ERROR,
  METHOD_NOT_ALLOWED,
  OK,
} from "../utils/httpStatus";

export default async function handler(req: any, res: any) {
  // Checking if the request method is PATCH
  if (req.method === "PATCH") {
    try {
      const { productIds, increasePercentage } = req.body;

      const requestOptions: RequestInit = {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds,
          increasePercentage,
        }),
        redirect: "follow",
      };

      await fetch(
        `${process.env.BACKEND_URL}/api/products/update-prices`,
        requestOptions
      )
        .then((response) => response.json())
        .then((result) => {
          res.status(OK).json(result);
        })
        .catch((error) => {
          console.error("error", error);
          res
            .status(INTERNAL_SERVER_ERROR)
            .json({ error: ERROR_MESSAGES[INTERNAL_SERVER_ERROR] });
        });
    } catch (error) {
      console.error(error);
      res
        .status(INTERNAL_SERVER_ERROR)
        .json({ error: ERROR_MESSAGES[INTERNAL_SERVER_ERROR] });
    }
  } else {
    res
      .status(METHOD_NOT_ALLOWED)
      .json({ error: ERROR_MESSAGES[METHOD_NOT_ALLOWED] });
  }
}
