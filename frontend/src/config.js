// Central config — edit VITE_API_URL in .env to switch environments.
// Local dev:  http://localhost:5000  (used automatically when env var is missing)
// Production: set VITE_API_URL=https://overclocked-fixnow.onrender.com  in .env

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const AI_BASE  = import.meta.env.VITE_AI_URL  || 'http://localhost:8000';
