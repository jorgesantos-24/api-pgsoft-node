// Valida o endpoint e mede o RTP. Uso:
//   node tools/teste-carga.js http://localhost:3000 TOKEN 2000 normal
const [, , BASE, TOKEN, QTD, PERFIL] = process.argv
const N = Number(QTD || 1000)
const CS = 0.02
const ML = 1
const BET = 0.1
const LINHAS = [
   [1, 4, 7], [0, 3, 6], [2, 5, 8], [0, 4, 8], [2, 4, 6],
   [1, 3, 7], [1, 5, 7], [0, 5, 6], [2, 3, 8],
]
const chaveLinha = (p) => [...p].sort((a, b) => a - b).join(",")
const VALIDAS = new Set(LINHAS.map(chaveLinha))

async function umGiro() {
 const r = await fetch(`${BASE}/game-api/fortune-tiger/v2/Spin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ atk: TOKEN, cs: CS, ml: ML }),
   })
   if (!r.ok) throw new Error(`HTTP ${r.status}`)
   return (await r.json()).dt.si
}

async function main() {
   const falhas = []
   let total = 0
   let pago = 0
   let ganhos = 0
   let features = 0
   let maior = 0
   let saldoAntes = null

   for (let i = 1; i <= N; i++) {
      let si
      try {
         si = await umGiro()
      } catch (e) {
         falhas.push(`giro ${i}: ${e.message}`)
         if (falhas.length > 20) break
         continue
      }

      if (!Array.isArray(si.orl) || si.orl.length !== 9) falhas.push(`giro ${i}: orl com ${si.orl?.length} símbolos`)
      if (si.orl?.some((s) => !"012345678".includes(s))) falhas.push(`giro ${i}: símbolo inválido em orl`)

      const delta = saldoAntes === null ? null : Number((saldoAntes - si.bl).toFixed(2))
      if (delta !== null && Math.abs(delta - (BET - si.tw)) > 0.011) {
         falhas.push(`giro ${i}: saldo variou ${delta}, esperado ${(BET - si.tw).toFixed(2)}`)
      }
      saldoAntes = Number(si.bl)

      if (si.tw === 0 && si.wc !== 31) falhas.push(`giro ${i}: sem prêmio com wc ${si.wc}`)
      if (si.tw > 0 && si.wc !== 17) falhas.push(`giro ${i}: com prêmio e wc ${si.wc}`)

      for (const [sym, pos] of Object.entries(si.wp ?? {})) {
         if (sym === "8") continue
         if (pos.length % 3 !== 0) falhas.push(`giro ${i}: ${pos.length} posições para o símbolo ${sym}`)
         for (let k = 0; k < pos.length; k += 3) {
            if (!VALIDAS.has(chaveLinha(pos.slice(k, k + 3)))) {
               falhas.push(`giro ${i}: posições fora das linhas: ${pos.slice(k, k + 3)}`)
            }
         }
         for (const p of pos) {
            if (si.orl[p] !== sym && si.orl[p] !== "0") falhas.push(`giro ${i}: posição ${p} é "${si.orl[p]}", não ${sym}`)
         }
      }

      if (si.st === 4) features++
      total += si.tw / BET
      pago += si.tw
      if (si.tw > 0) ganhos++
      if (si.tw / BET > maior) maior = si.tw / BET

      if (i % 500 === 0) process.stdout.write(`  ${i} giros... rtp parcial ${((pago / (i * BET)) * 100).toFixed(1)}%\n`)
   }

   const giros = N - falhas.length
   console.log(`\nperfil ............ ${PERFIL || "?"}`)
   console.log(`giros válidos ..... ${giros}/${N}`)
   console.log(`RTP ............... ${giros ? ((pago / (giros * BET)) * 100).toFixed(2) : "0"}%`)
   console.log(`hit frequency ..... ${giros ? ((ganhos / giros) * 100).toFixed(2) : "0"}%`)
   console.log(`features .......... ${features}`)
   console.log(`maior prêmio ...... ${maior.toFixed(0)}x`)
   console.log(`falhas ............ ${falhas.length}`)
   falhas.slice(0, 20).forEach((f) => console.log(`  - ${f}`))
   if (falhas.length) process.exitCode = 1
}

main()