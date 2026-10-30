// Gera a distribuição de prêmio da feature (múltiplos da aposta).
// Média travada no alvo, cauda lognormal. O cap final é aplicado no motor.
// Uso: node tools/build-feature.js
const fs = require("fs")
const path = require("path")

const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "feature-config.json"), "utf8"))

const ALVO = CONFIG.multNecessario
const CAP = 6000 // cap folgado: o motor corta em 2500x depois do fator
const AMOSTRAS = 5000
const SIGMA = 1.05
const SEED = 987

let rngState = SEED
function rnd() {
   rngState = (rngState * 1664525 + 1013904223) >>> 0
   return rngState / 4294967296
}

function normal() {
   let u = 0
   let v = 0
   while (u === 0) u = rnd()
   while (v === 0) v = rnd()
   return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function gerar(escala) {
   const out = []
   for (let i = 0; i < AMOSTRAS; i++) {
      const v = Math.exp(SIGMA * normal()) * escala
      out.push(Math.min(v, CAP))
   }
   return out
}

function media(arr) {
   return arr.reduce((a, b) => a + b, 0) / arr.length
}

let lo = 0.01
let hi = 500
let valores = null
for (let i = 0; i < 80; i++) {
   const meio = (lo + hi) / 2
   valores = gerar(meio)
   const m = media(valores)
   if (Math.abs(m - ALVO) / ALVO < 0.003) break
   if (m < ALVO) lo = meio
   else hi = meio
}

valores = valores.map((v) => Math.max(0.2, Math.round(v * 100) / 100))

const m = media(valores)
const desvio = Math.sqrt(valores.reduce((a, b) => a + (b - m) ** 2, 0) / valores.length)
const ord = [...valores].sort((a, b) => a - b)
const pct = (p) => ord[Math.floor(ord.length * p)]
const conta = (lim) => valores.filter((v) => v >= lim).length

fs.writeFileSync(path.join(__dirname, "data", "feature.json"), JSON.stringify(valores))

console.log(`amostras .............. ${valores.length}`)
console.log(`média ................. ${m.toFixed(2)}x  (alvo ${ALVO.toFixed(2)}x)`)
console.log(`desvio da feature ..... ${desvio.toFixed(2)}x`)
console.log(`p50 / p90 / p99 ....... ${pct(0.5).toFixed(1)}x / ${pct(0.9).toFixed(1)}x / ${pct(0.99).toFixed(1)}x`)
console.log(`>=100x ................ 1 em ${Math.round(valores.length / Math.max(1, conta(100)))}`)
console.log(`>=500x ................ 1 em ${Math.round(valores.length / Math.max(1, conta(500)))}`)
console.log(`>=2645x (alcanca o cap) 1 em ${Math.round(valores.length / Math.max(1, conta(2645)))}`)

if (Math.abs(m - ALVO) / ALVO > 0.02) {
   console.warn(`AVISO: média ficou ${m.toFixed(2)}x contra alvo ${ALVO.toFixed(2)}x.`)
}