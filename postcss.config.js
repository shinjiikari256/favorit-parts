import tailwindcss from "@tailwindcss/postcss";
import postcssPresetEnv from "postcss-preset-env";

/** @type {import('postcss').Config} */
export default {
  plugins: [
    tailwindcss(),
    // Читает browserslist из package.json и автоматически добавляет CSS-полифиллы:
    // oklch/oklab → rgb(), color-mix() → fallback и т.д.
    postcssPresetEnv({ stage: 2 }),
  ],
};
