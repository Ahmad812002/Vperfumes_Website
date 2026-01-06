import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { Toaster } from "sonner";
import "@/utils/suppressErrors";
import { AuthProvider } from "@/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <>
  
    <AuthProvider>
      <App />
    </AuthProvider>
    <Toaster position="top-center" richColors />
  </>
);
