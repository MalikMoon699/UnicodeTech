import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
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
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </Provider>,
);
