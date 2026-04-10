/**
 * @file Application entry point for Tatsumi.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable import/no-unassigned-import -- CSS import has no exports to assign */
import "./index.css";
/* eslint-enable import/no-unassigned-import -- CSS import has no exports to assign */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
