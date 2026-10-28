import { defineConfig } from "orval";

const INPUT = "./favorit-parts-openapi.yaml";

// Orval умеет генерировать только TS. Проект — на JS, поэтому gen-api.js после генерации
// переводит .ts в .js (esbuild) и удаляет model/ — типы нам не нужны.
export default defineConfig({
  apiV1: {
    input: {
      target: INPUT,
    },
    output: {
      mode: "tags-split",
      target: "../src/api/rest/endpoints",
      schemas: "../src/api/rest/model",
      client: "axios",
      override: {
        header: false,
        mutator: {
          path: "../src/api/rest/axios.js",
          name: "api",
        },
      },
    },
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },
});
