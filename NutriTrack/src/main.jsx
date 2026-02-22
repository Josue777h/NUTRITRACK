import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import "./styles/main.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AppProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </AppProvider>
    </React.StrictMode>
);
