import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { applyThemeColors } from "./design/theme.js";
import "./styles/tokens.css";
import "./index.css";
import "maplibre-gl/dist/maplibre-gl.css";

applyThemeColors(document.documentElement);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
