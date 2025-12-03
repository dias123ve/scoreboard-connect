import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
console.log("ENV CHECK");
console.log("VITE_SUPABASE_URL =", import.meta.env.VITE_SUPABASE_URL);
console.log("VITE_SUPABASE_ANON_KEY =", import.meta.env.VITE_SUPABASE_ANON_KEY);

createRoot(document.getElementById("root")!).render(<App />);
