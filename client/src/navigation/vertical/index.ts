import CubeOutline from "mdi-material-ui/CubeOutline";
import AccountPlusOutline from "mdi-material-ui/AccountPlusOutline";
import FormatListBulleted from "mdi-material-ui/FormatListBulleted";
import PlusBoxMultipleOutline from "mdi-material-ui/PlusBoxMultipleOutline";
import { VerticalNavItemsType } from "src/@core/layouts/types";


const navigation = (): VerticalNavItemsType => {
  return [
    {
      sectionTitle: "Dashboard - Bricchi Hnos.",
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
    {
      title: "Añadir Categoría",
      icon: PlusBoxMultipleOutline,
      path: "/add-category",
    }
  ];
};

export default navigation;
