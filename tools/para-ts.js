// Converte os dados calibrados em módulos .ts dentro de src/jsons.
// Uso: node tools/para-ts.js
const fs = require("fs")
const path = require("path")

const RAIZ = path.join(__dirname, "..")
const DADOS = path.join(__dirname, "data")
const DESTINO = path.join(RAIZ, "src", "jsons", "fortune-tiger")

const strips = JSON.parse(fs.readFileSync(path.join(DADOS, "strips.json"), "utf8"))
const feature = JSON.parse(fs.readFileSync(path.join(DADOS, "feature.json"), "utf8"))
const config = JSON.parse(fs.readFileSync(path.join(DADOS, "feature-config.json"), "utf8"))
const paytable = JSON.parse(fs.readFileSync(path.join(__dirname, "paytable.json"), "utf8"))

if (!Number.isFinite(config.payScale) || config.payScale <= 0) {
   throw new Error(`payScale inválido em feature-config.json: ${config.payScale}`)
}
if (strips.length !== 3) throw new Error(`strips.json precisa ter 3 rolos, veio ${strips.length}`)
if (feature.length === 0) throw new Error("feature.json vazio")

paytable.payScale = config.payScale
paytable.scatterTrigger = config.scatterTrigger
paytable.featureSpins = config.spins

fs.mkdirSync(DESTINO, { recursive: true })

fs.writeFileSync(path.join(DESTINO, "strips.ts"), `export default ${JSON.stringify(strips)} as string[][]\n`)
fs.writeFileSync(path.join(DESTINO, "feature.ts"), `export default ${JSON.stringify(feature)} as number[]\n`)
fs.writeFileSync(path.join(DESTINO, "paytable.ts"), `export default ${JSON.stringify(paytable, null, 3)} as const\n`)

console.log(`strips.ts  ..... 3 rolos, ${strips[0].length} posições`)
console.log(`feature.ts ..... ${feature.length} valores`)
console.log(`paytable.ts .... ${paytable.lines.length} linhas, payScale ${paytable.payScale}`)
console.log("Pronto. Agora corrija os imports no controller.")