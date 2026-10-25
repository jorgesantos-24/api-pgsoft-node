import promisePool from "../../database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export default {
  async getuserbytoken(token: string) {
    const res = await promisePool.query<RowDataPacket[]>(`SELECT * FROM users WHERE token= ?`, [token]);
    return res[0];
  },

  async getuserbyatk(atk: string) {
    const res = await promisePool.query<RowDataPacket[]>(`SELECT * FROM users WHERE atk= ?`, [atk]);
    return res[0];
  },

  async attsaldobyatk(atk: string, novosaldo: number) {
    const res = await promisePool.query<ResultSetHeader>(`UPDATE users SET saldo = '${novosaldo}' WHERE atk= '${atk}'`);
    return res[0];
  },

  async atualizarapostado(atk: string, bet: number) {
    const user = await this.getuserbyatk(atk);
    const apostado = user[0].valorapostado;
    const novoapostado = apostado + bet;

    const res = await promisePool.query<ResultSetHeader>(`UPDATE users SET valorapostado = '${novoapostado}' WHERE atk='${atk}'`);
    return res[0];
  },

  async atualizardebitado(atk: string, bet: number) {
    const user = await this.getuserbyatk(atk);
    const valordebitado = user[0].valordebitado;
    const novordebitado = valordebitado + bet;

    const res = await promisePool.query<ResultSetHeader>(`UPDATE users SET valordebitado = '${novordebitado}' WHERE atk='${atk}'`);
    return res[0];
  },

  async atualizarganho(atk: string, ganho: number) {
    const user = await this.getuserbyatk(atk);
    const valorganho = user[0].valorganho;
    const novodeganho = valorganho + ganho;

    const res = await promisePool.query<ResultSetHeader>(`UPDATE users SET valorganho = '${novodeganho}' WHERE atk='${atk}'`);
    return res[0];
  },

  async getcall(id: number) {
    const res = await promisePool.query<RowDataPacket[]>("SELECT * FROM calls WHERE iduser = ?", [id]);
    return res[0];
  },

  async completarcallid(id: number) {
    const newstatus = "completed";
    const res = await promisePool.query<ResultSetHeader>("UPDATE calls SET status = ? WHERE id = ?", [newstatus, id]);
    return res[0];
  },

  async savejsonspin(id: number, json: any) {
    const res = await promisePool.query<ResultSetHeader>("UPDATE zombieoutbreakjson SET JSON = ? WHERE id = ?", [json, id]);
    return res[0];
  },

  async getjsonzombie(id: number) {
    const res = await promisePool.query<RowDataPacket[]>("SELECT * FROM zombieoutbreakjson WHERE id=?", [id]);
    return res[0];
  },

  async createjsonzombie(id: number) {
    const res = await promisePool.query<ResultSetHeader>("INSERT INTO zombieoutbreakjson (id) VALUES (?)", [id]);
    return res[0];
  },

  async getcallbyid(id: number) {
    const res = await promisePool.query<RowDataPacket[]>("SELECT * FROM calls WHERE id = ?", [id]);
    return res[0];
  },

  async attawcall(id: number, valor: number) {
    const call = await this.getcallbyid(id);
    const aw = call[0].aw;
    const newaw = aw + valor;

    const res = await promisePool.query<ResultSetHeader>(`UPDATE calls SET aw = '${newaw}' WHERE id='${id}'`);
    return res[0];
  },

  async atualizarLinhaGanho(userId: any, gamecode: string, linhaGanho: number | null) {
     const res = await promisePool.query<ResultSetHeader>(
        "INSERT INTO linhasganho (iduser, gamecode, linha) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE linha = VALUES(linha)",
        [userId, gamecode, linhaGanho ?? 0],
     );
     return res[0];
  },

  async obterLinhaGanho(userId: number, gamecode: string) {
     const res = await promisePool.query<RowDataPacket[]>(
        "SELECT linha FROM linhasganho WHERE iduser = ? AND gamecode = ?",
        [userId, gamecode],
     );
     return res[0] && res[0][0] ? (res[0][0].linha || null) : null;
  },
};
