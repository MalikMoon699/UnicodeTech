import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
      <App />
      <Toaster
        richColors
        position="bottom-right"
        // closeButton
        dismissible
        toastOptions={{
          duration: 4000,
        }}
      />
  </BrowserRouter>
);
