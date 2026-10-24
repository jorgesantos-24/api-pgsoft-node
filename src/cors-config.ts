import type { CorsOptions } from "cors";

/** Origens permitidas (Express + Socket.IO). */
export const allowedCorsOrigins = [
  "https://aavip55.vercel.app",
  "https://api-pgsoft-node-production.up.railway.app",
  "https://tugas-665257038137.southamerica-east1.run.app",
  "https://pgsoft-api-665257038137.southamerica-east1.run.app",
  "http://127.0.0.1:3006",
  "http://localhost:3006",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
];

/** Dominios automaticos (Railway e Cloud Run) - mudam a cada deploy. */
const AUTO_ORIGIN = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.(up\.railway\.app|run\.app)$/;

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (
      !origin ||
      allowedCorsOrigins.includes(origin) ||
      AUTO_ORIGIN.test(origin)
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

// Socket.IO: aceita qualquer origem.
// O primeiro parametro TEM de aceitar "undefined": uma ligacao pode nao trazer
// o cabecalho Origin, e o tipo customOrigin do socket.io exige "string | undefined".
// Sem anotacao ": CorsOptions" de proposito - o socket.io traz a sua propria copia
// dos tipos do cors, e o TypeScript recusa a mistura.
export const socketIoCors = {
  origin: (_origin: string | undefined, cb: (e: Error | null, ok: boolean) => void) =>
    cb(null, true),
  methods: ["GET", "POST"],
};