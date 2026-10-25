import { Request, Response } from "express"
import axios from "axios"
import logger from "../../logger"
import * as crypto from "crypto"
import { v4 } from "uuid"
import moment from "moment"
import allfunctions from "../../functions/allfunctions"
import apicontroller from "../apicontroller"
import { emitirEventoInterno, adicionarListener } from "../../serverEvents"
import "dotenv/config"
import fortunedragonfunctions from "../../functions/fortune-dragon/fortunedragonfunctions"
import notcashdragon from "../../jsons/fortune-dragon/notcashdragon"
import linhaperdadragon from "../../jsons/fortune-dragon/linhaperdadragon"
import linhaganhodragon from "../../jsons/fortune-dragon/linhaganhodragon"
import linhabonusdragon from "../../jsons/fortune-dragon/linhabonusdragon"

// Arredonda dinheiro para 2 casas (evita 123.19999999999999)
const r2 = (v: number) => Math.round((Number(v) + Number.EPSILON) * 100) / 100


export default {
   async getdragon(req: Request, res: Response) {
      try {
         const token = req.body.atk;
         const gamename = "fortune-dragon";
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
               fb: { is: false, bm: 5, t: 0.15 },
               wt: { mw: 5.0, bw: 20.0, mgw: 35.0, smgw: 50.0 },
               maxwm: 2500,
               cs: [0.08, 0.8, 3.0, 10.0],
               ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
               mxl: 5,
               bl: user[0].saldo,
               inwe: false,
               iuwe: false,
               ls: {
                  si: jsonformatado.dt.si,
               },
               cc: "BRL",
            },
            err: null,
         })
      } catch (error) {
         logger.error(error)
         // Sempre responder, senão o jogo fica girando para sempre
         if (!res.headersSent) {
            res.status(500).send({ dt: null, err: { cd: "500", msg: "Internal error", tid: "ERR500" } })
         }
      }
   },
   async spin(req: Request, res: Response) {
      let cs: number = Number(req.body.cs)
      let ml: number = Number(req.body.ml)
      const token = req.body.atk

      async function lwchange(json1: { [key: string]: any }, json2: { [key: string]: any }, cs: number, ml: number) {
         for (let chave in json1) {
            if (json1.hasOwnProperty(chave)) {
               const valor = json1[chave]
               const ganho = cs * ml * parseFloat(valor)
               // Verifica se a chave existe no segundo JSON
               for (let chave2 in json2) {
                  if (json2.hasOwnProperty(chave2)) {
                     // Altera o valor correspondente no segundo JSON
                     json2[chave] = ganho
                  }
               }
            }
         }
      }

      async function countrwsp(json: { [key: string]: any }) {
         let multplicador: number = 0
         for (let i = 1; i <= 10; i++) {
            const chave = i.toString()
            if (json.hasOwnProperty(chave)) {
               multplicador = multplicador + parseFloat(json[chave])
            }
         }
         return multplicador
      }
      async function gerarNumeroUnico() {
         return crypto.randomBytes(8).toString("hex")
      }
      async function verificarValores(json: { [key: string]: any }): Promise<string[]> {
         const numerosVerificados: string[] = []
         for (const chaveMT in json.mf.mt) {
            const valorMS = json.mf.ms[chaveMT]
            if (json.mf.ms[chaveMT] === true) {
               numerosVerificados.push(json.mf.mt[chaveMT])
            }
         }
         return numerosVerificados
      }
      try {
         const user = await fortunedragonfunctions.getuserbyatk(token)
         let bet: number = r2(cs * ml * 5)
         let saldoatual: number = Number(user[0].saldo)
         const gamename = "fortune-dragon"

         emitirEventoInterno("att", {
            token: token,
            username: user[0].username,
            bet: bet,
            saldo: saldoatual,
            rtp: user[0].rtp,
            agentid: user[0].agentid,
            gamecode: gamename,
         })
         const agent = await allfunctions.getagentbyid(user[0].agentid)

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
         })

         // saldo do operador (TUGAS) e a unica fonte de verdade
         if (checkuserbalance.data.user_balance != null) saldoatual = Number(checkuserbalance.data.user_balance)
         if (checkuserbalance.data.msg === "INVALID_USER") {
            res.send(await notcashdragon.notcash(saldoatual, cs, ml))
            return false
         } else if (checkuserbalance.data.msg === "INSUFFICIENT_USER_FUNDS") {
            res.send(await notcashdragon.notcash(saldoatual, cs, ml))
            return false
         }

         const retornado = user[0].valorganho
         const valorapostado = user[0].valorapostado

         const rtp = (retornado / valorapostado) * 100

         console.log("RTP ATUAL " + rtp)

         console.log("BET ATUAL " + bet)

         const resultadospin = await allfunctions.calcularganho(bet, saldoatual, token, gamename)
         if (resultadospin.result === "perda" || resultadospin.result === "ganho") {
            if (saldoatual < bet) {
               const semsaldo = await notcashdragon.notcash(saldoatual, cs, ml)
               res.send(semsaldo)
               return false
            }
         }

         if (resultadospin.result === "perda") {
            let newbalance = r2(saldoatual - bet)
            await fortunedragonfunctions.attsaldobyatk(token, newbalance)
            await fortunedragonfunctions.atualizardebitado(token, bet)
            await fortunedragonfunctions.atualizarapostado(token, bet)
            const perdajson = await linhaperdadragon.linhaperda()

            let json: any = {
               dt: {
                  si: {
                     wp: null,
                     lw: null,
                     gm: 1,
                     it: perdajson.it,
                     orl: perdajson.rl,
                     fs: null,
                     mf: perdajson.mf,
                     ssaw: 0.0,
                     crtw: 0.0,
                     imw: false,
                     gwt: -1,
                     fb: null,
                     ctw: 0.0,
                     pmt: null,
                     cwc: 0,
                     fstc: null,
                     pcwc: 0,
                     rwsp: null,
                     hashr: "0:2;5;3#4;5;3#3;4;5#MV#3.0#MT#1#MG#0#",
                     ml: ml,
                     cs: cs,
                     rl: perdajson.rl,
                     sid: "1762525206562143744",
                     psid: "1762525206562143744",
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
            }

            await allfunctions.savejsonspin(user[0].id, JSON.stringify(json), gamename);
            const txnid = v4()
            const dataFormatada: string = moment().toISOString()

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
            })
            res.send(json)
         }
         if (resultadospin.result === "ganho") {
            const ganhojson = await linhaganhodragon.linhaganho(bet)
            const multplicador = await countrwsp(ganhojson.rwsp)
            await lwchange(ganhojson.rwsp, ganhojson.lw, cs, ml)
            const mulplicadores = await verificarValores(ganhojson)
            let valorganho = r2(cs * ml * multplicador)

            if (mulplicadores.length > 0) {
               valorganho = r2(cs * ml * multplicador * parseFloat(mulplicadores[0]))
            }

            const newbalance = r2(saldoatual + valorganho - bet)
            await fortunedragonfunctions.attsaldobyatk(token, newbalance)
            await fortunedragonfunctions.atualizardebitado(token, bet)
            await fortunedragonfunctions.atualizarapostado(token, bet)
            await fortunedragonfunctions.atualizarganho(token, valorganho)

            let json: any = {
               dt: {
                  si: {
                     wp: ganhojson.wp,
                     lw: ganhojson.lw,
                     gm: 1,
                     it: ganhojson.it,
                     orl: ganhojson.orl,
                     fs: null,
                     mf: ganhojson.mf,
                     ssaw: valorganho,
                     crtw: 0.0,
                     imw: false,
                     gwt: -1,
                     fb: null,
                     ctw: valorganho,
                     pmt: null,
                     cwc: 2,
                     fstc: null,
                     pcwc: 2,
                     rwsp: ganhojson.rwsp,
                     hashr: "0:5;6;3#5;0;3#4;4;4#R#4#021222#MV#3.0#MT#1#MG#6.0#",
                     ml: ml,
                     cs: cs,
                     rl: ganhojson.rl,
                     sid: "1762558970373799424",
                     psid: "1762558970373799424",
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
                     // saldo depois da aposta, ANTES do premio: o motor mostra o
                     // desconto e so soma o ganho quando o premio aparece no ecra
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
            }

            await allfunctions.savejsonspin(user[0].id, JSON.stringify(json), gamename);

            const txnid = v4()
            const dataFormatada: string = moment().toISOString()

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
            })
            res.send(json)
         }
         if (resultadospin.result === "bonus" && resultadospin.gamecode === "fortune-dragon") {
            const bonusjson = await linhabonusdragon.linhabonus(resultadospin.json)
            let call = await allfunctions.getcallbyid(resultadospin.idcall)

            if (call[0].steps === null && call[0].status === "pending") {
               if (saldoatual < bet) {
                  const semsaldo = await notcashdragon.notcash(saldoatual, cs, ml)
                  res.send(semsaldo)
                  return false
               }
            }

            if (call[0].steps === null && call[0].status === "pending") {
               const steps = Object.keys(bonusjson).length - 1
               await allfunctions.updatestepscall(resultadospin.idcall, steps)
            }

            let calltwo = await allfunctions.getcallbyid(resultadospin.idcall)

            if (calltwo[0].steps === 0) {
               await allfunctions.completecall(calltwo[0].id)
            }

            let multplicador = 0

            if (bonusjson[calltwo[0].steps].rwsp != null) {
               multplicador = await countrwsp(bonusjson[calltwo[0].steps].rwsp)
            }
            if (bonusjson[calltwo[0].steps].lw != null) {
               await lwchange(bonusjson[calltwo[0].steps].rwsp, bonusjson[calltwo[0].steps].lw, cs, ml)
            }

            const mulplicadoresjson = await verificarValores(bonusjson[calltwo[0].steps])
            let mulplicadores = 0

            for (let chave in mulplicadoresjson) {
               mulplicadores = mulplicadores + parseFloat(mulplicadoresjson[chave])
            }

            const txnid = v4()
            const dataFormatada: string = moment().toISOString()

            let valorganho = r2(cs * ml * multplicador * mulplicadores)

            const primeiroPasso = calltwo[0].steps === Object.keys(bonusjson).length - 1
            const betPasso = primeiroPasso ? bet : 0

            const newbalance = r2(saldoatual - betPasso + valorganho)

            await fortunedragonfunctions.attawcall(calltwo[0].id, valorganho)

            await fortunedragonfunctions.attsaldobyatk(token, newbalance)
            await fortunedragonfunctions.atualizardebitado(token, betPasso)
            await fortunedragonfunctions.atualizarapostado(token, betPasso)
            await fortunedragonfunctions.atualizarganho(token, valorganho)

            if (calltwo[0].steps > 0) {
               await allfunctions.subtrairstepscall(resultadospin.idcall)
            }
            if (bonusjson[calltwo[0].steps].fs.hasOwnProperty("aw")) {
               bonusjson[calltwo[0].steps].fs["aw"] = (await allfunctions.getcallbyid(resultadospin.idcall))[0].aw
            }

            let json: any = {
               dt: {
                  si: {
                     wp: bonusjson[calltwo[0].steps].wp,
                     lw: bonusjson[calltwo[0].steps].lw,
                     gm: 7,
                     it: bonusjson[calltwo[0].steps].it,
                     orl: bonusjson[calltwo[0].steps].orl,
                     fs: bonusjson[calltwo[0].steps].fs,
                     mf: bonusjson[calltwo[0].steps].mf,
                     ssaw: valorganho,
                     crtw: 0.0,
                     imw: false,
                     gwt: -1,
                     fb: null,
                     ctw: valorganho,
                     pmt: null,
                     cwc: bonusjson[calltwo[0].steps].cwc,
                     fstc: null,
                     pcwc: 0,
                     rwsp: null,
                     hashr: "0:6;5;2#6;5;2#5;7;5#MV#3.0#MT#7#MG#0#",
                     ml: ml,
                     cs: cs,
                     rl: bonusjson[calltwo[0].steps].rl,
                     sid: "1762619032324734464",
                     psid: "1762619032324734464",
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
                     // idem: saldo depois da aposta do passo, antes do premio
                     blab: r2(saldoatual - betPasso),
                     bl: newbalance,
                     tb: betPasso,
                     tbb: betPasso,
                     tw: valorganho,
                     // CORRECCAO 3: o np tem de reflectir a aposta do passo (0 fora do primeiro)
                     np: r2(valorganho - betPasso),
                     ocr: null,
                     mr: null,
                     ge: [2, 11],
                  },
               },
               err: null,
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
                  is_call: true,
                  user_before_balance: user[0].saldo,
                  user_after_balance: newbalance,
                  agent_before_balance: 100,
                  agent_after_balance: 100,
                  created_at: dataFormatada,
               },
            })
            await allfunctions.savejsonspin(user[0].id, JSON.stringify(json), gamename);

            res.send(json)
         }
      } catch (error) {
         logger.error(error)
         // Sempre responder, senão o jogo fica girando para sempre
         if (!res.headersSent) {
            res.status(500).send({ dt: null, err: { cd: "500", msg: "Internal error", tid: "ERR500" } })
         }
      }
   },
}
