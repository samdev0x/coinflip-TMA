/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
     fontFamily: {
        minecraft: ["Minecraft", "sans-serif"],
        "minecraft-bold": ["MinecraftBold", "sans-serif"],
      },
    },
  },
  important: true,
  plugins: [],
}

