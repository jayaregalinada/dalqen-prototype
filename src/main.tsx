import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { OperationsPrototype } from './app/operations-prototype';
import "./globals.css";

try {
  document.documentElement.classList.toggle('dark', localStorage.getItem('dalqen-theme') === 'dark');
} catch { /* private mode */ }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OperationsPrototype />
  </StrictMode>,
);
