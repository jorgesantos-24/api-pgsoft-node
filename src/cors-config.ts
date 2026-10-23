import type { CorsOptions } from "cors";

/** Origens permitidas (Express + Socket.IO). */
export const allowedCorsOrigins = [
  "https://aavip55.vercel.app",
  "https://api-pgsoft-node-production.up.railway.app",
  // TUGAS (casino) em producao
  "https://tugas-665257038137.southamerica-east1.run.app",
  // Local development (game served by this API + local frontend)
  "http://127.0.0.1:3006",
  "http://localhost:3006",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
];

/** Qualquer dominio gerado pelo Railway (muda a cada projeto/deploy). */
const RAILWAY_ORIGIN = /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/;

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (
      !origin ||
      allowedCorsOrigins.includes(origin) ||
      RAILWAY_ORIGIN.test(origin)
    ) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS bloqueado para origem: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Socket.IO: aceita qualquer origem. So transporta saldo/RTP e a pagina do jogo
// e servida por este mesmo servidor, cujo dominio muda a cada deploy no Railway.
export const socketIoCors = {
  origin: (_origin: string, cb: (e: Error | null, ok: boolean) => void) => cb(null, true),
  methods: ["GET", "POST"],
};