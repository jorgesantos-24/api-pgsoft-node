"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketIoCors = exports.corsOptions = exports.allowedCorsOrigins = void 0;
/** Origens permitidas (Express + Socket.IO). */
exports.allowedCorsOrigins = [
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
exports.corsOptions = {
    origin(origin, callback) {
        if (!origin ||
            exports.allowedCorsOrigins.includes(origin) ||
            AUTO_ORIGIN.test(origin)) {
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
exports.socketIoCors = {
    origin: (_origin, cb) => cb(null, true),
    methods: ["GET", "POST"],
};