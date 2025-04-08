// Clona o spins_inicial do fortune-tiger para todos os outros jogos.
// O getjsonprimary() faz SELECT json FROM spins_inicial WHERE game_code=?
// — sem linha por jogo, o jogo fica preso no splash.
// Uso: node scripts/seed-spins-inicial.js
require("dotenv/config");
const mysql = require("mysql2/promise");

const JOGOS = [
  "fortune-ox","fortune-dragon","fortune-rabbit","fortune-mouse","bikini-paradise",
  "jungle-delight","ganesha-gold","double-fortune","dragon-tiger-luck","ninja-raccoon",
  "lucky-clover","ultimate-striker","prosper-ftree","chicky-run","butterfly-blossom",
  "piggy-gold","wild-bandito","zombie-outbreak","majestic-ts","thai-river",
  "gdn-ice-fire","rise-apollo","wild-bounty-sd","treasures-aztec","three-cz-pigs",
];

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // 1) confirma que a tabela existe
  const [t] = await conn.query(
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'spins_inicial'"
  );
  if (!t[0].n) { console.log("Tabela spins_inicial nao existe. Corre o schema primeiro."); process.exit(1); }

  // 2) le a jogada inicial do fortune-tiger (a unica que ja existe)
  const [base] = await conn.query("SELECT json FROM spins_inicial WHERE game_code = 'fortune-tiger' LIMIT 1");
  if (!base.length) { console.log("Nao ha spins_inicial para fortune-tiger. Corre o seed primeiro."); process.exit(1); }

  const json = base[0].json;
  try { JSON.parse(json); } catch { console.log("O json do fortune-tiger nao e JSON valido. Abortado."); process.exit(1); }
  console.log(`Modelo: ${json.length} bytes\n`);

  let novos = 0;
  for (const g of JOGOS) {
    const [ex] = await conn.query("SELECT json FROM spins_inicial WHERE game_code = ? LIMIT 1", [g]);
    if (ex.length) { console.log(`= ${g} (ja existe)`); continue; }
    await conn.query("INSERT INTO spins_inicial (game_code, json) VALUES (?, ?)", [g, json]);
    novos++;
    console.log(`+ ${g}`);
  }

  const [tot] = await conn.query("SELECT COUNT(*) AS n FROM spins_inicial");
  console.log(`\nNovos: ${novos}  |  total na tabela: ${tot[0].n}`);
  await conn.end();
})();