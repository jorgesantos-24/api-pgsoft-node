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
require("dotenv/config");
//IMPORT FUNCTIONS
const serverEvents_1 = require("../../serverEvents");
const allfunctions_1 = __importDefault(require("../../functions/allfunctions"));
const apicontroller_1 = __importDefault(require("../apicontroller"));
const wingsiguazufunctions_1 = __importDefault(require("../../functions/wings-iguazu/wingsiguazufunctions"));
//IMPORT LINHAS
const linhaperdaiguazu_1 = __importDefault(require("../../jsons/wings-iguazu/linhaperdaiguazu"));
const linhaganhoiguazu_1 = __importDefault(require("../../jsons/wings-iguazu/linhaganhoiguazu"));
const linhabonusiguazu_1 = __importDefault(require("../../jsons/wings-iguazu/linhabonusiguazu"));
const notcashiguazu_1 = __importDefault(require("../../jsons/wings-iguazu/notcashiguazu"));
// Arredonda dinheiro para 2 casas (evita 123.19999999999999)
const r2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const stepsStorage = {};
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
    getiguazu(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = req.body.atk;
                const gamename = "wings-iguazu";
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
                        fb: { is: true, bm: 75, t: 0.6 },
                        wt: { mw: 3.0, bw: 5.0, mgw: 15.0, smgw: 35.0 },
                        maxwm: 2500,
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
            let cs = Number(req.body.cs);
            let ml = Number(req.body.ml);
            const token = req.body.atk;
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
            function returnrwspnotnull(json) {
                return __awaiter(this, void 0, void 0, function* () {
                    let chavereturn = "";
                    for (const chave in json) {
                        if (json[chave] != null) {
                            chavereturn = chave;
                        }
                    }
                    return chavereturn;
                });
            }
            function countrwspzero(json) {
                return __awaiter(this, void 0, void 0, function* () {
                    let multplicador = 0;
                    for (let i = 1; i <= 30; i++) {
                        const chave = i.toString();
                        if (json.hasOwnProperty(chave)) {
                            multplicador = multplicador + parseFloat(json[chave]);
                        }
                    }
                    return multplicador;
                });
            }
            function countrwspone(json) {
                return __awaiter(this, void 0, void 0, function* () {
                    let multplicador = 0;
                    for (let i = 1; i <= 30; i++) {
                        const chave = i.toString();
                        if (json.hasOwnProperty(chave)) {
                            multplicador = multplicador + parseFloat(json[chave]);
                        }
                    }
                    return multplicador;
                });
            }
            function countkeyrwspnull(json) {
                return __awaiter(this, void 0, void 0, function* () {
                    let count = 0;
                    for (let chave in json) {
                        if (json[chave] === null) {
                            count = count + 1;
                        }
                    }
                    return count;
                });
            }
            function countrwsp(json) {
                return __awaiter(this, void 0, void 0, function* () {
                    let multplicador = 0;
                    for (let i = 1; i <= 30; i++) {
                        const chave = i.toString();
                        if (json.hasOwnProperty(chave)) {
                            multplicador = multplicador + parseFloat(json[chave]);
                        }
                    }
                    return multplicador;
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
                            value = value + parseFloat(json[chave]);
                        }
                    }
                    return value;
                });
            }
            try {
                const user = yield wingsiguazufunctions_1.default.getuserbyatk(token);
                let bet = r2(cs * ml * 20);
                console.log(bet);
                let saldoatual = Number(user[0].saldo);
                const gamename = "wings-iguazu";
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
                if (checkuserbalance.data.msg === "INVALID_USER") {
                    res.send(yield notcashiguazu_1.default.notcash(saldoatual, cs, ml));
                    return false;
                }
                else if (checkuserbalance.data.msg === "INSUFFICIENT_USER_FUNDS") {
                    res.send(yield notcashiguazu_1.default.notcash(saldoatual, cs, ml));
                    return false;
                }
                const retornado = user[0].valorganho;
                const valorapostado = user[0].valorapostado;
                const rtp = (retornado / valorapostado) * 100;
                console.log("RTP ATUAL " + rtp);
                console.log("BET ATUAL " + bet);
                if (saldoatual < bet) {
                    const semsaldo = yield notcashiguazu_1.default.notcash(saldoatual, cs, ml);
                    res.send(semsaldo);
                    return false;
                }
                let steps = getSteps(token, gamename);
                const resultadospin = yield allfunctions_1.default.calcularganho(bet, saldoatual, token, gamename);
                if (steps > 0) {
                    resultadospin.result = "ganho";
                }
                if (req.body.fb === "2") {
                    resultadospin.result = "ganho";
                    //const saldocompra = saldoatual - 45;
                    //await wingsiguazufunctions.attsaldobyatk(token, saldocompra);
                    //logger.info('[!] COMPRA BONUS ACIONADO COM SUCESSO!');
                }
                if (resultadospin.result === "perda") {
                    let newbalance = r2(saldoatual - bet);
                    yield wingsiguazufunctions_1.default.attsaldobyatk(token, newbalance);
                    yield wingsiguazufunctions_1.default.atualizardebitado(token, bet);
                    yield wingsiguazufunctions_1.default.atualizarapostado(token, bet);
                    const perdajson = yield linhaperdaiguazu_1.default.linhaperda();
                    let json = {
                        dt: {
                            si: {
                                "wp": null,
                                "lw": null,
                                "orl": perdajson.orl,
                                "gm": perdajson.gm,
                                "sc": 0,
                                "ssaw": 0.00,
                                "crtw": 0.0,
                                "imw": false,
                                "fs": null,
                                "gwt": -1,
                                "fb": null,
                                "ctw": 0.0,
                                "pmt": null,
                                "cwc": 0,
                                "fstc": null,
                                "pcwc": 0,
                                "rwsp": null,
                                "hashr": "0:7;8;2#5;8;2#5;3;8#99;7;99#MV#6.0#MT#4#MG#0#",
                                "ml": ml,
                                "cs": cs,
                                "rl": perdajson.rl,
                                "sid": "1836234115960995328",
                                "psid": "1836234115960995328",
                                "st": 1,
                                "nst": 1,
                                "pf": 1,
                                "aw": 0.00,
                                "wid": 0,
                                "wt": "C",
                                "wk": "0_C",
                                "wbn": null,
                                "wfg": null,
                                "blb": saldoatual,
                                "blab": newbalance,
                                "bl": newbalance,
                                "tb": bet,
                                "tbb": bet,
                                "tw": 0.00,
                                "np": -bet,
                                "ocr": null,
                                "mr": null,
                                "ge": [
                                    1,
                                    3,
                                    11
                                ]
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
                    const ganhojson = yield linhaganhoiguazu_1.default.linhaganho(bet);
                    const multplicador = yield countrwsp(ganhojson.rwsp);
                    yield lwchange(ganhojson.rwsp, ganhojson.lw, cs, ml);
                    let valorganho = r2(cs * ml * multplicador * 2);
                    console.log("VALOR GANHO " + valorganho);
                    console.log("SALDO ANTES DO GANHO: " + saldoatual);
                    const newbalance = r2(saldoatual - bet + valorganho);
                    console.log("SALDO APOS GANHO: " + newbalance);
                    yield wingsiguazufunctions_1.default.attsaldobyatk(token, newbalance);
                    yield wingsiguazufunctions_1.default.atualizardebitado(token, bet);
                    yield wingsiguazufunctions_1.default.atualizarapostado(token, bet);
                    yield wingsiguazufunctions_1.default.atualizarganho(token, valorganho);
                    let json = {
                        dt: {
                            si: {
                                "wp": ganhojson.wp,
                                "lw": ganhojson.lw,
                                "orl": ganhojson.orl,
                                "gm": 1,
                                "sc": 0,
                                "ssaw": valorganho,
                                "crtw": 0.0,
                                "imw": false,
                                "fs": null,
                                "gwt": -1,
                                "fb": null,
                                "ctw": valorganho,
                                "pmt": null,
                                "cwc": 1,
                                "fstc": null,
                                "pcwc": 1,
                                "rwsp": ganhojson.rwsp,
                                "hashr": "0:4;5;8#7;7;7#7;0;8#99;6;99#R#7#011121#MV#6.0#MT#1#R#7#011221#MV#6.0#MT#1#R#7#021221#MV#6.0#MT#1#MG#9.0#",
                                "ml": ml,
                                "cs": cs,
                                "rl": ganhojson.rl,
                                "sid": "1836234125788249600",
                                "psid": "1836234125788249600",
                                "st": 1,
                                "nst": 1,
                                "pf": 1,
                                "aw": valorganho,
                                "wid": 0,
                                "wt": "C",
                                "wk": "0_C",
                                "wbn": null,
                                "wfg": null,
                                "blb": saldoatual,
                                "blab": newbalance,
                                "bl": newbalance,
                                "tb": bet,
                                "tbb": bet,
                                "tw": valorganho,
                                "np": -bet,
                                "ocr": null,
                                "mr": null,
                                "ge": [
                                    1,
                                    11
                                ]
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
                if (resultadospin.result === "bonus") {
                    const bonusjson = yield linhabonusiguazu_1.default.linhabonus(resultadospin.json);
                    let call = yield allfunctions_1.default.getcallbyid(resultadospin.idcall);
                    if (call[0].steps === null && call[0].status === "pending") {
                        const steps = Object.keys(bonusjson).length - 1;
                        yield allfunctions_1.default.updatestepscall(resultadospin.idcall, steps);
                    }
                    let calltwo = yield allfunctions_1.default.getcallbyid(resultadospin.idcall);
                    if (calltwo[0].steps === 0) {
                        const multplicador = yield countkeyrwspnull(bonusjson[calltwo[0].steps].rwsp);
                        logger_1.default.info(`Multiplicador: ${multplicador}`);
                        yield lwchange(bonusjson[calltwo[0].steps].rwsp, bonusjson[calltwo[0].steps].lw, cs, ml);
                        let valorganho = r2(cs * ml * multplicador);
                        logger_1.default.info(`Valor ganho antes do ult. spin: ${valorganho}`);
                        if (bonusjson[calltwo[0].steps].completed === true) {
                            valorganho = r2(cs * ml * multplicador * 10);
                        }
                        const newbalance = r2(saldoatual + valorganho - bet);
                        yield wingsiguazufunctions_1.default.attsaldobyatk(token, newbalance);
                        yield wingsiguazufunctions_1.default.atualizardebitado(token, bet);
                        yield wingsiguazufunctions_1.default.atualizarapostado(token, bet);
                        yield wingsiguazufunctions_1.default.atualizarganho(token, valorganho);
                        let json = {
                            dt: {
                                si: {
                                    wp: bonusjson[calltwo[0].steps].wp,
                                    lw: bonusjson[calltwo[0].steps].lw,
                                    rf: bonusjson[calltwo[0].steps].rf,
                                    rtf: bonusjson[calltwo[0].steps].rtf,
                                    fs: bonusjson[calltwo[0].steps].fs,
                                    rc: bonusjson[calltwo[0].steps].rc,
                                    im: bonusjson[calltwo[0].steps].im,
                                    itw: false,
                                    wc: 0,
                                    gwt: 3,
                                    fb: null,
                                    ctw: valorganho,
                                    pmt: null,
                                    cwc: 2,
                                    fstc: { "4": 1 },
                                    pcwc: 0,
                                    rwsp: bonusjson[calltwo[0].steps].rwsp,
                                    hashr: "1:5;5;5#5;5;5#5;5;5#99;5;99#R#5#001020#MV#0#MT#1#R#5#001120#MV#0#MT#1#R#5#001121#MV#0#MT#1#R#5#011120#MV#0#MT#1#R#5#011121#MV#0#MT#1#R#5#011221#MV#0#MT#1#R#5#011222#MV#0#MT#1#R#5#021221#MV#0#MT#1#R#5#021222#MV#0#MT#1#R#5#021322#MV#0#MT#1#MG#600.0#",
                                    ml: ml,
                                    cs: cs,
                                    rl: bonusjson[calltwo[0].steps].rl,
                                    sid: "1762318812932144640",
                                    psid: "1762318772436139520",
                                    st: bonusjson[calltwo[0].steps].st,
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
                                    tb: 0.0,
                                    tbb: bet,
                                    tw: valorganho,
                                    np: valorganho,
                                    ocr: null,
                                    mr: null,
                                    ge: [3, 11],
                                },
                            },
                            err: null,
                        };
                        yield allfunctions_1.default.savejsonspin(user[0].id, JSON.stringify(json), gamename);
                        yield allfunctions_1.default.completecall(calltwo[0].id);
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
                        res.send(json);
                        return false;
                    }
                    yield allfunctions_1.default.subtrairstepscall(resultadospin.idcall);
                    let json = {
                        dt: {
                            si: {
                                wp: bonusjson[calltwo[0].steps].wp,
                                lw: bonusjson[calltwo[0].steps].lw,
                                rf: bonusjson[calltwo[0].steps].rf,
                                rtf: bonusjson[calltwo[0].steps].rtf,
                                fs: bonusjson[calltwo[0].steps].fs,
                                rc: bonusjson[calltwo[0].steps].rc,
                                im: bonusjson[calltwo[0].steps].im,
                                itw: false,
                                wc: 0,
                                gwt: 3,
                                fb: null,
                                ctw: bonusjson[calltwo[0].steps].ctw,
                                pmt: null,
                                cwc: 2,
                                fstc: { "4": 1 },
                                pcwc: 0,
                                rwsp: bonusjson[calltwo[0].steps].rwsp,
                                hashr: "1:5;5;5#5;5;5#5;5;5#99;5;99#R#5#001020#MV#0#MT#1#R#5#001120#MV#0#MT#1#R#5#001121#MV#0#MT#1#R#5#011120#MV#0#MT#1#R#5#011121#MV#0#MT#1#R#5#011221#MV#0#MT#1#R#5#011222#MV#0#MT#1#R#5#021221#MV#0#MT#1#R#5#021222#MV#0#MT#1#R#5#021322#MV#0#MT#1#MG#600.0#",
                                ml: ml,
                                cs: cs,
                                rl: bonusjson[calltwo[0].steps].rl,
                                sid: "1762318812932144640",
                                psid: "1762318772436139520",
                                st: 4,
                                nst: 1,
                                pf: 1,
                                aw: bonusjson[calltwo[0].steps].aw,
                                wid: 0,
                                wt: "C",
                                wk: "0_C",
                                wbn: null,
                                wfg: null,
                                blb: bonusjson[calltwo[0].steps].blb,
                                blab: bonusjson[calltwo[0].steps].blab,
                                bl: bonusjson[calltwo[0].steps].bl,
                                tb: 0.0,
                                tbb: bet,
                                tw: bonusjson[calltwo[0].steps].tw,
                                np: bonusjson[calltwo[0].steps].np,
                                ocr: null,
                                mr: null,
                                ge: [3, 11],
                            },
                        },
                        err: null,
                    };
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
