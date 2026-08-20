import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource-variable/newsreader/wght.css";
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import { OperationsPrototype } from './app/operations-prototype';
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OperationsPrototype />
  </StrictMode>,
);
