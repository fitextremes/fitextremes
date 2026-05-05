// IMPORTANT: import recoveryDetection FIRST, before App (which transitively
// imports the Supabase client). The Supabase client clears the URL hash
// during initialization, so we must snapshot it before that happens.
import "./lib/recoveryDetection";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
