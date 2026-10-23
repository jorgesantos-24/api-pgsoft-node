"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const index_1 = __importDefault(require("./logger/index"));
const routes_1 = __importDefault(require("./routes"));
const figlet = __importStar(require("figlet"));
const path_1 = __importDefault(require("path"));
const compression_1 = __importDefault(require("compression"));
const socket_io_1 = require("socket.io");
const allfunctions_1 = __importDefault(require("./functions/allfunctions"));
const serverEvents_1 = require("./serverEvents");
const cors_config_1 = require("./cors-config");
require("dotenv/config");
// const privateKey = fs.readFileSync("server.key", "utf8")
// const certificate = fs.readFileSync("server.crt", "utf8")
// const credentials = {
//   key: privateKey,
//   cert: certificate,
// }
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer, {
    transports: ["polling", "websocket"],
    cors: cors_config_1.socketIoCors,
});
console.log(figlet.textSync("API PHILLYPS"), "\n");
index_1.default.info('DOMINIO CONECTADO: ' + process.env.DOMINIO_API);
const users = new Map();
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    io.setMaxListeners(50);
    console.log("Usuário Conectado", socket.id);
    socket.on("join", (socket1) => __awaiter(void 0, void 0, void 0, function* () {
        const token = socket1.token;
        const gameid = socket1.gameId;
        index_1.default.info('[join] token=' + token + ' gameId=' + gameid);
        const u = yield allfunctions_1.default.getuserbytoken(token);
        if (u[0]) {
            socket.emit("att", {
                token,
                username: u[0].username,
                bet: 0,
                saldo: u[0].saldo,
                rtp: u[0].rtp,
                agentid: u[0].agentid,
                gamecode: gameid,
            });
            index_1.default.info('[join] att enviado para ' + u[0].username);
        }
        else {
            index_1.default.info('[join] utilizador NAO encontrado para token ' + token);
        }
        setInterval(function () {
            return __awaiter(this, void 0, void 0, function* () {
                const user = yield allfunctions_1.default.getuserbytoken(token);
                if (!user[0]) {
                    socket.disconnect(true);
                    return false;
                }
                const retornado = user[0].valorganho;
                const valorapostado = user[0].valorapostado;
                const rtp = Math.round((retornado / valorapostado) * 100);
                if (isNaN(rtp) === false) {
                    yield allfunctions_1.default.updatertp(token, rtp);
                }
            });
        }, 10000);
    }));
    io.removeAllListeners("attganho");
    io.removeAllListeners("att");
    (0, serverEvents_1.adicionarListener)("attganho", (dados) => __awaiter(void 0, void 0, void 0, function* () {
        users.forEach((valor, chave) => __awaiter(void 0, void 0, void 0, function* () {
            let newvalue = parseFloat(users.get(socket.id).aw) + dados.aw;
            users.set(socket.id, {
                aw: newvalue,
            });
        }));
        (0, serverEvents_1.emitirEventoInterno)("awreceive", {
            aw: users.get(socket.id).aw,
        });
    }));
    (0, serverEvents_1.adicionarListener)("att", (dados) => {
        users.forEach((valor, chave) => {
            if (valor.token === dados.token) {
                return false;
            }
            else {
                users.set(socket.id, {
                    token: dados.token,
                    username: dados.username,
                    bet: dados.bet,
                    saldo: dados.saldo,
                    rtp: dados.rtp,
                    agentid: dados.agentid,
                    socketid: socket.id,
                    gamecode: dados.gamecode,
                    aw: 0,
                });
            }
        });
        if (Object.keys(users).length === 0) {
            users.set(socket.id, {
                token: dados.token,
                username: dados.username,
                bet: dados.bet,
                saldo: dados.saldo,
                rtp: dados.rtp,
                agentid: dados.agentid,
                socketid: socket.id,
                gamecode: dados.gamecode,
                aw: 0,
            });
        }
    });
    socket.on("disconnect", (reason) => {
        users.delete(socket.id);
        console.log("Cliente desconectado:", reason);
    });
}));
// Middleware para adicionar compressão
app.use((0, compression_1.default)());
// Middleware para adicionar o socket.io em cada requisição
app.use((req, res, next) => {
    req.io = io; // Adiciona o socket.io ao objeto req
    next();
});
app.use((0, cors_1.default)(cors_config_1.corsOptions));
app.options("*", (0, cors_1.default)(cors_config_1.corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Autoriza o service worker dos jogos a usar o âmbito "/"
app.use((req, res, next) => {
    res.setHeader("Service-Worker-Allowed", "/");
    next();
});
// The games build their API host as "https://api.<domain from 'or'>", which only
// resolves if a matching "api." DNS entry exists. Railway does not give sub-subdomains,
// so this injects a small script into each game's index.html that sends /web-api/ and
// /game-api/ calls to this same server instead. Runs in DEV and PROD; disable with API_SHIM=0.
const devApiShim = `<script>(function(){
var O=location.origin;
function fix(u){try{var x=new URL(String(u),location.href);if(/^\\/(web-api|game-api)\\//.test(x.pathname)&&x.origin!==O){return O+x.pathname+x.search;}}catch(e){var m=String(u).match(/\\/(web-api|game-api)\\/.*/);if(m)return O+m[0];}return u;}
var op=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=fix(u);return op.apply(this,arguments);};
var f=window.fetch;if(f)window.fetch=function(u,i){if(typeof u==="string"||u instanceof URL)u=fix(u);return f.call(this,u,i);};
})();</script>`;
app.get(/^\/[^/]+\/(index\.html)?$/, (req, res, next) => {
    if (process.env.API_SHIM === "0")
        return next();
    const file = path_1.default.join(__dirname, "public", req.path.split("/")[1], "index.html");
    fs_1.default.readFile(file, "utf8", (err, html) => {
        if (err)
            return next();
        res.type("html").send(html.replace(/<head>/i, "<head>" + devApiShim));
    });
});
app.use("/", express_1.default.static(path_1.default.join(__dirname, "public")));
app.use(helmet_1.default.contentSecurityPolicy({
    useDefaults: false,
    directives: {
        "default-src": ["'self'", "https:", "data:", "blob:"],
        "connect-src": ["'self'", "https:", "wss:", "ws:"],
        "img-src": ["'self'", "data:", "https:", "blob:"],
        "media-src": ["'self'", "data:", "https:", "blob:"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "font-src": ["'self'", "https:", "data:"],
        "frame-ancestors": [
            "'self'",
            "https:",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
    },
}));
app.use("/status", (req, res) => {
    res.json({ status: "operational" });
});
app.use((req, res, next) => {
    index_1.default.info('[REQ] ' + req.method + ' ' + req.url);
    next();
});
app.use(routes_1.default);
httpServer.listen(process.env.PORT, () => {
    index_1.default.info("API RODANDO NA PORTA: " + process.env.PORT);
});