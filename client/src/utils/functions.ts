import { D_PASTEL_SUBCATEGORIES, LIGHT_TONES } from "./constants";

export function formatPriceARS(price: any): any {
  if (typeof price === "number") {
    let priceFormatted = price.toFixed(2).replace(".", ",");

    let [entirePart, decimalPart] = priceFormatted.split(",");

    let regex = /\B(?=(\d{3})+(?!\d))/g;
    entirePart = entirePart.replace(regex, ".");

    priceFormatted = entirePart + "," + decimalPart;

    priceFormatted = priceFormatted;

    return priceFormatted;
  }
}

export const processPrice = (inputValue: string): number => {
  const parts = inputValue.split(".");

  // Si no hay puntos, simplemente convertir a float
  if (parts.length === 1) return parseFloat(parts[0]);

  // Si hay un punto, considerar la última parte como centavos
  if (parts.length === 2) return parseFloat(parts[0] + "." + parts[1]);

  // Si hay más de un punto, considerar todos los puntos como separadores de miles y el último como separador de centavos
  if (parts.length > 2) {
    const wholeNumber = parts.slice(0, -1).join("");
    const cents = parts[parts.length - 1];
    return parseFloat(wholeNumber + "." + cents);
  }

  // Devolver 0 en cualquier otro caso (puedes manejar esto como desees)
  return 0;
};

export const removeEnLangPrefix = (path: string): string => {
  const prefix = "/en";
  if (path.startsWith(prefix)) {
    return path.replace(prefix, "");
  }
  return path;
};

// A function to add breaks after periods for better text formatting
export const addBreaksAfterPeriods = (text: string) => {
  if (!text) return ""; // Retorna un string vacío si el texto no está definido
  return text.replace(/\./g, ".<br>");
};

export const getSubcategoriesOptions = (userType: string) => {
  if (userType === 'sophilum') {
    return LIGHT_TONES;
  }
  return D_PASTEL_SUBCATEGORIES;
};