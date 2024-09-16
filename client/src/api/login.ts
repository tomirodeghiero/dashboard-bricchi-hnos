import {
  ERROR_MESSAGES,
  INTERNAL_SERVER_ERROR,
  METHOD_NOT_ALLOWED,
  OK,
  UNAUTHORIZED,
} from "../utils/httpStatus";

export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    const { username, password } = req.body;
    try {
      // Configure the request options
      var requestOptions: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        redirect: "follow",
      };

      await fetch(`${process.env.BACKEND_URL}/api/login`, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          if (result.error) {
            return res
              .status(UNAUTHORIZED)
              .json({ error: ERROR_MESSAGES[UNAUTHORIZED] });
          }

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
