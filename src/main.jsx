import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { App } from "@/App";
import { AppSkeleton } from "@/components/composite/AppSkeleton";
import { initTheme } from "@/hooks/useTheme";
import "@/i18n";
import { store } from "@/store";
import "@/styles/index.css";

initTheme();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <Suspense fallback={<AppSkeleton />}>
        <App />
      </Suspense>
    </Provider>
  </StrictMode>,
);
