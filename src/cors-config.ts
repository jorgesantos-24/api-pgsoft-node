import type { CorsOptions } from "cors";

/** Origens permitidas (Express + Socket.IO). */
export const allowedCorsOrigins = [
  "https://aavip55.vercel.app",
  "https://api-pgsoft-node-production.up.railway.app",
  // TUGAS (casino) em produção
  "https://tugas-665257038137.southamerica-east1.run.app",
  // Local development (game served by this API + local frontend)
  "http://127.0.0.1:3006",
  "http://localhost:3006",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
];

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedCorsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS bloqueado para origem: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

export const socketIoCors = {
  origin: allowedCorsOrigins,
  methods: ["GET", "POST"],
};