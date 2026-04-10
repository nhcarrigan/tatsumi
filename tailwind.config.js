/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "studio-bg": "#0f0a1a",
        "studio-sidebar": "#1a1028",
        "studio-card": "#241836",
        "studio-purple": "#8b5cf6",
        "studio-pink": "#ec4899",
      },
    },
  },
  plugins: [],
};
