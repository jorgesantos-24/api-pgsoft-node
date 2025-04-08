// Segunda passagem: apanha os controllers onde a validacao da resposta
// esta escrita como condicao unica (INVALID_USER || INSUFFICIENT_USER_FUNDS).
// Se nao encontrar o if, insere logo apos a chamada axios. Idempotente.
// Uso: node scripts/patch-operator-balance-2.js
const fs = require("fs");
const path = require("path");

const ROOTS = ["src/controllers", "dist/controllers"];
const SKIP = ["apicontroller", "sessioncontroller"];
const MARK = "checkuserbalance.data.user_balance != null";

// 1) ponto de insercao preferido: antes do if que valida a resposta
const ANCHOR = /\r?\n([ \t]*)if \(checkuserbalance\.data\.msg[^\n]*INVALID_USER/;

const linha = (indent) =>
  `${indent}// saldo do operador (TUGAS) e a unica fonte de verdade\n` +
  `${indent}if (checkuserbalance.data.user_balance != null) saldoatual = Number(checkuserbalance.data.user_balance)`;

function patch(s) {
  // 1) antes do if de validacao
  if (ANCHOR.test(s)) {
    return { s: s.replace(ANCHOR, (m, indent) => linha(indent) + m), how: "if" };
  }
  // 2) recurso: logo depois de a chamada axios fechar
  const start = s.indexOf("const checkuserbalance = await axios(");
  if (start >= 0) {
    const resto = s.slice(start);
    const m = resto.match(/\r?\n([ \t]*)\}\)/);
    if (m) {
      const at = start + m.index + m[0].length;
      return { s: s.slice(0, at) + "\n" + linha(m[1]) + s.slice(at), how: "axios" };
    }
  }
  return null;
}

let ok = 0, jaEstava = 0;
const falhou = [];

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
      if (!s.includes("checkuserbalance") || !s.includes("saldoatual")) continue;
      if (s.includes(MARK)) { jaEstava++; continue; }
      const r = patch(s);
      if (!r) { falhou.push(p); continue; }
      fs.writeFileSync(p, r.s);
      ok++;
      console.log(`+ [${r.how}] ${p}`);
    }
  }
}

console.log(`\nAtualizados: ${ok}  |  ja estavam: ${jaEstava}`);
if (falhou.length) {
  console.log("\nAinda sem ponto de insercao:");
  falhou.forEach((m) => console.log("  " + m));
}