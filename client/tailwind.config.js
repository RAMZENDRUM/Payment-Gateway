/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1", // Indigo
        secondary: "#ec4899", // Pink
        accent: "#f59e0b", // Amber
        background: "#0f172a", // Slate 900
        surface: "#1e293b", // Slate 800
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
      }
    },
  },
  plugins: [],
}
