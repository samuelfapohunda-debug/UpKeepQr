/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "rgb(229 231 235)" // same as gray-200, adjust if needed
      }
    },
  },
  plugins: [],
};
