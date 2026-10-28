import "@testing-library/jest-dom/vitest";

beforeEach(() => {
  localStorage.clear();
});

// jsdom не реализует scrollTo; виртуализатор списка предложений и reveal() его вызывают
window.scrollTo = () => {};
