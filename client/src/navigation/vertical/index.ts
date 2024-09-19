import CubeOutline from "mdi-material-ui/CubeOutline";
import AccountPlusOutline from "mdi-material-ui/AccountPlusOutline";
import FormatListBulleted from "mdi-material-ui/FormatListBulleted"; // Nuevo icono para Categorías

import { VerticalNavItemsType } from "src/@core/layouts/types";

const navigation = (): VerticalNavItemsType => {
  return [
    {
      sectionTitle: "Mi E-commerce",
    },
    {
      title: "Mis Productos",
      icon: CubeOutline,
      path: "/my-products",
    },
    {
      title: "Añadir Producto",
      icon: AccountPlusOutline,
      path: "/add-product",
    },
    {
      title: "Mis Categorías",
      icon: FormatListBulleted,
      path: "/my-categories",
    },
  ];
};

export default navigation;
