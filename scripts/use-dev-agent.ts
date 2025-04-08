// Points every agent's callbackurl at the fake agent built into the API
// (/dev-agent/, only active with AMBIENTE=DEV), so spins work without the
// casino site on :3000. Run with: npm run dev:agent
import "dotenv/config"
import promisePool from "../src/database"

const port = process.env.PORT || 3006
const url = `http://127.0.0.1:${port}/dev-agent/`

;(async () => {
   const [res]: any = await promisePool.query("UPDATE agents SET callbackurl = ?", [url])
   console.log(`${res.affectedRows} agente(s) agora usam ${url}`)
   process.exit(0)
})().catch((e) => {
   console.error("Erro:", e.message)
   process.exit(1)
})
