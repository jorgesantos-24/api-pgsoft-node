import mysql, { PoolOptions } from 'mysql2';
import logger from '../logger';
import 'dotenv/config';

const access: PoolOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    // Return DECIMAL columns (saldo, valorganho...) as numbers, not strings.
    // Otherwise "98.80" + 0.4 concatenates to "98.800.4" in the game math.
    decimalNumbers: true,
};

const pool = mysql.createPool(access);
const promisePool = pool.promise();

// Testa a conexão ao iniciar
async function testConnection() {
    try {
        const connection = await pool.promise().getConnection();
        connection.release();
        logger.info('CONEXÃO REALIZADA COM SUCESSO!');
    } catch (err) {
        logger.error(`MySQL error: ${err}`);
    }
}

testConnection();

export default promisePool;