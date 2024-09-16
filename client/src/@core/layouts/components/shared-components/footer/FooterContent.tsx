// ** MUI Imports
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";

const FooterContent = () => {
  // ** Var
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <p className="flex items-center justify-center mt-5 gap-2 text-center text-gray-700">
        Desarrollado por
        <span className="font-medium">💻 Tomás Rodeghiero.</span>
      </p>
    </Box>
  );
};

export default FooterContent;
