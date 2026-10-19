import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";

import { ApplicationProvider } from "./context/ApplicationContext";
import { PreferencesProvider } from "./context/PreferencesContext";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <PreferencesProvider>
      <AuthProvider>
        <ApplicationProvider>
          <App />
        </ApplicationProvider>
      </AuthProvider>
    </PreferencesProvider>
  </React.StrictMode>
);
