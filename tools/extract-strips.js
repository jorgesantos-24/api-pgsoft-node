// Extrai tiras de ganho, perda e feature para JSON.
// Uso: node tools/extract-strips.js
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..", "src", "jsons", "fortune-tiger")
const OUT = path.join(__dirname, "data")

function loadFn(file) {
   let src = fs.readFileSync(path.join(ROOT, file), "utf8")
   // remove anotações de tipo e troca o export
   src = src.replace(/:\s*(number|string|any|boolean)\b/g, "")
   src = src.replace("export default", "module.exports =")
   const mod = { exports: {} }
   new Function("module", "exports", "require", src)(mod, mod.exports, require)
   return mod.exports
}

const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0)

async function capture(fn, total) {
   const orig = Math.random
   const out = []
   for (let i = 1; i <= total; i++) {
      Math.random = () => (i - 0.5) / total
      out.push(await fn())
   }
   Math.random = orig
   return out
}

async function main() {
   fs.mkdirSync(OUT, { recursive: true })

   const win = loadFn("linhaganhotiger.ts")
   const winStrips = await capture(() => win.linhaganho(5), 482)
   const winData = winStrips.map((s) => ({ mult: sum(s.rwsp), wp: s.wp }))

   const loss = loadFn("linhaperdatiger.ts")
   const lossStrips = await capture(() => loss.linhaperda(), 200)

   const bonus = loadFn("linhabonustiger.ts")
   const features = []
   for (let i = 1; i <= 12; i++) {
      const seq = await bonus.linhacarta(i)
      const steps = Object.keys(seq).length - 1
      features.push({ steps, mult: sum(seq[0].rwsp), completed: seq[0].completed === true })
   }

   fs.writeFileSync(path.join(OUT, "win.json"), JSON.stringify(winData))
   fs.writeFileSync(path.join(OUT, "loss.json"), JSON.stringify({ count: lossStrips.length }))
   fs.writeFileSync(path.join(OUT, "feature.json"), JSON.stringify(features))

   console.log(`tiras de ganho: ${winData.length}`)
   console.log(`tiras de perda: ${lossStrips.length}`)
   console.log(`features: ${features.length}`)
   console.log(`mult. media por tira de ganho: ${(winData.reduce((a, b) => a + b.mult, 0) / winData.length).toFixed(2)}`)
}

main().catch((e) => { console.error(e); process.exit(1) })