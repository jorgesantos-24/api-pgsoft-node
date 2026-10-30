// Gera tiras 3x3 calibradas para hit ~23% e RTP 96,81% (fator 1).
// O PAY_SCALE é resolvido automaticamente para a base ficar em ~55% de RTP.
// Uso: node tools/build-strips.js
const fs = require("fs")
const path = require("path")

const PT = JSON.parse(fs.readFileSync(path.join(__dirname, "paytable.json"), "utf8"))

// ---------------- validação ----------------
if (!Array.isArray(PT.lines) || PT.lines.length !== 9) {
   throw new Error(`paytable.json: "lines" precisa ser array de 9 linhas, veio ${JSON.stringify(PT.lines)}`)
}
if (!PT.symbols || typeof PT.symbols !== "object") {
   throw new Error('paytable.json: falta o objeto "symbols"')
}

const SYM = Object.keys(PT.symbols)
const SCATTER = "8"
const WILD = "0"
const REEL_LEN = 100
const SCATTER_POR_ROLO = 6

for (const s of SYM) {
   const def = PT.symbols[s]
   if (!def || typeof def.pay3 !== "number") {
      throw new Error(`paytable.json: símbolo "${s}" sem "pay3" numérico (veio ${JSON.stringify(def)})`)
   }
}
if (!PT.symbols[SCATTER]) throw new Error(`paytable.json: falta o símbolo scatter "${SCATTER}"`)
if (!PT.symbols[WILD]) throw new Error(`paytable.json: falta o símbolo wild "${WILD}"`)

for (const line of PT.lines) {
   if (!Array.isArray(line) || line.length !== 3) throw new Error(`linha inválida: ${JSON.stringify(line)}`)
   if (line.some((i) => i < 0 || i > 8)) throw new Error(`linha fora da grade 3x3: ${JSON.stringify(line)}`)
}

const PAGANTES = SYM.filter((s) => s !== SCATTER)

// ---------------- parâmetros ----------------
const TARGET_HIT = 0.2315
const HIT_MIN = 0.20
const HIT_MAX = 0.27
const TARGET_BASE_RTP = 0.55
const TARGET_RTP = 0.9681
const SPINS = 200_000
const SEED = 12345
const LINES = PT.lines
const N_LINHAS = LINES.length

const BASE_W = { "6": 22, "7": 22, "5": 14, "4": 12, "2": 9, "3": 6, "1": 4, "0": 4 }
for (const s of PAGANTES) {
   if (BASE_W[s] === undefined) throw new Error(`peso base faltando para o símbolo "${s}"`)
}

let rngState = SEED
function rnd() {
   rngState = (rngState * 1664525 + 1013904223) >>> 0
   return rngState / 4294967296
}

// ---------------- geração ----------------
function buildReel(gamma) {
   const w = {}
   let sum = 0
   for (const s of PAGANTES) {
      const v = Math.pow(BASE_W[s], gamma)
      w[s] = v
      sum += v
   }

   const strip = []
   for (let i = 0; i < REEL_LEN; i++) {
      let r = rnd() * sum
      let pick = PAGANTES[PAGANTES.length - 1]
      for (const s of PAGANTES) {
         r -= w[s]
         if (r <= 0) {
            pick = s
            break
         }
      }
      strip.push(pick)
   }

   // scatter injetado em posições aleatórias, independente do gamma
   const usadas = new Set()
   while (usadas.size < SCATTER_POR_ROLO) usadas.add(Math.floor(rnd() * REEL_LEN))
   for (const pos of usadas) strip[pos] = SCATTER

   return strip
}

// ---------------- avaliação ----------------
function evalGrid(vis, scale) {
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
   return (pay * scale) / N_LINHAS
}

function drawGrid(reels) {
   const vis = []
   for (let r = 0; r < 3; r++) {
      const start = Math.floor(rnd() * REEL_LEN)
      for (let row = 0; row < 3; row++) vis.push(reels[r][(start + row) % REEL_LEN])
   }
   return vis
}

function measure(reels, scale, spins = SPINS) {
   let hit = 0
   let total = 0
   let sq = 0
   let scatters = 0
   let maior = 0

   for (let i = 0; i < spins; i++) {
      const vis = drawGrid(reels)
      const p = evalGrid(vis, scale)
      if (!Number.isFinite(p)) throw new Error(`pay inválido (${p}) na grade ${vis.join("")}`)

      total += p
      sq += p * p
      if (p > 0) hit++
      if (p > maior) maior = p
      if (vis.filter((s) => s === SCATTER).length >= 3) scatters++
   }

   const mean = total / spins
   return {
      rtp: mean,
      hit: hit / spins,
      sd: Math.sqrt(Math.max(0, sq / spins - mean * mean)),
      scatter: scatters / spins,
      maior,
   }
}

// ---------------- busca do hit ----------------
function searchHit() {
   let best = null
   for (let gamma = 0.1; gamma <= 3.0; gamma += 0.02) {
      const reels = [buildReel(gamma), buildReel(gamma), buildReel(gamma)]
      const m = measure(reels, 1, 60_000)
      const err = Math.abs(m.hit - TARGET_HIT)
      if (!best || err < best.err) best = { gamma, reels, m, err }
   }
   return best
}

const best = searchHit()

if (best.m.hit < HIT_MIN || best.m.hit > HIT_MAX) {
   throw new Error(
      `hit fora da banda ${(HIT_MIN * 100).toFixed(0)}-${(HIT_MAX * 100).toFixed(0)}%: ` +
         `melhor foi ${(best.m.hit * 100).toFixed(2)}% com gamma ${best.gamma.toFixed(2)}. Ajuste BASE_W.`,
   )
}

// ---------------- escala e medição final ----------------
const cru = measure(best.reels, 1)
const scale = TARGET_BASE_RTP / cru.rtp
const base = measure(best.reels, scale)

const falta = TARGET_RTP - base.rtp
const spins = 10
// multNecessario aqui é o TOTAL pago pela feature, em apostas
const multNecessario = base.scatter > 0 ? falta / base.scatter : Infinity

// ---------------- saída ----------------
fs.mkdirSync(path.join(__dirname, "data"), { recursive: true })
fs.writeFileSync(path.join(__dirname, "data", "strips.json"), JSON.stringify(best.reels))
fs.writeFileSync(
   path.join(__dirname, "data", "feature-config.json"),
   JSON.stringify({ spins, scatterTrigger: base.scatter, multNecessario, payScale: scale }, null, 2),
)

const gatilho = Math.round(1 / base.scatter)
console.log(`gamma escolhido ....... ${best.gamma.toFixed(2)}`)
console.log(`PAY_SCALE resolvido ... ${scale.toFixed(3)}`)
console.log(`hit frequency ......... ${(base.hit * 100).toFixed(2)}%  (banda 20-27%)`)
console.log(`RTP base .............. ${(base.rtp * 100).toFixed(2)}%  (alvo 55%)`)
console.log(`desvio base ........... ${base.sd.toFixed(2)}x  (alvo 2,5 a 5)`)
console.log(`maior prêmio da base .. ${base.maior.toFixed(1)}x`)
console.log(`gatilho de scatter .... 1 em ${gatilho}  (alvo 120 a 250)`)
console.log(`total medio necessario na feature: ${multNecessario.toFixed(1)}x`)

if (gatilho < 110) console.warn("AVISO: scatter frequente demais. Baixe SCATTER_POR_ROLO para 5.")
if (gatilho > 260) console.warn("AVISO: scatter raro demais. Suba SCATTER_POR_ROLO para 7.")