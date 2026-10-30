// Roda SQL no banco configurado em src/.env.
// Uso: node tools/db.js "SELECT 1"
require("dotenv").config({ path: "src/.env" })
const mysql = require("mysql2/promise")

const sql = process.argv.slice(2).join(" ")
if (!sql) {
   console.log('uso: node tools/db.js "SELECT id, atk FROM users LIMIT 3"')
   process.exit(1)
}

;(async () => {
   const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
   })
   const [rows] = await conn.query(sql)
   console.log(JSON.stringify(rows, null, 2))
   await conn.end()
})().catch((e) => {
   console.log("ERRO", e.code, e.message)
   process.exit(1)
})