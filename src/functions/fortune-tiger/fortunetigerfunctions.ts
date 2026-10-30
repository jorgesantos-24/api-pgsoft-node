import promisePool from "../../database"
import { RowDataPacket, ResultSetHeader } from "mysql2"

export default {
   async getuserbytoken(token: string) {
      const res = await promisePool.query<RowDataPacket[]>(`SELECT * FROM users WHERE token= ?`, [token])
      return res[0]
   },
   async getuserbyatk(atk: string) {
      const res = await promisePool.query<RowDataPacket[]>(`SELECT * FROM users WHERE atk= ?`, [atk])
      return res[0]
   },
   async attsaldobyatk(atk: string, novosaldo: number) {
      const res = await promisePool.query<ResultSetHeader>(`UPDATE users SET saldo = ? WHERE atk= ?`, [
         novosaldo,
         atk,
      ])
      return res[0]
   },

   // Uma query em vez de seis: incrementa os acumulados sem ler antes.
   async registrarSpin(atk: string, novoSaldo: number, bet: number, ganho: number) {
      const res = await promisePool.query<ResultSetHeader>(
         `UPDATE users
             SET saldo = ?,
                 valorapostado = valorapostado + ?,
                 valordebitado = valordebitado + ?,
                 valorganho = valorganho + ?
           WHERE atk = ?`,
         [novoSaldo, bet, bet, ganho, atk],
      )
      return res[0]
   },

   async atualizarapostado(atk: string, bet: number) {
      const user = await this.getuserbyatk(atk)
      const novo = user[0].valorapostado + bet
      const res = await promisePool.query<ResultSetHeader>(`UPDATE users SET valorapostado = ? WHERE atk=?`, [
         novo,
         atk,
      ])
      return res[0]
   },
   async atualizardebitado(atk: string, bet: number) {
      const user = await this.getuserbyatk(atk)
      const novo = user[0].valordebitado + bet
      const res = await promisePool.query<ResultSetHeader>(`UPDATE users SET valordebitado = ? WHERE atk=?`, [
         novo,
         atk,
      ])
      return res[0]
   },
   async atualizarganho(atk: string, ganho: number) {
      const user = await this.getuserbyatk(atk)
      const novo = user[0].valorganho + ganho
      const res = await promisePool.query<ResultSetHeader>(`UPDATE users SET valorganho = ? WHERE atk=?`, [novo, atk])
      return res[0]
   },

   async getcall(id: number) {
      const res = await promisePool.query<RowDataPacket[]>("SELECT * FROM calls WHERE iduser = ?", [id])
      return res[0]
   },
   async completarcallid(id: number) {
      const res = await promisePool.query<ResultSetHeader>("UPDATE calls SET status = ? WHERE id = ?", [
         "completed",
         id,
      ])
      return res[0]
   },
   async savejsonspin(id: number, json: any) {
      const res = await promisePool.query<ResultSetHeader>("UPDATE fortunetigerplayerjson SET JSON = ? WHERE id = ?", [
         json,
         id,
      ])
      return res[0]
   },
   async getjsontiger(id: number) {
      const res = await promisePool.query<RowDataPacket[]>("SELECT * FROM fortunetigerplayerjson WHERE id=?", [id])
      return res[0]
   },
   async createjsontiger(id: number) {
      const res = await promisePool.query<ResultSetHeader>("INSERT INTO fortunetigerplayerjson (id) VALUES (?)", [id])
      return res[0]
   },
}