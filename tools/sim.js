// Simulador Monte Carlo do Fortune Tiger (base + feature + cap de 2500x).
// Mede o RTP com fator 1, deriva os fatores por perfil e roda as sessões.
// Uso: node tools/sim.js
const fs = require("fs")
const path = require("path")

const DADOS = path.join(__dirname, "data")
const ler = (f) => JSON.parse(fs.readFileSync(path.join(DADOS, f), "utf8"))

const PT = JSON.parse(fs.readFileSync(path.join(__dirname, "paytable.json"), "utf8"))
const STRIPS = ler("strips.json")
const FEATURE = ler("feature.json")
const CONFIG = ler("feature-config.json")

// ---------------- validação ----------------
const SCATTER = "8"
const WILD = "0"

if (!Array.isArray(STRIPS) || STRIPS.length !== 3) {
   throw new Error(`strips.json: esperava 3 rolos, veio ${Array.isArray(STRIPS) ? STRIPS.length : typeof STRIPS}`)
}
STRIPS.forEach((r, i) => {
   if (!Array.isArray(r) || r.length === 0) throw new Error(`strips.json: rolo ${i} vazio ou inválido`)
   const ruim = r.find((s) => !PT.symbols[s])
   if (ruim) throw new Error(`strips.json: rolo ${i} tem símbolo "${ruim}" fora da paytable`)
})

if (!Array.isArray(FEATURE) || FEATURE.length === 0) {
   throw new Error(`feature.json: esperava array com valores, veio ${typeof FEATURE}`)
}
const ruimFeat = FEATURE.findIndex((v) => typeof v !== "number" || !Number.isFinite(v))
if (ruimFeat >= 0) {
   throw new Error(`feature.json: valor inválido no índice ${ruimFeat} (${JSON.stringify(FEATURE[ruimFeat])})`)
}

const PAY_SCALE = CONFIG.payScale
if (typeof PAY_SCALE !== "number" || !Number.isFinite(PAY_SCALE) || PAY_SCALE <= 0) {
   throw new Error(`feature-config.json: "payScale" inválido (${JSON.stringify(PAY_SCALE)}). Rode build-strips.js.`)
}
if (typeof CONFIG.scatterTrigger !== "number" || !Number.isFinite(CONFIG.scatterTrigger)) {
   throw new Error(`feature-config.json: "scatterTrigger" inválido. Rode build-strips.js.`)
}

const LINES = PT.lines
const N_LINHAS = LINES.length
const CAP = 2500

const SPINS_RTP = 2_000_000
const SESSOES = 20_000
const LENGTHS = [100, 300, 600, 1000, 5000]
const BET = 2
const ALVOS = { normal: 0.92, vitrine: 1.25 }
const BANCO_APOSTAS = { normal: 250, vitrine: 1000 }

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function drawGrid() {
   const vis = []
   for (let r = 0; r < 3; r++) {
      const strip = STRIPS[r]
      const start = Math.floor(Math.random() * strip.length)
      for (let row = 0; row < 3; row++) vis.push(strip[(start + row) % strip.length])
   }
   return vis
}

function evalLines(vis) {
   let pay = 0
   for (const line of LINES) {
      const [a, b, c] = line.map((i) => vis[i])
      if (a === SCATTER || b === SCATTER || c === SCATTER) continue

      let sym = null
      if (a !== WILD) sym = a
      else if (b !== WILD) sym = b
      else if (c !== WILD) sym = c
      else sym = WILD

      const ok = [a, b, c].every((s) => s === sym || s === WILD)
      if (ok) pay += PT.symbols[sym].pay3
   }
   return (pay * PAY_SCALE) / N_LINHAS
}

// Um giro: retorna o prêmio em apostas, já com cap
function girar(factor) {
   const vis = drawGrid()
   const basePay = evalLines(vis) * factor
   let pay = basePay
   if (vis.filter((s) => s === SCATTER).length >= 3) pay += pick(FEATURE) * factor
   if (pay > CAP) pay = CAP
   return { pay, basePay }
}

// ---------------- teste de fumaça ----------------
console.log("=== TESTE DE FUMAÇA (10 giros) ===")
for (let i = 0; i < 10; i++) {
   const { pay } = girar(1)
   if (!Number.isFinite(pay)) throw new Error(`giro ${i} devolveu prêmio inválido: ${pay}`)
   process.stdout.write(pay.toFixed(2) + " ")
}
console.log("\n")

function medirBase() {
   let total = 0
   let sq = 0
   let hits = 0
   for (let i = 0; i < SPINS_RTP; i++) {
      const { pay } = girar(1)
      total += pay
      sq += pay * pay
      if (pay > 0) hits++
   }
   const mean = total / SPINS_RTP
   return { rtp: mean, hit: hits / SPINS_RTP, sd: Math.sqrt(Math.max(0, sq / SPINS_RTP - mean * mean)) }
}

function rodarSessoes(factor, length, bancoApostas) {
   const bancoInicial = bancoApostas * BET
   let lucrativas = 0
   let quebradas = 0
   let girou = 0
   let pagou = 0
   let maior = 0
   const eventos = { 20: 0, 50: 0, 100: 0, 500: 0 }
   const finais = []

   for (let s = 0; s < SESSOES; s++) {
      let saldo = bancoInicial
      let quebrou = false

      for (let i = 0; i < length; i++) {
         if (saldo < BET) {
            quebrou = true
            break
         }
         const { pay } = girar(factor)
         const ganho = pay * BET
         saldo += ganho - BET
         pagou += ganho
         girou++
         if (pay > maior) maior = pay
         for (const lim of [20, 50, 100, 500]) if (pay >= lim) eventos[lim]++
      }

      finais.push(saldo)
      if (quebrou) quebradas++
      if (saldo > bancoInicial) lucrativas++
   }

   finais.sort((a, b) => a - b)
   return {
      lucro: lucrativas / SESSOES,
      quebra: quebradas / SESSOES,
      mediana: finais[Math.floor(finais.length / 2)],
      p10: finais[Math.floor(finais.length * 0.1)],
      rtp: girou > 0 ? pagou / (girou * BET) : 0,
      maior,
      por1000: Object.fromEntries(Object.entries(eventos).map(([k, v]) => [k, (v / Math.max(1, girou)) * 1000])),
   }
}

const base = medirBase()
console.log(`=== BASE COM FATOR 1 ===`)
console.log(`RTP total .......... ${(base.rtp * 100).toFixed(2)}%  (alvo 96,81%)`)
console.log(`hit frequency ...... ${(base.hit * 100).toFixed(2)}%`)
console.log(`desvio por giro .... ${base.sd.toFixed(2)}x`)

if (Math.abs(base.rtp - 0.9681) > 0.03) {
   console.warn(`AVISO: RTP base fora do alvo em ${((base.rtp - 0.9681) * 100).toFixed(2)} pontos.`)
}

const fatores = {}
for (const [nome, alvo] of Object.entries(ALVOS)) {
   fatores[nome] = alvo / base.rtp
   console.log(`fator ${nome.padEnd(8)} .... ${fatores[nome].toFixed(4)}  (alvo ${(alvo * 100).toFixed(0)}%)`)
}

for (const [nome, factor] of Object.entries(fatores)) {
   console.log(`\n=== PERFIL ${nome.toUpperCase()} — fator ${factor.toFixed(4)} — banco ${BANCO_APOSTAS[nome]} apostas ===`)
   for (const len of LENGTHS) {
      const r = rodarSessoes(factor, len, BANCO_APOSTAS[nome])
      console.log(
         `${String(len).padStart(5)} giros | lucro ${(r.lucro * 100).toFixed(1).padStart(5)}%` +
            ` | quebra ${(r.quebra * 100).toFixed(1).padStart(5)}%` +
            ` | mediana R$${r.mediana.toFixed(0).padStart(6)}` +
            ` | p10 R$${r.p10.toFixed(0).padStart(6)}` +
            ` | RTP ${(r.rtp * 100).toFixed(1)}%` +
            ` | max ${r.maior.toFixed(0)}x`,
      )
   }
   const ev = rodarSessoes(factor, 1000, BANCO_APOSTAS[nome]).por1000
   console.log(
      `eventos/1000 giros: >=20x ${ev[20].toFixed(1)} | >=50x ${ev[50].toFixed(2)}` +
         ` | >=100x ${ev[100].toFixed(2)} | >=500x ${ev[500].toFixed(3)}`,
   )
}