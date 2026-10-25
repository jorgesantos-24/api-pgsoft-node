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
const database_1 = __importDefault(require("../database"));
const logger_1 = __importDefault(require("../logger"));
// Função para formatar a probabilidade como um número inteiro com até três dígitos
function formatarProbabilidade(valor) {
    const valorInteiro = Math.round(valor * 100); // Converte para um valor inteiro entre 0 e 100
    console.log("VALOR: " + valorInteiro);
    return valorInteiro.toString().padStart(3, "0");
}
const JOGOS_SEM_BONUS = ["piggy-gold", "lucky-clover", "ninja-raccoon", "rise-apollo", "ultimate-striker", "wild-bounty-sd"];
exports.default = {
    createOrUpdateSpin(playerId, gamecode, gameData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Primeiro, verificamos se o jogador já possui um registro
            const [rows] = yield database_1.default.query("SELECT id FROM spins WHERE user_id = ?", [playerId]);
            // Verifique se a consulta retornou algum resultado
            if (rows.length > 0) {
                // Se o registro existir, atualizamos o JSON existente
                const res = yield database_1.default.query("UPDATE spins SET json = ?, game_code = ? WHERE user_id = ?", [gameData, gamecode, playerId]);
                return res[0];
            }
            else {
                // Caso contrário, criamos um novo registro
                const res = yield database_1.default.query("INSERT INTO spins (user_id, game_code, json) VALUES (?, ?, ?)", [playerId, gamecode, gameData]);
                return res[0];
            }
        });
    },
    getSpinByPlayerId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield database_1.default.query("SELECT * FROM spins WHERE user_id=?", [id]);
            return res[0];
        });
    },
    getjsonprimary(game_code) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield database_1.default.query("SELECT json FROM spins_inicial WHERE game_code=?", [game_code]);
            return res[0];
        });
    },
    savejsonspin(id, json, gamecode) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield database_1.default.query("UPDATE spins SET json = ?, game_code = ? WHERE user_id = ?", [json, gamecode, id]);
            return res[0];
        });
    },
    getuserbytoken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield database_1.default.query("SELECT * FROM users WHERE token = ?", [token]);
            return rows;
        });
    },
    getuserbyid(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield database_1.default.query("SELECT * FROM users WHERE id = ?", [id]);
            return rows;
        });
    },
    getuserbyatk(atk) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield database_1.default.query("SELECT * FROM users WHERE atk = ?", [atk]);
            return rows;
        });
    },
    getcall(id, game_code) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield database_1.default.query("SELECT * FROM calls WHERE iduser = ? AND status = 'pending' AND gamecode = ?", [id, game_code]);
            return rows;
        });
    },
    getagentbyid(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield database_1.default.query("SELECT * FROM agents WHERE id = ?", [id]);
            return rows;
        });
    },
    getcallbyid(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield database_1.default.query("SELECT * FROM calls WHERE id = ?", [id]);
            return rows;
        });
    },
    updatertp(token, rtp) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield database_1.default.query("UPDATE users SET rtp = ? WHERE token = ?", [rtp, token]);
            return result;
        });
    },
    addcall(gamecode, iduser, json) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield database_1.default.query("INSERT INTO calls (iduser, gamecode, jsonname, bycall) VALUES (?, ?, ?, 'system')", [iduser, gamecode, json]);
            return result;
        });
    },
    updatestepscall(idcall, steps) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield database_1.default.query("UPDATE calls SET steps = ? WHERE id = ?", [steps, idcall]);
            return result;
        });
    },
    subtrairstepscall(idcall) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield database_1.default.query("SELECT steps FROM calls WHERE id = ?", [idcall]);
            if (rows.length === 0) {
                throw new Error("Chamada não encontrada.");
            }
            const steps = rows[0].steps;
            const newsteps = steps - 1;
            const [result] = yield database_1.default.query("UPDATE calls SET steps = ? WHERE id = ?", [newsteps, idcall]);
            return result;
        });
    },
    completecall(idcall) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield database_1.default.query("UPDATE calls SET status = 'completed' WHERE id = ?", [idcall]);
            return result;
        });
    },
    adicionarZeroAntes(numero) {
        return __awaiter(this, void 0, void 0, function* () {
            return Number(numero) / 100;
        });
    },
    determinarResultado(probabilidadeGanho, probabilidadebonus, id, gamecode) {
        return __awaiter(this, void 0, void 0, function* () {
            const resultadoAleatorio = Math.random();
            const callpending = yield this.getcall(id, gamecode);
            let numeroAleatorio = 0;
            // These games have no bonus handler: a "bonus" result would never get a
            // response and the game would spin forever. Close any stuck call instead.
            const semBonus = JOGOS_SEM_BONUS.includes(gamecode);
            if (semBonus) {
                for (const call of callpending)
                    yield this.completecall(call.id);
            }
            else if (callpending.length > 0 && callpending[0].status === "pending" && callpending[0].gamecode === `${gamecode}`) {
                return {
                    result: "bonus",
                    gamecode: gamecode,
                    json: callpending[0].jsonname,
                    idcall: callpending[0].id,
                };
            }
            if (resultadoAleatorio < probabilidadeGanho) {
                if (resultadoAleatorio < probabilidadebonus && !semBonus) {
                    const user = yield this.getuserbyid(id);
                    if (user[0].isinfluencer === 1) {
                        numeroAleatorio = Math.floor(Math.random() * 6) + 1;
                        yield this.addcall(gamecode, id, numeroAleatorio);
                    }
                    else {
                        numeroAleatorio = Math.floor(Math.random() * (12 - 7 + 1)) + 7;
                        yield this.addcall(gamecode, id, numeroAleatorio);
                    }
                    return { result: "ganho" };
                }
                else {
                    return { result: "ganho" };
                }
            }
            else {
                return { result: "perda" };
            }
        });
    },
    calcularganho(valorAposta, saldoatual, token, gamecode) {
        return __awaiter(this, void 0, void 0, function* () {
            var user = yield this.getuserbyatk(token);
            var agent = yield this.getagentbyid(user[0].agentid);
            let probabilidadeGanho = yield this.adicionarZeroAntes(agent[0].probganho);
            let probabilidadebonus = yield this.adicionarZeroAntes(agent[0].probbonus);
            if (user[0].rtp >= 0 && user[0].rtp <= 30 && user[0].isinfluencer === 0) {
                probabilidadeGanho = yield this.adicionarZeroAntes(agent[0].probganhortp);
            }
            if (saldoatual >= 100) {
                probabilidadeGanho = yield this.adicionarZeroAntes(agent[0].probganhosaldo);
            }
            if (valorAposta >= 2) {
                probabilidadeGanho = yield this.adicionarZeroAntes(agent[0].probganhoaposta);
            }
            if (user[0].isinfluencer === 1) {
                probabilidadeGanho = yield this.adicionarZeroAntes(agent[0].probganhoinfluencer);
                probabilidadebonus = yield this.adicionarZeroAntes(agent[0].probbonusinfluencer);
            }
            console.log("PROBABILIDADE DE GANHO ATUAL " + probabilidadeGanho);
            console.log("PROBABILIDADE DE BONUS ATUAL " + probabilidadebonus);
            const resultado = this.determinarResultado(probabilidadeGanho, probabilidadebonus, user[0].id, gamecode);
            return resultado;
        });
    },
    calcularProbabilidadeComBaseNoRTP(rtp, probabilidadeBase) {
        const rtpMin = 0;
        const rtpMax = 80;
        const probMin = 0;
        const probMax = 1;
        const rtpNormalized = Math.max(rtpMin, Math.min(rtp, rtpMax));
        const rtpFactor = (rtpNormalized - rtpMin) / (rtpMax - rtpMin);
        const probabilidadeAjustada = probabilidadeBase * (1 + rtpFactor);
        logger_1.default.info("Calculo de probabilidade final:" + probabilidadeAjustada);
        logger_1.default.info("Rtp Factor:" + rtpFactor);
        return Math.max(probMin, Math.min(probabilidadeAjustada, probMax));
    },
};
