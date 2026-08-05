import { createClient } from "@supabase/supabase-js";

// Configurables via variables d'environnement (.env), avec repli sur les valeurs par défaut.
// La clé Supabase est la clé publique "anon" (protégée côté serveur par les règles RLS).
export const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL || "https://hhqjieyzojbtxcgsatrm.supabase.co";
export const SUPABASE_KEY =
  process.env.REACT_APP_SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhocWppZXl6b2pidHhjZ3NhdHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4Njc0MzgsImV4cCI6MjA5NzQ0MzQzOH0.z9mjWwLVVXXXE1rmhj6ulgy1N2O4Sph6-8DMHrUd41I";

// Client Supabase créé une seule fois pour toute l'application.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
