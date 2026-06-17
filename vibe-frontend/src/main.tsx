import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";

// Initialize dark mode
if (localStorage.getItem("vibe_dark_mode") === "true") {
  document.documentElement.classList.add("dark");
} else {
  // Default to dark or match OS, let's keep dark since vibe is a dark/glassmorphic styled app by default
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
