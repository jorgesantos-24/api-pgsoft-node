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
   transports: ["websocket"],
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
   console.log("Usuário Conectado", socket.id);

   socket.on("join", async (socket1) => {
      const token: any = socket1.token
      const gameid: any = socket1.gameId

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
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// --- Cache dos assets estaticos -------------------------------------------------
// Os ficheiros da PG Soft tem hash no nome (ex.: c87db9bc-....c0d5d.json), por isso
// o conteudo nunca muda com o mesmo nome: cache eterno e seguro.
// Sem isto, o express.static manda "max-age=0" e o browser revalida ~236 ficheiros
// a cada abertura de jogo (alguns levam 10s+) -> tela preta / carregamento infinito.
app.use((req: Request, res: Response, next) => {
   const p = req.path
   if (p.startsWith("/web-api") || p.startsWith("/game-api")) { next(); return }

   const media = /\.(png|jpe?g|webp|gif|mp3|ogg|m4a|wav|plist|bin|atlas|fnt|ttf|woff2?)$/i.test(p)
   const assetJson = p.includes("/assets/") && /\.json$/i.test(p)

   if (media || assetJson) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
   } else if (/\.json$/i.test(p)) {
      res.setHeader("Cache-Control", "public, max-age=3600")
   } else {
      // html, js e rotas sem extensao (ex.: /48) revalidam sempre
      res.setHeader("Cache-Control", "no-cache")
   }
   next()
})

app.use("/", express.static(path.join(__dirname, "public")))
app.use(
   helmet.contentSecurityPolicy({
      directives: {
         "default-src": ["'none'"],
         "base-uri": ["'self'"],
         "font-src": ["'self'", "https:", "data:"],
         "frame-ancestors": ["'self'"],
         "img-src": ["'self'", "data:"],
         "object-src": ["'none'"],
         "script-src": ["'self'", "https://cdnjs.cloudflare.com"],
         "style-src": ["'self'", "https://cdnjs.cloudflare.com"],
      },
   }),
)

app.use("/status", (req, res) => {
   res.json({ status: "operational" })
})

app.use(routes)
httpServer.listen(process.env.PORT, () => {
   logger.info("API RODANDO NA PORTA: " + process.env.PORT)
})