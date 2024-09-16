/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: { 200: "#f4f5fa" },
        rose: { 300: "#F9F1E7" },
        yellow: {
          400: "#ffca0a",
          500: "#F1A700",
          600: "#B88E2F",
        },
      },
    },
  },
  plugins: [],
};
