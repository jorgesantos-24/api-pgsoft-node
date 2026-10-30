// Valida o endpoint e mede o RTP. Uso:
//   node tools/teste-carga.js URL TOKEN QTD PERFIL [CS] [CONCORRENCIA]
const [, , BASE, TOKEN, QTD, PERFIL, CS_ARG, CONC_ARG] = process.argv
const N = Number(QTD || 1000)
const CS = Number(CS_ARG || 0.02)
const CONC = Math.max(1, Number(CONC_ARG || 5))
const ML = 1
const BET = CS * ML * 5
const LINHAS = [
   [1, 4, 7], [0, 3, 6], [2, 5, 8], [0, 4, 8], [2, 4, 6],
   [1, 3, 7], [1, 5, 7], [0, 5, 6], [2, 3, 8],
]

const falhas = []
let processados = 0
let pago = 0
let ganhos = 0
let features = 0
let maior = 0
let iniciou = Date.now()

async function umGiro() {
   const r = await fetch(`${BASE}/game-api/fortune-tiger/v2/Spin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ atk: TOKEN, cs: CS, ml: ML }),
   })
   if (!r.ok) throw new Error(`HTTP ${r.status}`)
   return (await r.json()).dt.si
}

const ord = (v) => [...v].sort((a, b) => a - b)

function validar(si) {
   if (!Array.isArray(si.orl) || si.orl.length !== 9) {
      falhas.push(`orl inválido (${si.orl?.length})`)
      return
   }
   if (si.orl.some((s) => !"012345678".includes(s))) {
      falhas.push("símbolo inválido em orl")
      return
   }

   const esperado = {}
   for (const linha of LINHAS) {
      const [a, b, c] = linha.map((i) => si.orl[i])
      if (a === "8" || b === "8" || c === "8") continue
      const sym = a !== "0" ? a : b !== "0" ? b : c !== "0" ? c : "0"
      if ([a, b, c].every((s) => s === sym || s === "0")) {
         esperado[sym] = [...(esperado[sym] ?? []), ...linha]
      }
   }

   const recebido = {}
   for (const [k, v] of Object.entries(si.wp ?? {})) {
      if (k !== "8") recebido[k] = ord([...new Set(v)])
   }
   const esperadoOrd = {}
   for (const k of Object.keys(esperado).sort()) esperadoOrd[k] = ord([...new Set(esperado[k])])
   const recebidoOrd = {}
   for (const k of Object.keys(recebido).sort()) recebidoOrd[k] = recebido[k]

   if (JSON.stringify(recebidoOrd) !== JSON.stringify(esperadoOrd)) {
      falhas.push(`wp diverge: recebido ${JSON.stringify(recebidoOrd)} esperado ${JSON.stringify(esperadoOrd)}`)
   }

   if (si.tw === 0 && si.wc !== 31) falhas.push(`sem prêmio com wc ${si.wc}`)
   if (si.tw > 0 && si.wc !== 17) falhas.push(`com prêmio e wc ${si.wc}`)
}

async function trabalhador() {
   while (processados < N) {
      const i = ++processados
      try {
         const si = await umGiro()
         validar(si)
         if (si.st === 4) features++
         pago += si.tw
         if (si.tw > 0) ganhos++
         if (si.tw / BET > maior) maior = si.tw / BET
      } catch (e) {
         falhas.push(`giro ${i}: ${e.message}`)
      }
      if (i % 25 === 0) {
         const seg = (Date.now() - iniciou) / 1000
         process.stdout.write(
            `  ${i}/${N} | rtp ${((pago / (i * BET)) * 100).toFixed(1)}% | ~${Math.round(((N - i) / i) * seg)}s restantes\n`,
         )
      }
   }
}

async function main() {
   try {
      await umGiro()
   } catch (e) {
      console.log(`Servidor não respondeu: ${e.message}`)
      process.exit(1)
   }
   iniciou = Date.now()
   await Promise.all(Array.from({ length: CONC }, trabalhador))

   const giros = processados
   console.log(`\nperfil ............ ${PERFIL || "?"}`)
   console.log(`aposta ............ R$${BET.toFixed(2)}`)
   console.log(`giros ............. ${giros}`)
   console.log(`RTP ............... ${((pago / (giros * BET)) * 100).toFixed(2)}%`)
   console.log(`hit frequency ..... ${((ganhos / giros) * 100).toFixed(2)}%`)
   console.log(`features .......... ${features}  (esperado ~${Math.round(giros / 118)})`)
   console.log(`maior prêmio ...... ${maior.toFixed(0)}x`)
   console.log(`falhas ............ ${falhas.length}`)
   const contagem = {}
   for (const f of falhas) contagem[f] = (contagem[f] || 0) + 1
   Object.entries(contagem).slice(0, 15).forEach(([f, n]) => console.log(`  ${n}x ${f}`))
   if (falhas.length) process.exitCode = 1
}

main()