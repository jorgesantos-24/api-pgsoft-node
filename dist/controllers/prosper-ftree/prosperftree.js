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
const prosperftreefunctions_1 = __importDefault(require("../../functions/prosper-ftree/prosperftreefunctions"));
// IMPORT LINHAS
const linhaperdatree_1 = __importDefault(require("../../jsons/prosper-ftree/linhaperdatree"));
const linhabonustree_1 = __importDefault(require("../../jsons/prosper-ftree/linhabonustree"));
const notcashtree_1 = __importDefault(require("../../jsons/prosper-ftree/notcashtree"));
const linhaganhotree_1 = __importDefault(require("../../jsons/prosper-ftree/linhaganhotree"));
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
        let multplicador = 0;
        for (let i = 1; i <= 25; i++) {
            const chave = i.toString();
            if (json.hasOwnProperty(chave)) {
                multplicador += parseFloat(json[chave]);
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
    gettree(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = req.body.atk;
                const gamename = "prosper-ftree";
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
                        maxwm: null,
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
            var _a, _b, _c, _d, _e;
            let cs = parseFloat(req.body.cs);
            let ml = parseFloat(req.body.ml);
            const token = req.body.atk;
            try {
                const user = yield prosperftreefunctions_1.default.getuserbyatk(token);
                let bet = r2(cs * ml * 20);
                let saldoatual = Number(user[0].saldo);
                const gamename = "prosper-ftree";
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
                    res.send(yield notcashtree_1.default.notcash(saldoatual, cs, ml));
                    return;
                }
                const retornado = user[0].valorganho;
                const valorapostado = user[0].valorapostado;
                const rtp = (retornado / valorapostado) * 100;
                if (saldoatual < bet) {
                    res.send(yield notcashtree_1.default.notcash(saldoatual, cs, ml));
                    return;
                }
                let steps = getSteps(token, gamename);
                const resultadospin = yield allfunctions_1.default.calcularganho(bet, saldoatual, token, gamename);
                if (steps > 0) {
                    resultadospin.result = "ganho";
                }
                if (req.body.fb === "2") {
                    resultadospin.result = "bonus";
                    const saldocompra = saldoatual - 45;
                    yield prosperftreefunctions_1.default.attsaldobyatk(token, saldocompra);
                    logger_1.default.info("[!] COMPRA BONUS ACIONADO COM SUCESSO!");
                }
                if (resultadospin.result === "perda") {
                    let newbalance = r2(saldoatual - bet);
                    yield prosperftreefunctions_1.default.attsaldobyatk(token, newbalance);
                    yield prosperftreefunctions_1.default.atualizardebitado(token, bet);
                    yield prosperftreefunctions_1.default.atualizarapostado(token, bet);
                    const perdajson = yield linhaperdatree_1.default.linhaperda();
                    let json = {
                        dt: {
                            si: {
                                wp: null,
                                lw: null,
                                snww: null,
                                ssaw: perdajson.ssaw,
                                orl: perdajson.orl,
                                gm: perdajson.gm,
                                sc: perdajson.sc,
                                sps: perdajson.sps,
                                rns: perdajson.rns,
                                fs: perdajson.fs,
                                gwt: perdajson.gwt,
                                fb: perdajson.fb,
                                ctw: perdajson.ctw,
                                pmt: perdajson.pmt,
                                cwc: perdajson.cwc,
                                fstc: perdajson.fstc,
                                pcwc: perdajson.pcwc,
                                rwsp: perdajson.rwsp,
                                hashr: perdajson.hashr,
                                ml: ml,
                                cs: cs,
                                rl: perdajson.rl,
                                sid: "1820663932919938560",
                                psid: "1820663932919938560",
                                st: perdajson.st,
                                nst: perdajson.nst,
                                pf: perdajson.pf,
                                aw: 0.0,
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
                    try {
                        const userId = user[0].id;
                        // Recuperar a linha de ganho do banco de dados
                        let linhaGanhoAnterior = yield prosperftreefunctions_1.default.obterLinhaGanho(userId, gamename);
                        // Se houver um ganho anterior, use a linha armazenada, caso contrário, gere uma nova
                        let numeroAleatorio;
                        if (linhaGanhoAnterior !== null && linhaGanhoAnterior !== undefined) {
                            numeroAleatorio = linhaGanhoAnterior;
                        }
                        else {
                            numeroAleatorio = Math.floor(Math.random() * 4) + 1;
                            //numeroAleatorio = Math.floor(Math.random() * 11) // Supondo que maxLinhas seja o número máximo de linhas disponíveis
                            linhaGanhoAnterior = numeroAleatorio; // Armazenar a nova linha de ganho
                        }
                        console.log("Linha de ganho escolhida: " + numeroAleatorio);
                        const ganhojson = yield linhaganhotree_1.default.linhaganho(numeroAleatorio);
                        // Verificar se ganhojson não é nulo ou indefinido
                        if (!ganhojson) {
                            throw new Error("Dados de ganho inválidos");
                        }
                        const refBet = Number(ganhojson[steps].tbb) || Number(ganhojson[steps].tb) || 0;
                        const escala = refBet > 0 ? bet / refBet : 1;
                        const multPasso = Number(ganhojson[steps].multiplicador) || (refBet > 0 ? (Number(ganhojson[steps].tw) || 0) / refBet : 0);
                        let valorganho = r2(bet * multPasso);
                        let wmvalue = 0;
                        console.log("VALOR GANHO " + valorganho);
                        // Verificar se saldoatual e bet são válidos
                        if (typeof saldoatual !== "number" || typeof bet !== "number") {
                            throw new Error("Saldo ou aposta inválidos");
                        }
                        const betPasso = steps > 0 ? 0 : bet;
                        const newbalance = r2(saldoatual + valorganho - betPasso);
                        // Atualizar saldo, debitar aposta e atualizar ganho
                        yield prosperftreefunctions_1.default.attsaldobyatk(token, newbalance);
                        yield prosperftreefunctions_1.default.atualizardebitado(token, betPasso);
                        yield prosperftreefunctions_1.default.atualizarapostado(token, betPasso);
                        yield prosperftreefunctions_1.default.atualizarganho(token, valorganho);
                        let json = {
                            dt: {
                                si: {
                                    wp: ganhojson[steps].wp,
                                    lw: ganhojson[steps].lw,
                                    snww: ganhojson[steps].snww,
                                    ssaw: r2(ganhojson[steps].ssaw * escala),
                                    orl: ganhojson[steps].orl,
                                    gm: ganhojson[steps].gm,
                                    sc: ganhojson[steps].sc,
                                    sps: ganhojson[steps].sps,
                                    rns: ganhojson[steps].rns,
                                    fs: ganhojson[steps].fs,
                                    gwt: ganhojson[steps].gwt,
                                    fb: ganhojson[steps].fb,
                                    ctw: r2(ganhojson[steps].ctw * escala),
                                    pmt: ganhojson[steps].pmt,
                                    cwc: ganhojson[steps].cwc,
                                    fstc: ganhojson[steps].fstc,
                                    pcwc: ganhojson[steps].pcwc,
                                    rwsp: ganhojson[steps].rwsp,
                                    hashr: ganhojson[steps].hashr,
                                    ml: ml,
                                    cs: cs,
                                    rl: ganhojson[steps].rl,
                                    sid: "1820663932919938560",
                                    psid: "1820663932919938560",
                                    st: ganhojson[steps].st,
                                    nst: ganhojson[steps].nst,
                                    pf: ganhojson[steps].pf,
                                    aw: r2(ganhojson[steps].aw * escala),
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
                                    tw: r2(ganhojson[steps].tw * escala),
                                    np: r2(valorganho - bet),
                                    ocr: null,
                                    mr: null,
                                    ge: [1, 11],
                                },
                            },
                            err: null,
                        };
                        // Salvar os dados do spin
                        yield allfunctions_1.default.savejsonspin(user[0].id, JSON.stringify(json), gamename);
                        const txnid = (0, uuid_1.v4)();
                        const dataFormatada = (0, moment_1.default)().toISOString();
                        // Salvar a linha de ganho atual no banco de dados
                        yield prosperftreefunctions_1.default.atualizarLinhaGanho(userId, gamename, numeroAleatorio);
                        logger_1.default.info("LINHA DE GANHO SALVA NO BD: " + numeroAleatorio);
                        console.log("linha de ganho " + numeroAleatorio);
                        // Incrementar e verificar steps
                        incrementSteps(token, gamename);
                        if (getSteps(token, gamename) >= Object.keys(ganhojson).length) {
                            resetSteps(token, gamename);
                            yield prosperftreefunctions_1.default.atualizarLinhaGanho(userId, gamename, null); // Resetar a linha de ganho quando os steps são resetados
                        }
                        // Callback para o jogo
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
                                bet: betPasso,
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
                        return;
                    }
                    catch (error) {
                        if (error instanceof Error) {
                            logger_1.default.error(error.message);
                        }
                        else {
                            logger_1.default.error("Ocorreu um erro desconhecido");
                        }
                        res.status(500).send({
                            err: {
                                type: "InternalError",
                                message: "Ocorreu um erro desconhecido, tente novamente. (codigo de erro:G1008)",
                            },
                        });
                    }
                }
                if (resultadospin.result === "bonus") {
                    const numeroAleatorio = 1;
                    const bonusjson = yield linhabonustree_1.default.linhabonus(resultadospin.json);
                    let call = yield allfunctions_1.default.getcallbyid(resultadospin.idcall);
                    logger_1.default.info(`Dados da call obtida: ${JSON.stringify(call)}`);
                    if (call.length > 0) {
                        if (call[0].steps === null && call[0].status === "pending") {
                            if (saldoatual < bet) {
                                const semsaldo = yield notcashtree_1.default.notcash(saldoatual, cs, ml);
                                res.send(semsaldo);
                                return;
                            }
                        }
                        if (call[0].steps === null && call[0].status === "pending") {
                            const steps = Object.keys(bonusjson).length - 1;
                            yield allfunctions_1.default.updatestepscall(resultadospin.idcall, steps);
                            logger_1.default.info(`Steps atualizados para: ${steps}`);
                        }
                    }
                    let calltwo = yield allfunctions_1.default.getcallbyid(resultadospin.idcall);
                    logger_1.default.info(`Dados da calltwo obtida: ${JSON.stringify(calltwo)}`);
                    logger_1.default.info("Iniciando a primeira etapa do bônus");
                    if (calltwo.length > 0) {
                        if (calltwo[0].steps === 0) {
                            yield allfunctions_1.default.completecall(calltwo[0].id);
                        }
                        let multplicador = 0;
                        if (((_a = bonusjson[calltwo[0].steps]) === null || _a === void 0 ? void 0 : _a.rwsp) != null) {
                            multplicador = yield countrwsp(bonusjson[calltwo[0].steps].rwsp);
                        }
                        if (((_b = bonusjson[calltwo[0].steps]) === null || _b === void 0 ? void 0 : _b.lw) != null) {
                            yield lwchange(bonusjson[calltwo[0].steps].rwsp, bonusjson[calltwo[0].steps].lw, cs, ml);
                        }
                        let wmvalue = 0;
                        const txnid = (0, uuid_1.v4)();
                        const dataFormatada = (0, moment_1.default)().toISOString();
                        let valorganho = r2(cs * ml * multplicador);
                        let valorganhonowm = cs * ml * multplicador;
                        if (((_c = bonusjson[calltwo[0].steps]) === null || _c === void 0 ? void 0 : _c.rwm) != null) {
                            wmvalue = yield returnrwm(bonusjson[calltwo[0].steps].rwm);
                            valorganho = r2(valorganho * wmvalue);
                        }
                        const primeiroPasso = calltwo[0].steps === Object.keys(bonusjson).length - 1;
                        const betPasso = primeiroPasso ? bet : 0;
                        const newbalance = r2(saldoatual - betPasso + valorganho);
                        yield prosperftreefunctions_1.default.attawcall(calltwo[0].id, valorganho);
                        yield prosperftreefunctions_1.default.attsaldobyatk(token, newbalance);
                        yield prosperftreefunctions_1.default.atualizardebitado(token, betPasso);
                        yield prosperftreefunctions_1.default.atualizarapostado(token, betPasso);
                        yield prosperftreefunctions_1.default.atualizarganho(token, valorganho);
                        if (calltwo[0].steps > 0) {
                            yield allfunctions_1.default.subtrairstepscall(resultadospin.idcall);
                        }
                        if ((_e = (_d = bonusjson[calltwo[0].steps]) === null || _d === void 0 ? void 0 : _d.fs) === null || _e === void 0 ? void 0 : _e.hasOwnProperty("aw")) {
                            bonusjson[calltwo[0].steps].fs["aw"] = (yield allfunctions_1.default.getcallbyid(resultadospin.idcall))[0].aw;
                        }
                        let json = {
                            dt: {
                                si: {
                                    wp: bonusjson[calltwo[0].steps].wp,
                                    lw: bonusjson[calltwo[0].steps].lw,
                                    snww: bonusjson[calltwo[0].steps].snww,
                                    ssaw: bonusjson[calltwo[0].steps].ssaw,
                                    orl: bonusjson[calltwo[0].steps].orl,
                                    gm: bonusjson[calltwo[0].steps].gm,
                                    sc: bonusjson[calltwo[0].steps].sc,
                                    sps: bonusjson[calltwo[0].steps].sps,
                                    rns: bonusjson[calltwo[0].steps].rns,
                                    fs: bonusjson[calltwo[0].steps].fs,
                                    gwt: bonusjson[calltwo[0].steps].gwt,
                                    fb: bonusjson[calltwo[0].steps].fb,
                                    ctw: bonusjson[calltwo[0].steps].ctw,
                                    pmt: bonusjson[calltwo[0].steps].pmt,
                                    cwc: bonusjson[calltwo[0].steps].cwc,
                                    fstc: bonusjson[calltwo[0].steps].fstc,
                                    pcwc: bonusjson[calltwo[0].steps].pcwc,
                                    rwsp: bonusjson[calltwo[0].steps].rwsp,
                                    hashr: bonusjson[calltwo[0].steps].hashr,
                                    ml: ml,
                                    cs: cs,
                                    rl: bonusjson[calltwo[0].steps].rl,
                                    sid: "1820663932919938560",
                                    psid: "1820663932919938560",
                                    st: bonusjson[calltwo[0].steps].st,
                                    nst: bonusjson[calltwo[0].steps].nst,
                                    pf: bonusjson[calltwo[0].steps].pf,
                                    aw: bonusjson[calltwo[0].steps].aw,
                                    wid: 0,
                                    wt: "C",
                                    wk: "0_C",
                                    wbn: null,
                                    wfg: null,
                                    blb: saldoatual,
                                    blab: r2(saldoatual - betPasso),
                                    bl: newbalance,
                                    tb: betPasso,
                                    tbb: bet,
                                    tw: bonusjson[calltwo[0].steps].tw,
                                    np: r2(valorganho - betPasso),
                                    ocr: null,
                                    mr: null,
                                    ge: [1, 11],
                                },
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
                                bet: betPasso,
                                win: Number(valorganho),
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
                        res.send(json);
                    }
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
