import { Request, Response } from "express";
import axios from "axios";
import logger from "../../logger";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";  // Renomear a importação
import moment from "moment";
import "dotenv/config";
// IMPORT FUNCTIONS
import { emitirEventoInterno } from "../../serverEvents";
import allfunctions from "../../functions/allfunctions";
import apicontroller from "../apicontroller";
import ultimatestrikerfunctions from "../../functions/ultimate-striker/ultimatestrikerfunctions";
// IMPORT LINHAS
import linhaperdastriker from "../../jsons/ultimate-striker/linhaperdastriker";
import linhaganhostriker from "../../jsons/ultimate-striker/linhaganhostriker";
import linhabonusstriker from "../../jsons/ultimate-striker/linhabonusstriker";
import notcashstriker from "../../jsons/ultimate-striker/notcashstriker";

// Arredonda dinheiro para 2 casas (evita 123.19999999999999)
const r2 = (v: number) => Math.round((Number(v) + Number.EPSILON) * 100) / 100

// Escala dos dados gravados: as linhas de ganho foram gravadas com cs=0.3, ml=2.
// Todos os valores de dinheiro do JSON tem de ser multiplicados por (cs*ml)/(0.3*2)
// para corresponderem a aposta actual. Sem isto o premio nao tem relacao com a aposta.
const CS_GRAVADO = 0.3
const ML_GRAVADO = 2


const stepsStorage: { [key: string]: number } = {};

async function lwchange(json1: { [key: string]: any }, json2: { [key: string]: any }, cs: number, ml: number) {
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
}

async function countrwsp(json: { [key: string]: any }) {
    let multiplicador = 0;
    for (let i = 1; i <= 25; i++) {
        const chave = i.toString();
        if (json.hasOwnProperty(chave)) {
            multiplicador += parseFloat(json[chave]);
        }
    }
    return multiplicador;
}

async function gerarNumeroUnico() {
    return crypto.randomBytes(8).toString("hex");
}

async function returnrwm(json: { [key: string]: any }) {
    let value = 0;
    for (let chave in json) {
        if (json.hasOwnProperty(chave)) {
            value += parseFloat(json[chave]);
        }
    }
    return value;
}

function getSteps(token: string, gamename: string): number {
    const key = `${token}:${gamename}`;
    return stepsStorage[key] || 0;
}

function setSteps(token: string, gamename: string, steps: number) {
    const key = `${token}:${gamename}`;
    stepsStorage[key] = steps;
}

function incrementSteps(token: string, gamename: string) {
    const key = `${token}:${gamename}`;
    stepsStorage[key] = (stepsStorage[key] || 0) + 1;
}

function resetSteps(token: string, gamename: string) {
    const key = `${token}:${gamename}`;
    delete stepsStorage[key];
}

export default {
    async getstriker(req: Request, res: Response) {
        try {
            const token = req.body.atk;
            const gamename = "ultimate-striker";
            const user = await allfunctions.getuserbyatk(token);
            logger.info('[+] Usuario logado: '+ user[0].username)
            const jsonprimay = await allfunctions.getSpinByPlayerId(user[0].id);
            const jsoninicial = await allfunctions.getjsonprimary(gamename);
                if (jsonprimay.length === 0) {
                    await allfunctions.createOrUpdateSpin(user[0].id, gamename, jsoninicial[0].json);
                } else if (jsonprimay[0].game_code === gamename){
                    logger.info('[+] Json Recuperado Do Ultimo Spin.')
                } else {
                    await allfunctions.createOrUpdateSpin(user[0].id, gamename, jsoninicial[0].json);
                }
            const json = await allfunctions.getSpinByPlayerId(user[0].id);
            const jsonformatado = JSON.parse(json[0].json);
            res.send({
                dt: {
                    fb: { is: true, bm: 100, t: 0.75 },
                    wt: { mw: 5, bw: 20, mgw: 35, smgw: 50 },
                    maxwm: null,
                    // Moedas proprias do Ultimate Striker. Estavam copiadas do Bikini
                    // Paradise ([0.02, 0.12, 0.8]), o que fazia a tela mostrar uma
                    // aposta diferente da que o servidor cobrava.
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
        } catch (error) {
            logger.error(error);
            // Sempre responder, senão o jogo fica girando para sempre
            if (!res.headersSent) {
               res.status(500).send({ dt: null, err: { cd: "500", msg: "Internal error", tid: "ERR500" } })
            }
        }
    },

    async spin(req: Request, res: Response) {
        let cs: number = Number(req.body.cs);
        let ml: number = Number(req.body.ml);
        const token = req.body.atk;

        try {
            const user = await ultimatestrikerfunctions.getuserbyatk(token);
            let bet: number = r2(cs * ml * 20);
            let saldoatual: number = Number(user[0].saldo);
            const gamename = "ultimate-striker";

            emitirEventoInterno("att", {
                token: token,
                username: user[0].username,
                bet: bet,
                saldo: saldoatual,
                rtp: user[0].rtp,
                agentid: user[0].agentid,
                gamecode: gamename,
            });

            const agent = await allfunctions.getagentbyid(user[0].agentid);

            const checkuserbalance = await axios({
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
            if (checkuserbalance.data.msg === "INVALID_USER" || checkuserbalance.data.msg === "INSUFFICIENT_USER_FUNDS") {
                res.send(await notcashstriker.notcash(saldoatual, cs, ml));
                return;
            }

            const retornado = user[0].valorganho;
            const valorapostado = user[0].valorapostado;

            const rtp = (retornado / valorapostado) * 100;

            if (saldoatual < bet) {
                res.send(await notcashstriker.notcash(saldoatual, cs, ml));
                return;
            }

            let steps = getSteps(token, gamename);
            // So o passo 0 de uma rodada cobra. Nos passos de cascata o bet ja foi pago.
            const primeiroPasso = steps === 0;

            // Compra de bonus: cobra bet * fb.bm e sincroniza com o site.
            // Antes descontava 40 fixos so na BD local, sem callback ao operador.
            let comprouBonus = false;
            if (req.body.fb === "2") {
                const valorcompra = r2(bet * 100);
                if (saldoatual < valorcompra) {
                    res.send(await notcashstriker.notcash(saldoatual, cs, ml));
                    return;
                }
                const saldocompra = r2(saldoatual - valorcompra);
                await ultimatestrikerfunctions.attsaldobyatk(token, saldocompra);
                await apicontroller.callbackgame({
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
                        round_id: await gerarNumeroUnico(),
                        type: "BASE",
                        bet: valorcompra,
                        win: 0,
                        txn_id: `${uuidv4()}`,
                        txn_type: "debit_credit",
                        is_buy: true,
                        is_call: false,
                        user_before_balance: saldoatual,
                        user_after_balance: saldocompra,
                        agent_before_balance: 100,
                        agent_after_balance: 100,
                        created_at: moment().toISOString(),
                    },
                });
                saldoatual = saldocompra;
                comprouBonus = true;
                logger.info('[!] COMPRA DE BONUS: -' + valorcompra);
            }

            // Quanto e cobrado NESTA chamada: 0 nos passos de cascata e na compra de bonus
            const betPasso = comprouBonus ? 0 : (primeiroPasso ? bet : 0);

            const resultadospin = await allfunctions.calcularganho(bet, saldoatual, token, gamename);

            if (steps > 0 || comprouBonus) {
                resultadospin.result = "ganho";
            }

            if (resultadospin.result === "perda") {
                let newbalance = r2(saldoatual - bet);
                await ultimatestrikerfunctions.attsaldobyatk(token, newbalance);
                await ultimatestrikerfunctions.atualizardebitado(token, bet);
                await ultimatestrikerfunctions.atualizarapostado(token, bet);
                const perdajson = await linhaperdastriker.linhaperda();

                const possibilidades = Math.floor(Math.random() * 8193);

                let json = {
                    "dt": {
                        "si": {
                            "wp": null,
                            "lw": null,
                            "bwp": null,
                            "snww": null,
                            "now": possibilidades,
                            "nowpr": perdajson.nowpr || [],
                            "es": perdajson.es || {},
                            "eb": perdajson.eb || {},
                            "esb": perdajson.esb || {},
                            "ebb": perdajson.ebb || {},
                            "ptbr": null,
                            "orl": perdajson.orl || [],
                            "ssaw": perdajson.ssaw || null,
                            "sc": perdajson.sc || 0,
                            "gm": perdajson.gm || null,
                            "omf": perdajson.omf || [],
                            "mf": perdajson.mf || [],
                            "mi": perdajson.mi || 0,
                            "twbm": perdajson.twbm || 0,
                            "crtw": perdajson.crtw || 0,
                            "imw": perdajson.imw || false,
                            "rs": perdajson.rs || null,
                            "fs": perdajson.fs || null,
                            "gwt": perdajson.gwt || -1,
                            "fb": perdajson.fb || null,
                            "ctw": perdajson.ctw || 0,
                            "pmt": perdajson.pmt || null,
                            "cwc": perdajson.cwc || 0,
                            "fstc": perdajson.fstc || {},
                            "pcwc": perdajson.pcwc || 0,
                            "rwsp": perdajson.rwsp || null,
                            "hashr": perdajson.hashr || "",
                            "ml": ml,
                            "cs": cs,
                            "rl": perdajson.rl || [],
                            "sid": "1819129987980000768",
                            "psid": "1819129971504774656",
                            "st": perdajson.st || 0,
                            "nst": perdajson.nst || 0,
                            "pf": perdajson.pf || 0,
                            "aw": 0.0,
                            "wid": perdajson.wid || 0,
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
                            "ge": [1, 11]
                        }
                    },
                    err: null,
                };

                await allfunctions.savejsonspin(user[0].id, JSON.stringify(json), gamename);
                const txnid = uuidv4();
                const dataFormatada = moment().toISOString();

                await apicontroller.callbackgame({
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
                        round_id: await gerarNumeroUnico(),
                        type: "BASE",
                        bet: bet,
                        win: 0,
                        txn_id: `${txnid}`,
                        txn_type: "debit_credit",
                        is_buy: false,
                        is_call: false,
                        user_before_balance: saldoatual,
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
                let linhaGanhoAnterior = await ultimatestrikerfunctions.obterLinhaGanho(userId, gamename);
            
                // Se houver um ganho anterior, use a linha armazenada, caso contrário, gere uma nova
                let numeroAleatorio;
                if (linhaGanhoAnterior !== null && linhaGanhoAnterior !== undefined) {
                    numeroAleatorio = linhaGanhoAnterior;
                } else {
                    //numeroAleatorio = 3;
                    numeroAleatorio = Math.floor(Math.random() * 13) + 1; // Supondo que maxLinhas seja o número máximo de linhas disponíveis
                    linhaGanhoAnterior = numeroAleatorio; // Armazenar a nova linha de ganho
                }
            
                console.log("Linha de ganho escolhida: " + numeroAleatorio);
            
                const ganhojson = await linhaganhostriker.linhaganho(numeroAleatorio);
            
                // Verificar se ganhojson não é nulo ou indefinido
                if (!ganhojson || !ganhojson[steps]) {
                    throw new Error("Dados de ganho inválidos");
                }

                const passojson = ganhojson[steps];

                // Escala: os valores gravados nao tem relacao com a aposta actual.
                // Sem isto o premio era um 100x fixo a moeda.
                const escala = (cs * ml) / (CS_GRAVADO * ML_GRAVADO);

                let tw = r2(Number(passojson.tw || 0) * escala);
                let aw = r2(Number(passojson.aw || 0) * escala);
                let valorganho = tw;
                console.log("VALOR GANHO " + valorganho + " (escala " + escala + ")");

                // Verificar se saldoatual e bet são válidos
                if (typeof saldoatual !== 'number' || typeof bet !== 'number') {
                    throw new Error("Saldo ou aposta inválidos");
                }

                const newbalance = r2(saldoatual + valorganho - betPasso);

                await ultimatestrikerfunctions.attsaldobyatk(token, newbalance);
                if (betPasso > 0) {
                    await ultimatestrikerfunctions.atualizardebitado(token, betPasso);
                    await ultimatestrikerfunctions.atualizarapostado(token, betPasso);
                }
                await ultimatestrikerfunctions.atualizarganho(token, valorganho);

                const possibilidades = Math.floor(Math.random() * 8193);

                let json = {
                    "dt": {
                        "si": {
                            "wp": passojson.wp,
                            "lw": passojson.lw,
                            "bwp": passojson.bwp,
                            "snww": passojson.snww,
                            "now": passojson.now,
                            "nowpr": passojson.nowpr,
                            "es": passojson.es,
                            "eb": passojson.eb,
                            "esb": passojson.esb,
                            "ebb": passojson.ebb,
                            "ptbr": passojson.ptbr,
                            "orl": passojson.orl,
                            "ssaw": r2(Number(passojson.ssaw || 0) * escala),
                            "sc": passojson.sc,
                            "gm": passojson.gm,
                            "omf": passojson.omf,
                            "mf": passojson.mf,
                            "mi": passojson.mi,
                            "twbm": r2(Number(passojson.twbm || 0) * escala),
                            "crtw": r2(Number(passojson.crtw || 0) * escala),
                            "imw": passojson.imw,
                            "rs": passojson.rs,
                            "fs": passojson.fs,
                            "gwt": passojson.gwt,
                            "fb": passojson.fb,
                            "ctw": r2(Number(passojson.ctw || 0) * escala),
                            "pmt": passojson.pmt,
                            "cwc": passojson.cwc,
                            "fstc": passojson.fstc,
                            "pcwc": passojson.pcwc,
                            "rwsp": passojson.rwsp,
                            "hashr": passojson.hashr,
                            "ml": ml,
                            "cs": cs,
                            "rl": passojson.rl,
                            "sid": passojson.sid,
                            "psid": passojson.psid,
                            "st": passojson.st,
                            "nst": passojson.nst,
                            "pf": passojson.pf,
                            "aw": aw,
                            "wid": passojson.wid,
                            "wt": "C",
                            "wk": "0_C",
                            "wbn": null,
                            "wfg": null,
                            "blb": saldoatual,
                            "blab": betPasso > 0 ? r2(saldoatual - betPasso) : saldoatual,
                            "bl": newbalance,
                            "tb": betPasso,
                            "tbb": bet,
                            "tw": tw,
                            "np": r2(tw - betPasso),
                            "ocr": null,
                            "mr": null,
                            "ge": [1, 11]
                        }
                    },
                    err: null,
                };

                await allfunctions.savejsonspin(user[0].id, JSON.stringify(json), gamename);
                const txnid = uuidv4();
                const dataFormatada = moment().toISOString();

                // Salvar a linha de ganho atual no banco de dados
                await ultimatestrikerfunctions.atualizarLinhaGanho(userId, gamename, numeroAleatorio);
                logger.info('LINHA DE GANHO SALVA NO BD: ' + numeroAleatorio);

                // Incrementar e verificar steps
                incrementSteps(token, gamename);
                if (getSteps(token, gamename) >= Object.keys(ganhojson).length) {
                    resetSteps(token, gamename);
                    await ultimatestrikerfunctions.atualizarLinhaGanho(userId, gamename, null); // Resetar a linha de ganho quando os steps são resetados
                }

                await apicontroller.callbackgame({
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
                        round_id: await gerarNumeroUnico(),
                        type: "BASE",
                        bet: betPasso,
                        win: Number(valorganho),
                        txn_id: `${txnid}`,
                        txn_type: "debit_credit",
                        is_buy: false,
                        is_call: false,
                        user_before_balance: saldoatual,
                        user_after_balance: newbalance,
                        agent_before_balance: 100,
                        agent_after_balance: 100,
                        created_at: dataFormatada,
                    },
                });
                res.send(json);
                return;
            } catch (error) {
                if (error instanceof Error) {
                    logger.error(error.message);
                } else {
                    logger.error("Ocorreu um erro desconhecido");
                }
                res.status(500).send({
                    err: {
                        type: "InternalError",
                        message: "Ocorreu um erro desconhecido, tente novamente. (codigo de erro:G1008)",
                    },
                });
            }
        }   
        } catch (error) {
            logger.error(error);
            // Sempre responder, senão o jogo fica girando para sempre
            if (!res.headersSent) {
               res.status(500).send({ dt: null, err: { cd: "500", msg: "Internal error", tid: "ERR500" } })
            }
        }
    },
};
