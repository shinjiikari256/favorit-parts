import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Кастомные text-conte-* — это размеры шрифта (styles/text.css), а не цвета: без этого twMerge их путает
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-conte-heading1",
        "text-conte-heading3",
        "text-conte-body-m",
        "text-conte-body-s",
        "text-conte-input",
        "text-conte-button-l",
        "text-conte-button-m",
      ],
    },
  },
});

/**
 * Склеивает условные классы (`clsx`) и разрешает конфликты Tailwind-классов (`tailwind-merge`).
 * @param {...import("clsx").ClassValue} inputs Строки, объекты, массивы классов.
 * @returns {string} Итоговая строка классов.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
