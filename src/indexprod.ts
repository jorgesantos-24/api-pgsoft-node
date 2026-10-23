import express, { Request, Response } from "express"
import helmet from "helmet"
import cors from "cors"
import fs from "fs"
import https from "https"
import http from "http"
import logger from "./logger/index"
import routes from "./routes"
import * as figlet from "figlet"
import path from "path"
import compression from "compression"
import { Server, Socket } from "socket.io"
import allfunctions from "./functions/allfunctions"
import { emitirEventoInterno, adicionarListener } from "./serverEvents"
import { corsOptions, socketIoCors } from "./cors-config"

import "dotenv/config"

// const privateKey = fs.readFileSync("server.key", "utf8")
// const certificate = fs.readFileSync("server.crt", "utf8")
// const credentials = {
//   key: privateKey,
//   cert: certificate,
// }
const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
   transports: ["polling", "websocket"],
   cors: socketIoCors,
});

console.log(figlet.textSync("API PHILLYPS"), "\n")
logger.info('DOMINIO CONECTADO: ' + process.env.DOMINIO_API)

// httpServer.listen(process.env.PORT, () => {
//   logger.info("SERVIDOR INICIADO JOHN " + process.env.PORT)

// })
declare module "express-serve-static-core" {
   interface Request {
      io: Server
   }
}
const users = new Map<string, any>()

io.on("connection", async (socket: Socket) => {
   io.setMaxListeners(50);
   console.log("Usuário Conectado", socket.id);

   socket.on("join", async (socket1) => {
      const token: any = socket1.token
      const gameid: any = socket1.gameId

      logger.info('[join] token=' + token + ' gameId=' + gameid)

      const u = await allfunctions.getuserbytoken(token)
      if (u[0]) {
         socket.emit("att", {
            token,
            username: u[0].username,
            bet: 0,
            saldo: u[0].saldo,
            rtp: u[0].rtp,
            agentid: u[0].agentid,
            gamecode: gameid,
         })
         logger.info('[join] att enviado para ' + u[0].username)
      } else {
         logger.info('[join] utilizador NAO encontrado para token ' + token)
      }

      setInterval(async function () {
         const user = await allfunctions.getuserbytoken(token)

         if (!user[0]) {
            socket.disconnect(true)
            return false
         }

         const retornado = user[0].valorganho
         const valorapostado = user[0].valorapostado

         const rtp = Math.round((retornado / valorapostado) * 100)

         if (isNaN(rtp) === false) {
            await allfunctions.updatertp(token, rtp)
         }
      }, 10000)
   })

   io.removeAllListeners("attganho");
   io.removeAllListeners("att");

   adicionarListener("attganho", async (dados) => {
      users.forEach(async (valor, chave) => {
         let newvalue = parseFloat(users.get(socket.id).aw) + dados.aw
         users.set(socket.id, {
            aw: newvalue,
         })
      })
      emitirEventoInterno("awreceive", {
         aw: users.get(socket.id).aw,
      })
   })

   adicionarListener("att", (dados) => {
      users.forEach((valor, chave) => {
         if (valor.token === dados.token) {
            return false
         } else {
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
            })
         }
      })

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
         })
      }
   })

   socket.on("disconnect", (reason) => {
      users.delete(socket.id)

      console.log("Cliente desconectado:", reason)
   })
})

// Middleware para adicionar compressão
app.use(compression());

// Middleware para adicionar o socket.io em cada requisição
app.use((req: Request, res: Response, next) => {
   req.io = io // Adiciona o socket.io ao objeto req
   next()
})

app.use(cors(corsOptions))
app.options("*", cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Autoriza o service worker dos jogos a usar o âmbito "/"
app.use((req: Request, res: Response, next) => {
   res.setHeader("Service-Worker-Allowed", "/")
   next()
})

// The games build their API host as "https://api.<domain from 'or'>", which only
// resolves if a matching "api." DNS entry exists. Railway does not give sub-subdomains,
// so this injects a small script into each game's index.html that sends /web-api/ and
// /game-api/ calls to this same server instead. Runs in DEV and PROD; disable with API_SHIM=0.
const devApiShim = `<script>(function(){
var O=location.origin;
function fix(u){try{var x=new URL(String(u),location.href);if(/^\\/(web-api|game-api)\\//.test(x.pathname)&&x.origin!==O){return O+x.pathname+x.search;}}catch(e){var m=String(u).match(/\\/(web-api|game-api)\\/.*/);if(m)return O+m[0];}return u;}
var op=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=fix(u);return op.apply(this,arguments);};
var f=window.fetch;if(f)window.fetch=function(u,i){if(typeof u==="string"||u instanceof URL)u=fix(u);return f.call(this,u,i);};
})();</script>`
app.get(/^\/[^/]+\/(index\.html)?$/, (req: Request, res: Response, next) => {
   if (process.env.API_SHIM === "0") return next()
   const file = path.join(__dirname, "public", req.path.split("/")[1], "index.html")
   fs.readFile(file, "utf8", (err, html) => {
      if (err) return next()
      res.type("html").send(html.replace(/<head>/i, "<head>" + devApiShim))
   })
})

app.use("/", express.static(path.join(__dirname, "public")))
app.use(
   helmet.contentSecurityPolicy({
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
            // TUGAS / AAVIP55 e qualquer front https (o Railway muda de subdominio)
            "https:",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
         ],
      },
   }),
)

app.use("/status", (req, res) => {
   res.json({ status: "operational" })
})

app.use((req: Request, res: Response, next) => {
   logger.info('[REQ] ' + req.method + ' ' + req.url)
   next()
})

app.use(routes)
httpServer.listen(process.env.PORT, () => {
   logger.info("API RODANDO NA PORTA: " + process.env.PORT)
})