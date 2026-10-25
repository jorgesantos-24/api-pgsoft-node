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
require("dotenv/config");
// IMPORT FUNCTIONS
const serverEvents_1 = require("../../serverEvents");
const allfunctions_1 = __importDefault(require("../../functions/allfunctions"));
const apicontroller_1 = __importDefault(require("../apicontroller"));
const icefirefunctions_1 = __importDefault(require("../../functions/gdn-ice-fire/icefirefunctions"));
// IMPORT LINHAS
const linhaperdaicefire_1 = __importDefault(require("../../jsons/gdn-ice-fire/linhaperdaicefire"));
const notcashicefire_1 = __importDefault(require("../../jsons/gdn-ice-fire/notcashicefire"));
const linhaganhoicefire_1 = __importDefault(require("../../jsons/gdn-ice-fire/linhaganhoicefire"));
// Arredonda dinheiro para 2 casas (evita 123.19999999999999)
const r2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const stepsStorage = {};
function lwchange(json1, json2, cs, ml) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let chave in json1) {
            if (json1.hasOwnProperty(chave)) {
                const valor = json1[chave];
                const ganho = cs * ml * parseFloat(valor);
                for (let chave2 in json2) {
                    if (json2.hasOwnProperty(chave2)) {
                        json2[chave] = ganho;
                    }
                }
            }
        }
    });
}
function countrwsp(json) {
    return __awaiter(this, void 0, void 0, function* () {
        let multiplicador = 0;
        for (let i = 1; i <= 25; i++) {
            const chave = i.toString();
            if (json.hasOwnProperty(chave)) {
                multiplicador += parseFloat(json[chave]);
            }
        }
        return multiplicador;
    });
}
function gerarNumeroUnico() {
    return __awaiter(this, void 0, void 0, function* () {
        return crypto.randomBytes(8).toString("hex");
    });
}
function returnrwm(json) {
    return __awaiter(this, void 0, void 0, function* () {
        let value = 0;
        for (let chave in json) {
            if (json.hasOwnProperty(chave)) {
                value += parseFloat(json[chave]);
            }
        }
        return value;
    });
}
function getSteps(token, gamename) {
    const key = `${token}:${gamename}`;
    return stepsStorage[key] || 0;
}
function setSteps(token, gamename, steps) {
    const key = `${token}:${gamename}`;
    stepsStorage[key] = steps;
}
function incrementSteps(token, gamename) {
    const key = `${token}:${gamename}`;
    stepsStorage[key] = (stepsStorage[key] || 0) + 1;
}
function resetSteps(token, gamename) {
    const key = `${token}:${gamename}`;
    delete stepsStorage[key];
}
exports.default = {
    geticefire(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = req.body.atk;
                const gamename = "gdn-ice-fire";
                const user = yield allfunctions_1.default.getuserbyatk(token);
                logger_1.default.info("[+] Usuario logado: " + user[0].username);
                const jsonprimay = yield allfunctions_1.default.getSpinByPlayerId(user[0].id);
                const jsoninicial = yield allfunctions_1.default.getjsonprimary(gamename);
                if (jsonprimay.length === 0) {
                    yield allfunctions_1.default.createOrUpdateSpin(user[0].id, gamename, jsoninicial[0].json);
                }
                else if (jsonprimay[0].game_code === gamename) {
                    logger_1.default.info("[+] Json Recuperado Do Ultimo Spin.");
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
                            t: 0.6,
                        },
                        wt: {
                            mw: 3.0,
                            bw: 5.0,
                            mgw: 15.0,
                            smgw: 35.0,
                        },
                        maxwm: null,
                        gcs: null,
                        cs: [0.03, 0.1, 0.3, 0.9],
                        ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                        mxl: 20,
                        bl: user[0].saldo,
                        inwe: false,
                        iuwe: false,
                        ls: jsonformatado.dt,
                        cc: "BRL",
                    },
                    err: null,
                });
            }
            catch (error) {
                logger_1.default.error(error);
                // Sempre responder, senão o jogo fica girando para sempre
                if (!res.headersSent) {
                    res.status(500).send({ dt: null, err: { cd: "500", msg: "Internal error", tid: "ERR500" } });
                }
            }
        });
    },
    spin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let cs = parseFloat(req.body.cs);
            let ml = parseFloat(req.body.ml);
            const token = req.body.atk;
            try {
                const user = yield icefirefunctions_1.default.getuserbyatk(token);
                let bet = r2(cs * ml * 20);
                let saldoatual = Number(user[0].saldo);
                const gamename = "gdn-ice-fire";
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
                if (checkuserbalance.data.user_balance != null)
                    saldoatual = Number(checkuserbalance.data.user_balance);
                if (checkuserbalance.data.msg === "INVALID_USER" || checkuserbalance.data.msg === "INSUFFICIENT_USER_FUNDS") {
                    res.send(yield notcashicefire_1.default.notcash(saldoatual, cs, ml));
                    return;
                }
                const retornado = user[0].valorganho;
                const valorapostado = user[0].valorapostado;
                const rtp = (retornado / valorapostado) * 100;
                if (saldoatual < bet) {
                    res.send(yield notcashicefire_1.default.notcash(saldoatual, cs, ml));
                    return;
                }
                let steps = getSteps(token, gamename);
                const resultadospin = yield allfunctions_1.default.calcularganho(bet, saldoatual, token, gamename);
                if (steps > 0) {
                    resultadospin.result = "ganho";
                }
                if (resultadospin.result === "bonus") {
                    resultadospin.result = "ganho";
                }
                if (resultadospin.result === "perda") {
                    let newbalance = r2(saldoatual - bet);
                    yield icefirefunctions_1.default.attsaldobyatk(token, newbalance);
                    yield icefirefunctions_1.default.atualizardebitado(token, bet);
                    yield icefirefunctions_1.default.atualizarapostado(token, bet);
                    const perdajson = yield linhaperdaicefire_1.default.linhaperda();
                    let json = {
                        dt: {
                            si: {
                                norl: null,
                                wp: null,
                                lw: null,
                                lwm: {},
                                snw: null,
                                slw: 0.0,
                                slwm: 0.0,
                                sc: 0,
                                stw: 0.0,
                                stwm: 0.0,
                                fs: null,
                                orl: perdajson.orl,
                                gwt: -1,
                                ctw: 0.0,
                                pmt: null,
                                cwc: 0,
                                fstc: null,
                                pcwc: 0,
                                rwsp: { "0": null },
                                hashr: "0:7;8;3;9;7;8#9;2;3;2;7;9#9;5;7;4#5;7#MV#12.0#MT#1#MG#0#",
                                fb: null,
                                ml: ml,
                                cs: cs,
                                rl: perdajson.rl,
                                sid: "1839115396310826496",
                                psid: "1839115396310826496",
                                st: 1,
                                nst: 1,
                                pf: 1,
                                aw: 0.0,
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
                                tw: 0.0,
                                np: -bet,
                                ocr: null,
                                mr: null,
                                ge: [1, 11],
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
                    return;
                }
                if (resultadospin.result === "ganho") {
                    const numeroAleatorio = Math.floor(Math.random() * 60) + 1; // Supondo que maxLinhas seja o número máximo de linhas disponíveis
                    const ganhojson = yield linhaganhoicefire_1.default.linhaganho(numeroAleatorio);
                    const multplicador = Number(ganhojson.multiplicador);
                    console.log("MULTIPLICADOR: " + multplicador);
                    let valorganho = r2(bet * multplicador);
                    console.log("VALOR GANHO " + valorganho);
                    console.log("SALDO ANTES DO GANHO: " + saldoatual);
                    const newbalance = r2(saldoatual - bet + valorganho);
                    console.log("SALDO APOS GANHO: " + newbalance);
                    yield icefirefunctions_1.default.attsaldobyatk(token, newbalance);
                    yield icefirefunctions_1.default.atualizardebitado(token, bet);
                    yield icefirefunctions_1.default.atualizarapostado(token, bet);
                    yield icefirefunctions_1.default.atualizarganho(token, valorganho);
                    let json = {
                        dt: {
                            si: {
                                norl: ganhojson.norl,
                                wp: ganhojson.wp,
                                lw: ganhojson.lw,
                                lwm: ganhojson.lwm,
                                snw: ganhojson.snw,
                                slw: ganhojson.slw,
                                slwm: ganhojson.slwm,
                                sc: ganhojson.sc,
                                stw: ganhojson.stw,
                                stwm: ganhojson.stwm,
                                fs: ganhojson.fs,
                                orl: ganhojson.orl,
                                gwt: ganhojson.gwt,
                                ctw: valorganho,
                                pmt: ganhojson.pmt,
                                cwc: ganhojson.cwc,
                                fstc: ganhojson.fstc,
                                pcwc: ganhojson.pcwc,
                                rwsp: ganhojson.rwsp,
                                hashr: "0:6;9;4;2;2;6#9;5;4;8;4;9#3;6;5;3#9;5#R#9#011023#MV#12.0#MT#1#MG#3.0#",
                                fb: ganhojson.fb,
                                ml: ml,
                                cs: cs,
                                rl: ganhojson.rl,
                                sid: "1839115596077137408",
                                psid: "1839115596077137408",
                                st: ganhojson.st,
                                nst: ganhojson.nst,
                                pf: ganhojson.pf,
                                aw: valorganho,
                                wid: 0,
                                wt: "C",
                                wk: "0_C",
                                wbn: null,
                                wfg: null,
                                blb: saldoatual,
                                blab: r2(saldoatual - bet),
                                bl: newbalance,
                                tb: bet,
                                tbb: bet,
                                tw: valorganho,
                                np: r2(valorganho - bet),
                                ocr: null,
                                mr: null,
                                ge: [1, 11],
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
            }
            catch (error) {
                logger_1.default.error(error);
                // Sempre responder, senão o jogo fica girando para sempre
                if (!res.headersSent) {
                    res.status(500).send({ dt: null, err: { cd: "500", msg: "Internal error", tid: "ERR500" } });
                }
            }
        });
    },
};
