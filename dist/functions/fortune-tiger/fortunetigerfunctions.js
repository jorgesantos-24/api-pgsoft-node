"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../../database"));
exports.default = {
    getuserbytoken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield database_1.default.query(`SELECT * FROM users WHERE token= ?`, [token]);
            return res[0];
        });
    },
    getuserbyatk(atk) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield database_1.default.query(`SELECT * FROM users WHERE atk= ?`, [atk]);
            return res[0];
        });
    },
    attsaldobyatk(atk, novosaldo) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield database_1.default.query(`UPDATE users SET saldo = ? WHERE atk= ?`, [
                novosaldo,
                atk,
            ]);
            return res[0];
        });
    },
    // Uma query em vez de seis: incrementa os acumulados sem ler antes.
    registrarSpin(atk, novoSaldo, bet, ganho) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield database_1.default.query(`UPDATE users
             SET saldo = ?,
                 valorapostado = valorapostado + ?,
                 valordebitado = valordebitado + ?,
                 valorganho = valorganho + ?
           WHERE atk = ?`, [novoSaldo, bet, bet, ganho, atk]);
            return res[0];
        });
    },
    atualizarapostado(atk, bet) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getuserbyatk(atk);
            const novo = user[0].valorapostado + bet;
            const res = yield database_1.default.query(`UPDATE users SET valorapostado = ? WHERE atk=?`, [
                novo,
                atk,
            ]);
            return res[0];
        });
    },
    atualizardebitado(atk, bet) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getuserbyatk(atk);
            const novo = user[0].valordebitado + bet;
            const res = yield database_1.default.query(`UPDATE users SET valordebitado = ? WHERE atk=?`, [
                novo,
                atk,
            ]);
            return res[0];
        });
    },
    atualizarganho(atk, ganho) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getuserbyatk(atk);
            const novo = user[0].valorganho + ganho;
            const res = yield database_1.default.query(`UPDATE users SET valorganho = ? WHERE atk=?`, [novo, atk]);
            return res[0];
        });
    },
    getcall(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield database_1.default.query("SELECT * FROM calls WHERE iduser = ?", [id]);
            return res[0];
        });
    },
    completarcallid(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield database_1.default.query("UPDATE calls SET status = ? WHERE id = ?", [
                "completed",
                id,
            ]);
            return res[0];
        });
    },
    savejsonspin(id, json) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield database_1.default.query("UPDATE fortunetigerplayerjson SET JSON = ? WHERE id = ?", [
                json,
                id,
            ]);
            return res[0];
        });
    },
    getjsontiger(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield database_1.default.query("SELECT * FROM fortunetigerplayerjson WHERE id=?", [id]);
            return res[0];
        });
    },
    createjsontiger(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield database_1.default.query("INSERT INTO fortunetigerplayerjson (id) VALUES (?)", [id]);
            return res[0];
        });
    },
};
