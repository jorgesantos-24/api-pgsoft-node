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
import { treinoAtt } from "./attTrain"

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
   logger.info('[connect] id=' + socket.id)

   // DIAGNOSTICO: registra tudo o que o cliente envia pelo socket.
   // Se houver um evento sem handler (ex.: algo de spin), aparece aqui.
   socket.onAny((event: string, ...args: any[]) => {
      let payload = ''
      try { payload = JSON.stringify(args).slice(0, 400) } catch (e) { payload = '[nao serializavel]' }
      logger.info('[sock] id=' + socket.id + ' evento=' + event + ' payload=' + payload)
   })

   socket.on("join", async (payload: any) => {
      payload = payload || {}

      let token: string = payload.token
      const gameid: any = payload.gameId

      // REDE DE SEGURANCA: se o link do jogo vier com "atk" em vez de "t", o motor
      // manda o join sem token e a sessao morre (erro C1002). O referer do iframe
      // tem o URL completo do jogo, por isso o token vai-se buscar la.
      if (!token) {
         const ref = socket.handshake.headers.referer || ""
         const m = ref.match(/[?&](?:t|atk)=([0-9a-fA-F-]{36})/)
         if (m) {
            token = m[1]
            logger.info('[join] token recuperado do referer: ' + token)
         }
      }

      logger.info('[join] token=' + token + ' gameId=' + gameid)

      if (!token) {
         logger.info('[join] SEM TOKEN. socket=' + socket.id + ' referer=' + (socket.handshake.headers.referer || ''))
         return
      }

      const u = await allfunctions.getuserbytoken(token)
      if (!u[0]) {
         logger.info('[join] utilizador NAO encontrado para token ' + token)
         return
      }

      const att = {
         token,
         username: u[0].username,
         bet: 0,
         saldo: u[0].saldo,
         rtp: u[0].rtp,
         agentid: u[0].agentid,
         gamecode: gameid,
      }

      // O cliente manda o "join" ANTES de acabar de arrancar o motor, por isso um
      // att unico chega muitas vezes antes de o ouvinte existir e perde-se.
      // Em vez de disparar 5 e calar aos 6s, insistimos ate o motor responder
      // com o verifySession (pararTreino, chamado no sessioncontroller).
      logger.info('[join] arranca treino de att para ' + u[0].username)
      treinoAtt(socket, token, att)

      // RTP recalculado a cada 10s enquanto a sessao viver.
      const intervalo = setInterval(async function () {
         if (!socket.connected) { clearInterval(intervalo); return }

         const user = await allfunctions.getuserbytoken(token)
         if (!user[0]) { clearInterval(intervalo); return }

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
      const atual = users.get(socket.id)
      if (!atual) return

      const newvalue = parseFloat(atual.aw || 0) + dados.aw
      users.set(socket.id, { ...atual, aw: newvalue })

      emitirEventoInterno("awreceive", {
         aw: newvalue,
      })
   })

   adicionarListener("att", (dados) => {
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
   })

   socket.on("disconnect", (reason) => {
      users.delete(socket.id)

      logger.info('[disconnect] id=' + socket.id + ' motivo=' + reason)
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

// The games build their API host as "https://api.<domain from 'or'>", which only
// resolves if a matching "api." DNS entry exists. Railway does not give sub-subdomains,
// so this injects a small script into each game's index.html that sends /web-api/ and
// /game-api/ calls to this same server instead. Runs in DEV and PROD; disable with API_SHIM=0.
// Escrito sem crases de proposito: sobrevive a copiar/colar.
const devApiShim = [
   '<script>(function(){',
   'var O=location.origin;',
   'function fix(u){try{var x=new URL(String(u),location.href);if(/^\\/(web-api|game-api)\\//.test(x.pathname)&&x.origin!==O){return O+x.pathname+x.search;}}catch(e){var m=String(u).match(/\\/(web-api|game-api)\\/.*/);if(m)return O+m[0];}return u;}',
   'var op=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=fix(u);return op.apply(this,arguments);};',
   'var f=window.fetch;if(f)window.fetch=function(u,i){if(typeof u==="string"||u instanceof URL)u=fix(u);return f.call(this,u,i);};',
   '})();</script>',
].join('\n');

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