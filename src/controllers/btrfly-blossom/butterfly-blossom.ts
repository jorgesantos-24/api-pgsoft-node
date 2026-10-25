import { Request, Response } from "express";
import axios from "axios";
import logger from "../../logger";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import "dotenv/config";
// IMPORT FUNCTIONS
import { emitirEventoInterno } from "../../serverEvents";
import allfunctions from "../../functions/allfunctions";
import apicontroller from "../apicontroller";
import butterflyblossomfunctions from "../../functions/btrfly-blossom/butterflyblossomfunctions";
// IMPORT LINHAS
import linhaperdabtrfly from "../../jsons/btrfly-blossom/linhaperdabtrfly";
import linhabonusbikini from "../../jsons/bikini-paradise/linhabonusbikini";
import notcashbutterfly from "../../jsons/btrfly-blossom/notcashbutterfly";
import linhaganhobtrfly from "../../jsons/btrfly-blossom/linhaganhobtrfly";

// Arredonda dinheiro para 2 casas (evita 123.19999999999999)
const r2 = (v: number) => Math.round((Number(v) + Number.EPSILON) * 100) / 100


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
    async getbutterfly(req: Request, res: Response) {
        try {
            const token = req.body.atk;
            const gamename = "btrfly-blossom";
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
                    cs: [0.02, 0.2, 1],
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
            console.log('[DBG] catch: ' + (error as any).message);
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
            const user = await butterflyblossomfunctions.getuserbyatk(token);
            let bet: number = r2(cs * ml * 20);
            console.log("[DBG] btrfly spin inicio cs=" + cs + " ml=" + ml);
            let saldoatual: number = Number(user[0].saldo);
            const gamename = "btrfly-blossom";

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
                timeout: 8000,
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
                res.send(await notcashbutterfly.notcash(saldoatual, cs, ml));
                return;
            }

            const retornado = user[0].valorganho;
            const valorapostado = user[0].valorapostado;

            const rtp = (retornado / valorapostado) * 100;

            if (saldoatual < bet) {
                res.send(await notcashbutterfly.notcash(saldoatual, cs, ml));
                return;
            }

            let steps = getSteps(token, gamename);
            const resultadospin = await allfunctions.calcularganho(bet, saldoatual, token, gamename);

            if (steps > 0) {
                resultadospin.result = "ganho";
            }

            if (resultadospin.result === "perda") {
                let newbalance = r2(saldoatual - bet);
                await butterflyblossomfunctions.attsaldobyatk(token, newbalance);
                await butterflyblossomfunctions.atualizardebitado(token, bet);
                await butterflyblossomfunctions.atualizarapostado(token, bet);
                console.log("[DBG] ramo PERDA");
                const perdajson = await linhaperdabtrfly.linhaperda();

                let json = {
                    dt: {
                        si: {
                            wp: null,
                            wp3x5: null,
                            wpl: null,
                            ptbr: null,
                            lw: null,
                            lwm: null,
                            rl3x5: perdajson.rl3x5,
                            swl: null,
                            swlb: null,
                            nswl: null,
                            rswl: null,
                            rs: null,
                            fs: null,
                            sc: 1,
                            saw: 0.0,
                            tlw: 0.0,
                            gm: 1,
                            gmi: 0,
                            gml: perdajson.gml,
                            gwt: -1,
                            fb: null,
                            ctw: 0.0,
                            pmt: null,
                            cwc: 0,
                            fstc: null,
                            pcwc: 0,
                            rwsp: null,
                            hashr: "0:7;7;8;8;7#5;4;3;3;1#4;3;2;5;8#MV#12.0#MT#1#MG#0#",
                            ml: ml,
                            cs: cs,
                            rl: perdajson.rl,
                            sid: "1768293329693244928",
                            psid: "1768293329693244928",
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
                const numeroAleatorio = 1;
                console.log("[DBG] ramo GANHO");
                const ganhojson = await linhaganhobtrfly.linhaganho(numeroAleatorio);

                const refBet = Number(ganhojson[steps].tbb) || Number(ganhojson[steps].tb) || 0
                const escala = refBet > 0 ? bet / refBet : 1
                const multPasso = Number(ganhojson[steps].multiplicador) || (refBet > 0 ? (Number(ganhojson[steps].tw) || 0) / refBet : 0)
                let valorganho = r2(bet * multPasso)
                let wmvalue = 0;
                console.log("VALOR GANHO " + valorganho);
                const betPasso = steps > 0 ? 0 : bet
                const newbalance = r2(saldoatual + valorganho - betPasso)
                await butterflyblossomfunctions.attsaldobyatk(token, newbalance);
                await butterflyblossomfunctions.atualizardebitado(token, betPasso);
                await butterflyblossomfunctions.atualizarapostado(token, betPasso);
                await butterflyblossomfunctions.atualizarganho(token, valorganho);

                let json = {
                    dt: {
                        si: {
                            wp: ganhojson[steps].wp,
                            wp3x5: ganhojson[steps].wp3x5,
                            wpl: ganhojson[steps].wpl,
                            ptbr: ganhojson[steps].ptbr,
                            lw: ganhojson[steps].lw,
                            lwm: ganhojson[steps].lwm,
                            rl3x5: ganhojson[steps].rl3x5,
                            swl: ganhojson[steps].swl,
                            swlb: ganhojson[steps].swlb,
                            nswl: ganhojson[steps].nswl,
                            rswl: ganhojson[steps].rswl,
                            rs: ganhojson[steps].rs,
                            fs: ganhojson[steps].fs,
                            sc: 0,
                            saw: valorganho,
                            tlw: valorganho,
                            gm: 1,
                            gmi: 0,
                            gml: ganhojson[steps].gml,
                            gwt: -1,
                            fb: null,
                            ctw: valorganho,
                            pmt: null,
                            cwc: ganhojson[steps].cwc,
                            fstc: null,
                            pcwc: 1,
                            rwsp: ganhojson[steps].rwsp,
                            hashr: "0:8;6;6;8;7#7;3;4;5;2#4;3;8;0;7#R#4#022132#MV#3.00#MT#1#R#6#102032#MV#3.00#MT#1#MG#1.95#",
                            ml: ml,
                            cs: cs,
                            rl: ganhojson[steps].rl,
                            sid: "1768381452779453952",
                            psid: "1768381452779453952",
                            st: ganhojson[steps].st,
                            nst: ganhojson[steps].nst,
                            pf: 1,
                            aw: valorganho,
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
                            tw: valorganho,
                            np: r2(valorganho - betPasso),
                            ocr: null,
                            mr: null,
                            ge: [1, 11],
                        },
                    },
                    err: null,
                };

                await allfunctions.savejsonspin(user[0].id, JSON.stringify(json), gamename);
                const txnid = uuidv4();
                const dataFormatada = moment().toISOString();
                incrementSteps(token, gamename);
                if (getSteps(token, gamename) >= Object.keys(ganhojson).length) {
                    resetSteps(token, gamename);
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

            if (resultadospin.result === "bonus" && resultadospin.gamecode === gamename) {
                console.log("[DBG] ramo BONUS");
                const bonusjson = await linhabonusbikini.linhabonus(resultadospin.json);
                let call = await allfunctions.getcallbyid(resultadospin.idcall);

                if (call[0].steps === null && call[0].status === "pending") {
                    if (saldoatual < bet) {
                        const semsaldo = await notcashbutterfly.notcash(saldoatual, cs, ml);
                        res.send(semsaldo);
                        return;
                    }
                }

                if (call[0].steps === null && call[0].status === "pending") {
                    const steps = Object.keys(bonusjson).length - 1;
                    await allfunctions.updatestepscall(resultadospin.idcall, steps);
                }

                let calltwo = await allfunctions.getcallbyid(resultadospin.idcall);
                console.log("[DBG] btrfly bonus call steps=" + calltwo[0].steps + " status=" + calltwo[0].status);

                if (calltwo[0].steps === 0) {
                    await allfunctions.completecall(calltwo[0].id);
                }

                let multiplicador = 0;

                if (bonusjson[calltwo[0].steps].rwsp != null) {
                    multiplicador = await countrwsp(bonusjson[calltwo[0].steps].rwsp);
                }

                if (bonusjson[calltwo[0].steps].lw != null) {
                    await lwchange(bonusjson[calltwo[0].steps].rwsp, bonusjson[calltwo[0].steps].lw, cs, ml);
                }

                let wmvalue = 0;
                const txnid = uuidv4();
                const dataFormatada = moment().toISOString();
                let valorganho = r2(cs * ml * multiplicador);
                let valorganhonowm = cs * ml * multiplicador;

                if (bonusjson[calltwo[0].steps].rwm != null) {
                    wmvalue = await returnrwm(bonusjson[calltwo[0].steps].rwm);
                    valorganho = r2(valorganho * wmvalue);
                }

                const betPassoBonus = calltwo[0].steps === Object.keys(bonusjson).length - 1 ? bet : 0;
                const newbalance = r2(saldoatual - betPassoBonus + valorganho);

                console.log("[DBG] btrfly bonus pre-attaw");
                await butterflyblossomfunctions.attawcall(calltwo[0].id, valorganho);
                await butterflyblossomfunctions.attsaldobyatk(token, newbalance);
                await butterflyblossomfunctions.atualizardebitado(token, betPassoBonus);
                await butterflyblossomfunctions.atualizarapostado(token, betPassoBonus);

                if (calltwo[0].steps > 0) {
                    await allfunctions.subtrairstepscall(resultadospin.idcall);
                }

                if (bonusjson[calltwo[0].steps].fs.hasOwnProperty("aw")) {
                    bonusjson[calltwo[0].steps].fs["aw"] = (await allfunctions.getcallbyid(resultadospin.idcall))[0].aw;
                }

                let json = {
                    dt: {
                        si: {
                            wp: bonusjson[calltwo[0].steps].wp,
                            lw: bonusjson[calltwo[0].steps].lw,
                            orl: bonusjson[calltwo[0].steps].orl,
                            wm: wmvalue,
                            rwm: bonusjson[calltwo[0].steps].rwm,
                            wabm: valorganhonowm,
                            fs: bonusjson[calltwo[0].steps].fs,
                            sc: bonusjson[calltwo[0].steps].sc,
                            wppr: bonusjson[calltwo[0].steps].wppr,
                            gwt: -1,
                            fb: null,
                            ctw: valorganho,
                            pmt: null,
                            cwc: 0,
                            fstc: null,
                            pcwc: 0,
                            rwsp: bonusjson[calltwo[0].steps].rwsp,
                            hashr: "0:1;1;9;7;7#11;11;5;5;9#9;8;3;1;4#7;6;1;9;11#MV#15.0#MT#1#MG#0#",
                            ml: ml,
                            cs: cs,
                            rl: bonusjson[calltwo[0].steps].rl,
                            sid: "1767591680813235712",
                            psid: "1767591680813235712",
                            st: bonusjson[calltwo[0].steps].st,
                            nst: bonusjson[calltwo[0].steps].nst,
                            pf: 1,
                            aw: (await allfunctions.getcallbyid(resultadospin.idcall))[0].aw,
                            wid: 0,
                            wt: "C",
                            wk: "0_C",
                            wbn: null,
                            wfg: null,
                            blb: saldoatual,
                            blab: newbalance,
                            bl: newbalance,
                            tb: betPassoBonus,
                            tbb: betPassoBonus,
                            tw: valorganho,
                            np: r2(valorganho - betPassoBonus),
                            ocr: null,
                            mr: null,
                            ge: [2, 1, 11],
                        },
                    },
                    err: null,
                };

                console.log("[DBG] btrfly bonus pre-cb");
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
                        bet: betPassoBonus,
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
                console.log("[DBG] btrfly bonus pos-cb");
                await allfunctions.savejsonspin(user[0].id, JSON.stringify(json), gamename);
                console.log("[DBG] btrfly bonus pre-send");
                res.send(json);
                console.log("[DBG] btrfly bonus sent");
            }
            if (!res.headersSent) {
                console.log('[DBG] btrfly SEM RAMO ' + JSON.stringify(resultadospin));
                const ultimo = await allfunctions.getSpinByPlayerId(user[0].id);
                res.send(JSON.parse(ultimo[0].json));
            }
        } catch (error) {
            console.log('[DBG] catch: ' + (error as any).message);
            logger.error(error);
            // Sempre responder, senão o jogo fica girando para sempre
            if (!res.headersSent) {
               res.status(500).send({ dt: null, err: { cd: "500", msg: "Internal error", tid: "ERR500" } })
            }
        }
    },
};
