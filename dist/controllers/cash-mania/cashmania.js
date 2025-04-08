"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../../logger"));
const crypto = __importStar(require("crypto"));
const uuid_1 = require("uuid");
const moment_1 = __importDefault(require("moment"));
const allfunctions_1 = __importDefault(require("../../functions/allfunctions"));
const apicontroller_1 = __importDefault(require("../apicontroller"));
const serverEvents_1 = require("../../serverEvents");
require("dotenv/config");
const cashmaniafunctions_1 = __importDefault(require("../../functions/cash-mania/cashmaniafunctions"));
const linhabonuscash_1 = __importDefault(require("../../jsons/cash-mania/linhabonuscash"));
const linhaganhocash_1 = __importDefault(require("../../jsons/cash-mania/linhaganhocash"));
const linhaperdacash_1 = __importDefault(require("../../jsons/cash-mania/linhaperdacash"));
const notcashcash_1 = __importDefault(require("../../jsons/cash-mania/notcashcash"));
exports.default = {
    getcash(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = req.body.atk;
                const gamename = "cash-mania";
                const user = yield allfunctions_1.default.getuserbyatk(token);
                logger_1.default.info('[+] Usuario logado: ' + user[0].username);
                const jsonprimay = yield allfunctions_1.default.getSpinByPlayerId(user[0].id);
                const jsoninicial = yield allfunctions_1.default.getjsonprimary(gamename);
                if (jsonprimay.length === 0) {
                    yield allfunctions_1.default.createOrUpdateSpin(user[0].id, gamename, jsoninicial[0].json);
                }
                else if (jsonprimay[0].game_code === gamename) {
                    logger_1.default.info('[+] Json Recuperado Do Ultimo Spin.');
                }
                else {
                    yield allfunctions_1.default.createOrUpdateSpin(user[0].id, gamename, jsoninicial[0].json);
                }
                const json = yield allfunctions_1.default.getSpinByPlayerId(user[0].id);
                const jsonformatado = JSON.parse(json[0].json);
                res.send({
                    dt: {
                        fb: {
                            is: true,
                            bm: 100,
                            t: 0.75
                        },
                        wt: {
                            mw: 5,
                            bw: 20,
                            mgw: 35,
                            smgw: 50
                        },
                        maxwm: null,
                        cs: [0.02, 0.12, 0.8],
                        ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                        mxl: 25,
                        bl: user[0].saldo,
                        inwe: false,
                        iuwe: false,
                        ls: jsonformatado.dt,
                        cc: "BRL"
                    },
                    err: null,
                });
            }
            catch (error) {
                logger_1.default.error(error);
            }
        });
    },
    spin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            let cs = req.body.cs;
            let ml = req.body.ml;
            const token = req.body.atk;
            function lwchange(json1, json2, cs, ml) {
                return __awaiter(this, void 0, void 0, function* () {
                    for (let chave in json1) {
                        if (json1.hasOwnProperty(chave)) {
                            const valor = json1[chave];
                            const ganho = cs * ml * parseFloat(valor);
                            // Verifica se a chave existe no segundo JSON
                            for (let chave2 in json2) {
                                if (json2.hasOwnProperty(chave2)) {
                                    // Altera o valor correspondente no segundo JSON
                                    json2[chave] = ganho;
                                }
                            }
                        }
                    }
                });
            }
            function rvchange(json1, json2, cs, ml) {
                return __awaiter(this, void 0, void 0, function* () {
                    for (let chave in json1) {
                        if (json1.hasOwnProperty(chave)) {
                            const valor = json1[chave];
                            let ganho = 0;
                            // Calcula o ganho com base no valor e condições específicas
                            if (valor === 1) {
                                ganho = cs * ml * 25 * 0.1;
                            }
                            else if (valor === 2) {
                                ganho = cs * ml * 25 * 0.5;
                            }
                            else if (valor === 3) {
                                ganho = cs * ml * 25 * 1;
                            }
                            else if (valor === 4) {
                                ganho = cs * ml * 25 * 5;
                            }
                            else if (valor === 5) {
                                ganho = cs * ml * 25 * 10;
                            }
                            // Aplica o ganho calculado no segundo JSON se a chave existir
                            if (json2 && json2.hasOwnProperty(chave)) {
                                json2[chave] = ganho;
                            }
                            else {
                                console.error(`Chave ${chave} não encontrada em json2 ou json2 é undefined`);
                            }
                            console.log(`Chave: ${chave}, Valor: ${valor}, Ganho: ${ganho}`);
                        }
                    }
                });
            }
            function countrwsp(json) {
                return __awaiter(this, void 0, void 0, function* () {
                    let multplicador = 0;
                    for (let i = 1; i <= 10; i++) {
                        const chave = i.toString();
                        if (json.hasOwnProperty(chave)) {
                            multplicador = multplicador + parseFloat(json[chave]);
                            logger_1.default.info('Multiplicador Countrwsp: ' + multplicador);
                        }
                    }
                    return multplicador;
                });
            }
            function returnrwm(json) {
                return __awaiter(this, void 0, void 0, function* () {
                    let value = 0;
                    for (let chave in json) {
                        if (json.hasOwnProperty(chave)) {
                            value = value + parseFloat(json[chave]);
                        }
                    }
                    return value;
                });
            }
            function gerarNumeroUnico() {
                return __awaiter(this, void 0, void 0, function* () {
                    return crypto.randomBytes(8).toString("hex");
                });
            }
            try {
                const user = yield cashmaniafunctions_1.default.getuserbyatk(token);
                let bet = cs * ml * 25;
                let saldoatual = user[0].saldo;
                const gamename = "cash-mania";
                (0, serverEvents_1.emitirEventoInterno)("att", {
                    token: token,
                    username: user[0].username,
                    bet: bet,
                    saldo: saldoatual,
                    rtp: user[0].rtp,
                    agentid: user[0].agentid,
                    gamecode: gamename,
                });
                const agent = yield allfunctions_1.default.getagentbyid(user[0].agentid);
                const checkuserbalance = yield (0, axios_1.default)({
                    maxBodyLength: Infinity,
                    method: "POST",
                    url: `${agent[0].callbackurl}gold_api/user_balance`,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: {
                        user_code: user[0].username,
                    },
                });
                // saldo do operador (TUGAS) e a unica fonte de verdade
                if (checkuserbalance.data.user_balance != null) saldoatual = Number(checkuserbalance.data.user_balance)
                if (checkuserbalance.data.msg === "INVALID_USER") {
                    res.send(yield notcashcash_1.default.notcash(saldoatual, cs, ml));
                    return false;
                }
                else if (checkuserbalance.data.msg === "INSUFFICIENT_USER_FUNDS") {
                    res.send(yield notcashcash_1.default.notcash(saldoatual, cs, ml));
                    return false;
                }
                const retornado = user[0].valorganho;
                const valorapostado = user[0].valorapostado;
                const rtp = (retornado / valorapostado) * 100;
                console.log("RTP ATUAL " + rtp);
                console.log("BET ATUAL " + bet);
                if (saldoatual < bet) {
                    const semsaldo = yield notcashcash_1.default.notcash(saldoatual, cs, ml);
                    res.send(semsaldo);
                    return false;
                }
                const resultadospin = yield allfunctions_1.default.calcularganho(bet, saldoatual, token, gamename);
                if (resultadospin.result === "perda") {
                    let newbalance = saldoatual - bet;
                    yield cashmaniafunctions_1.default.attsaldobyatk(token, newbalance);
                    yield cashmaniafunctions_1.default.atualizardebitado(token, bet);
                    yield cashmaniafunctions_1.default.atualizarapostado(token, bet);
                    const perdajson = yield linhaperdacash_1.default.linhaperda();
                    let json = {
                        dt: {
                            si: {
                                wp: null,
                                lw: null,
                                twbm: 0,
                                fs: null,
                                imw: false,
                                rv: perdajson.rv,
                                orl: null,
                                orv: null,
                                rsrl: null,
                                rsrv: null,
                                nfp: null,
                                gwt: -1,
                                fb: null,
                                ctw: 0,
                                pmt: null,
                                cwc: 0,
                                fstc: null,
                                pcwc: 0,
                                rwsp: null,
                                hashr: "0:2;10;3#3;0;0#3;13;3#MV#6.0#MT#1#MG#0#",
                                ml: ml,
                                cs: cs,
                                rl: perdajson.rl,
                                sid: "1782506236190588416",
                                psid: "1782506236190588416",
                                st: 1,
                                nst: 1,
                                pf: 1,
                                aw: 0,
                                wid: 0,
                                wt: "C",
                                wk: "0_C",
                                wbn: null,
                                wfg: null,
                                blb: saldoatual,
                                blab: newbalance,
                                bl: newbalance,
                                tb: bet,
                                tbb: bet,
                                tw: 0,
                                np: -bet,
                                ocr: null,
                                mr: null,
                                ge: [1, 11]
                            },
                        },
                        err: null,
                    };
                    yield allfunctions_1.default.savejsonspin(user[0].id, JSON.stringify(json), gamename);
                    const txnid = (0, uuid_1.v4)();
                    const dataFormatada = (0, moment_1.default)().toISOString();
                    yield apicontroller_1.default.callbackgame({
                        agent_code: agent[0].agentcode,
                        agent_secret: agent[0].secretKey,
                        user_code: user[0].username,
                        user_balance: user[0].saldo,
                        user_total_credit: user[0].valorganho,
                        user_total_debit: user[0].valorapostado,
                        game_type: "slot",
                        slot: {
                            provider_code: "PGSOFT",
                            game_code: gamename,
                            round_id: yield gerarNumeroUnico(),
                            type: "BASE",
                            bet: bet,
                            win: 0,
                            txn_id: `${txnid}`,
                            txn_type: "debit_credit",
                            is_buy: false,
                            is_call: false,
                            user_before_balance: user[0].saldo,
                            user_after_balance: newbalance,
                            agent_before_balance: 100,
                            agent_after_balance: 100,
                            created_at: dataFormatada,
                        },
                    });
                    res.send(json);
                }
                if (resultadospin.result === "ganho") {
                    const ganhojson = yield linhaganhocash_1.default.linhaganho(bet);
                    const multplicador = yield countrwsp(ganhojson.rwsp);
                    logger_1.default.info(`cs: ${cs}, ml: ${ml}`);
                    logger_1.default.info(`ganhojson: ${JSON.stringify(ganhojson)}`);
                    logger_1.default.info(`Multiplicador: ${multplicador}`);
                    yield lwchange(ganhojson.rwsp, ganhojson.lw, cs, ml);
                    const valorganho = bet * multplicador;
                    logger_1.default.info(`Valor do ganho calculado: ${valorganho}`);
                    const newbalance = saldoatual + valorganho - bet;
                    yield cashmaniafunctions_1.default.attsaldobyatk(token, newbalance);
                    yield cashmaniafunctions_1.default.atualizardebitado(token, bet);
                    yield cashmaniafunctions_1.default.atualizarapostado(token, bet);
                    yield cashmaniafunctions_1.default.atualizarganho(token, valorganho);
                    function gerarBooleanoAleatorio() {
                        // Gera um número aleatório entre 0 e 1
                        const boolean = Math.floor(Math.random() * 10) + 1;
                        console.log("NUMERO DO BOOLEANO " + boolean);
                        // Se o número for maior ou igual a 0.5, retorna true, caso contrário, retorna false
                        return boolean >= 5;
                    }
                    let json = {
                        dt: {
                            si: {
                                wp: ganhojson.wp,
                                lw: ganhojson.lw,
                                twbm: ganhojson.rv[1],
                                fs: null,
                                imw: false,
                                rv: ganhojson.rv,
                                orl: null,
                                orv: null,
                                rsrl: ganhojson.rsrl,
                                rsrv: ganhojson.rsrv,
                                nfp: null,
                                gwt: -1,
                                fb: null,
                                ctw: valorganho,
                                pmt: null,
                                cwc: 1,
                                fstc: null,
                                pcwc: 1,
                                rwsp: ganhojson.rwsp,
                                hashr: "0:2;3;5#2;1;2#3;3;3#R#2#011121#MV#6.0#MT#1#MG#3.0#",
                                ml: ml,
                                cs: cs,
                                rl: ganhojson.rl,
                                sid: "1799514033860050432",
                                psid: "1799514033860050432",
                                st: 1,
                                nst: 1,
                                pf: 1,
                                aw: valorganho,
                                wid: 0,
                                wt: "C",
                                wk: "0_C",
                                wbn: null,
                                wfg: null,
                                blb: saldoatual,
                                blab: newbalance,
                                bl: newbalance,
                                tb: bet,
                                tbb: bet,
                                tw: valorganho,
                                np: bet,
                                ocr: null,
                                mr: null,
                                ge: [1, 11]
                            },
                        },
                        err: null,
                    };
                    yield allfunctions_1.default.savejsonspin(user[0].id, JSON.stringify(json), gamename);
                    const txnid = (0, uuid_1.v4)();
                    const dataFormatada = (0, moment_1.default)().toISOString();
                    yield apicontroller_1.default.callbackgame({
                        agent_code: agent[0].agentcode,
                        agent_secret: agent[0].secretKey,
                        user_code: user[0].username,
                        user_balance: user[0].saldo,
                        user_total_credit: user[0].valorganho,
                        user_total_debit: user[0].valorapostado,
                        game_type: "slot",
                        slot: {
                            provider_code: "PGSOFT",
                            game_code: gamename,
                            round_id: yield gerarNumeroUnico(),
                            type: "BASE",
                            bet: bet,
                            win: Number(valorganho),
                            txn_id: `${txnid}`,
                            txn_type: "debit_credit",
                            is_buy: false,
                            is_call: false,
                            user_before_balance: user[0].saldo,
                            user_after_balance: newbalance,
                            agent_before_balance: 100,
                            agent_after_balance: 100,
                            created_at: dataFormatada,
                        },
                    });
                    res.send(json);
                }
                if (resultadospin.result === "bonus" && resultadospin.gamecode === "cash-mania") {
                    const bonusjson = yield linhabonuscash_1.default.linhabonus(resultadospin.json);
                    let call = yield allfunctions_1.default.getcallbyid(resultadospin.idcall);
                    logger_1.default.info(`Dados da call obtida: ${JSON.stringify(call)}`);
                    if (call[0].steps === null && call[0].status === "pending") {
                        if (saldoatual < bet) {
                            const semsaldo = yield notcashcash_1.default.notcash(saldoatual, cs, ml);
                            res.send(semsaldo);
                            return false;
                        }
                    }
                    if (call[0].steps === null && call[0].status === "pending") {
                        const steps = Object.keys(bonusjson).length - 1;
                        yield allfunctions_1.default.updatestepscall(resultadospin.idcall, steps);
                        logger_1.default.info(`Steps atualizados para: ${steps}`);
                    }
                    let calltwo = yield allfunctions_1.default.getcallbyid(resultadospin.idcall);
                    logger_1.default.info(`Dados da calltwo obtida: ${JSON.stringify(calltwo)}`);
                    logger_1.default.info("Iniciando a primeira etapa do bônus");
                    if (calltwo[0].steps === 0) {
                        yield allfunctions_1.default.completecall(calltwo[0].id);
                    }
                    let multiplicador = 0;
                    if (bonusjson[calltwo[0].steps].rwsp != null) {
                        multiplicador = yield countrwsp(bonusjson[calltwo[0].steps].rwsp);
                    }
                    if (bonusjson[calltwo[0].steps].lw != null) {
                        yield lwchange(bonusjson[calltwo[0].steps].rwsp, bonusjson[calltwo[0].steps].lw, cs, ml);
                    }
                    let wmvalue = 0;
                    const txnid = (0, uuid_1.v4)();
                    const dataFormatada = (0, moment_1.default)().toISOString();
                    let valorganho = cs * ml * multiplicador;
                    // Verifica e aplica as mudanças de rv
                    if (bonusjson[calltwo[0].steps].rv != null) {
                        logger_1.default.info(`Valor de rv antes de rvchange: ${JSON.stringify(bonusjson[calltwo[0].steps].rv)}`);
                        yield rvchange(bonusjson[calltwo[0].steps].lw, bonusjson[calltwo[0].steps].rv, cs, ml);
                        logger_1.default.info(`Valor de rv depois de rvchange: ${JSON.stringify(bonusjson[calltwo[0].steps].rv)}`);
                    }
                    // Calcula o multiplicador de ganho
                    let multiplicadorGanho = 0;
                    if (Array.isArray(bonusjson[calltwo[0].steps].rv) && bonusjson[calltwo[0].steps].rv.length > 4) {
                        const rvValue = bonusjson[calltwo[0].steps].rv[4];
                        logger_1.default.info(`Valor de rv[4]: ${rvValue}`);
                        if (rvValue > 0) {
                            multiplicadorGanho = rvValue; // Usando diretamente o valor de rv[4] como multiplicador
                            logger_1.default.info(`Multiplicador de Ganho calculado: ${multiplicadorGanho}`);
                        }
                        else {
                            logger_1.default.info(`rv[4] não é positivo: ${rvValue}`);
                            multiplicadorGanho = 0;
                        }
                    }
                    else {
                        logger_1.default.info(`bonusjson.rv é indefinido, não é um array, ou não possui o índice 4.`);
                        multiplicadorGanho = 0;
                    }
                    valorganho *= multiplicadorGanho;
                    let newbalance = saldoatual - bet + valorganho;
                    yield cashmaniafunctions_1.default.attsaldobyatk(token, newbalance);
                    yield apicontroller_1.default.callbackgame({
                        agent_code: agent[0].agentcode,
                        agent_secret: agent[0].secretKey,
                        user_code: user[0].username,
                        user_balance: user[0].saldo,
                        user_total_credit: user[0].valorganho,
                        user_total_debit: user[0].valorapostado,
                        game_type: "slot",
                        slot: {
                            provider_code: "PGSOFT",
                            game_code: gamename,
                            round_id: yield gerarNumeroUnico(),
                            type: "BASE",
                            bet: bet,
                            win: valorganho,
                            txn_id: `${txnid}`,
                            txn_type: "debit_credit",
                            is_buy: false,
                            is_call: false,
                            user_before_balance: user[0].saldo,
                            user_after_balance: newbalance,
                            agent_before_balance: 100,
                            agent_after_balance: 100,
                            created_at: dataFormatada,
                        },
                    });
                    yield cashmaniafunctions_1.default.attawcall(calltwo[0].id, valorganho);
                    yield cashmaniafunctions_1.default.attsaldobyatk(token, newbalance);
                    yield cashmaniafunctions_1.default.atualizardebitado(token, bet);
                    yield cashmaniafunctions_1.default.atualizarapostado(token, bet);
                    if (calltwo[0].steps > 0) {
                        yield allfunctions_1.default.subtrairstepscall(resultadospin.idcall);
                    }
                    if (bonusjson[calltwo[0].steps].fs.hasOwnProperty("aw")) {
                        bonusjson[calltwo[0].steps].fs["aw"] = (yield allfunctions_1.default.getcallbyid(resultadospin.idcall))[0].aw;
                    }
                    let json = {
                        dt: {
                            si: {
                                wp: (_a = bonusjson[calltwo[0].steps]) === null || _a === void 0 ? void 0 : _a.wp,
                                lw: (_b = bonusjson[calltwo[0].steps]) === null || _b === void 0 ? void 0 : _b.lw,
                                twbm: (_c = bonusjson[calltwo[0].steps]) === null || _c === void 0 ? void 0 : _c.rv[1],
                                fs: (_d = bonusjson[calltwo[0].steps]) === null || _d === void 0 ? void 0 : _d.fs,
                                imw: false,
                                rv: (_e = bonusjson[calltwo[0].steps]) === null || _e === void 0 ? void 0 : _e.rv,
                                orl: null,
                                orv: null,
                                rsrl: (_f = bonusjson[calltwo[0].steps]) === null || _f === void 0 ? void 0 : _f.rsrl,
                                rsrv: (_g = bonusjson[calltwo[0].steps]) === null || _g === void 0 ? void 0 : _g.rsrv,
                                nfp: null,
                                gwt: -1,
                                fb: null,
                                ctw: valorganho,
                                pmt: null,
                                cwc: 0,
                                fstc: (_h = bonusjson[calltwo[0].steps]) === null || _h === void 0 ? void 0 : _h.fstc,
                                pcwc: 0,
                                rwsp: null,
                                hashr: "5:4;7;4#3;0;0#5;3;2#MV#0#MT#1#MG#0#",
                                ml: ml,
                                cs: cs,
                                rl: (_j = bonusjson[calltwo[0].steps]) === null || _j === void 0 ? void 0 : _j.rl,
                                sid: "1800172293483068928",
                                psid: "1800172216966381056",
                                st: (_k = bonusjson[calltwo[0].steps]) === null || _k === void 0 ? void 0 : _k.st,
                                nst: (_l = bonusjson[calltwo[0].steps]) === null || _l === void 0 ? void 0 : _l.nst,
                                pf: 1,
                                aw: (yield allfunctions_1.default.getcallbyid(resultadospin.idcall))[0].aw,
                                wid: 0,
                                wt: "C",
                                wk: "0_C",
                                wbn: null,
                                wfg: null,
                                blb: saldoatual,
                                blab: newbalance,
                                bl: newbalance,
                                tb: 0.0,
                                tbb: bet,
                                tw: valorganho,
                                np: valorganho,
                                ocr: null,
                                mr: null,
                                ge: [1, 11]
                            }
                        },
                        err: null,
                    };
                    yield apicontroller_1.default.callbackgame({
                        agent_code: agent[0].agentcode,
                        agent_secret: agent[0].secretKey,
                        user_code: user[0].username,
                        user_balance: user[0].saldo,
                        user_total_credit: user[0].valorganho,
                        user_total_debit: user[0].valorapostado,
                        game_type: "slot",
                        slot: {
                            provider_code: "PGSOFT",
                            game_code: gamename,
                            round_id: yield gerarNumeroUnico(),
                            type: "BASE",
                            bet: bet,
                            win: valorganho,
                            txn_id: `${txnid}`,
                            txn_type: "debit_credit",
                            is_buy: false,
                            is_call: true,
                            user_before_balance: user[0].saldo,
                            user_after_balance: newbalance,
                            agent_before_balance: 100,
                            agent_after_balance: 100,
                            created_at: dataFormatada,
                        },
                    });
                    yield allfunctions_1.default.savejsonspin(user[0].id, JSON.stringify(json), gamename);
                    ;
                    res.send(json);
                }
            }
            catch (error) {
                logger_1.default.error(error);
            }
        });
    },
};
