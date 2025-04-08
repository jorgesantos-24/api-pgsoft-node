// Insere a sincronizacao do saldo do operador (TUGAS/Firestore) em cada controller de jogo.
// Corrige src/ e dist/ de uma vez. Idempotente: pode correr varias vezes.
// Uso: node scripts/patch-operator-balance.js
const fs = require("fs");
const path = require("path");

const ROOTS = ["src/controllers", "dist/controllers"];
const SKIP = ["apicontroller", "sessioncontroller"];
const MARK = "checkuserbalance.data.user_balance != null";
const ANCHOR = /(\r?\n([ \t]*)if \(checkuserbalance\.data\.msg === "INVALID_USER"\))/;

let patched = 0, jaEstava = 0;
const semPonto = [];

for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  for (const dir of fs.readdirSync(root)) {
    const full = path.join(root, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const file of fs.readdirSync(full)) {
      if (!/\.(ts|js)$/.test(file)) continue;
      if (SKIP.some((k) => file.startsWith(k))) continue;
      const p = path.join(full, file);
      let s = fs.readFileSync(p, "utf8");
      if (!s.includes("checkuserbalance")) continue;
      if (s.includes(MARK)) { jaEstava++; continue; }
      if (!ANCHOR.test(s)) { semPonto.push(p); continue; }
      s = s.replace(ANCHOR, (m, g1, indent) =>
        `\n${indent}// saldo do operador (TUGAS) e a unica fonte de verdade` +
        `\n${indent}if (checkuserbalance.data.user_balance != null) saldoatual = Number(checkuserbalance.data.user_balance)` + g1
      );
      fs.writeFileSync(p, s);
      patched++;
      console.log("+ " + p);
    }
  }
}

console.log(`\nAtualizados: ${patched}  |  ja estavam: ${jaEstava}`);
if (semPonto.length) {
  console.log("\nSem o ponto de insercao esperado (ver a mao):");
  semPonto.forEach((m) => console.log("  " + m));
}