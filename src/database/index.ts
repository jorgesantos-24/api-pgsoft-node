import mysql, { PoolOptions } from "mysql2"
import logger from "../logger"
import "dotenv/config"

const host = (process.env.DB_HOST ?? "").trim()
// Cloud SQL liga por socket Unix em /cloudsql/PROJETO:REGIAO:INSTANCIA.
const useSocket = host.startsWith("/")

const access: PoolOptions = useSocket
   ? {
        socketPath: host,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        decimalNumbers: true,
     }
   : {
        host,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        decimalNumbers: true,
     }

const pool = mysql.createPool({
   ...access,
   waitForConnections: true,
   connectionLimit: 20,
   queueLimit: 0,
})
const promisePool = pool.promise()

async function testConnection() {
   try {
      const connection = await pool.promise().getConnection()
      connection.release()
      logger.info("CONEXÃO REALIZADA COM SUCESSO!")
   } catch (err) {
      logger.error(`MySQL error: ${err}`)
   }
}

testConnection()

export default promisePool