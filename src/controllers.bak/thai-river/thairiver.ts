import { Request, Response } from "express"
import axios from "axios"
import logger from "../../logger"
import * as crypto from "crypto"
import { v4 as uuidv4 } from "uuid"
import moment from "moment"
import "dotenv/config"
// IMPORT FUNCTIONS
import { emitirEventoInterno } from "../../serverEvents"
import allfunctions from "../../functions/allfunctions"
import apicontroller from "../apicontroller"
import thairiverfunctions from "../../functions/thai-river/riverfunctions"
// IMPORT LINHAS
import linhaperdariver from "../../jsons/thai-river/linhaperdariver"
import linhabonusbikini from "../../jsons/bikini-paradise/linhabonusbikini"
import notcashriver from "../../jsons/thai-river/notcashriver"
import linhaganhoriver from "../../jsons/thai-river/linhaganhoriver"

// Arredonda dinheiro para 2 casas (evita 123.19999999999999)
const r2 = (v: number) => Math.round((Number(v) + Number.EPSILON) * 100) / 100


const stepsStorage: { [key: string]: number } = {}

async function lwchange(json1: { [key: string]: any }, json2: { [key: string]: any }, cs: number, ml: number) {
   for (let chave in json1) {
      if (json1.hasOwnProperty(chave)) {
         const valor = json1[chave]
         const ganho = cs * ml * parseFloat(valor)
         for (let chave2 in json2) {
            if (json2.hasOwnProperty(chave2)) {
               json2[chave] = ganho
            }
         }
      }
   }
}

async function countrwsp(json: { [key: string]: any }) {
   let multiplicador = 0
   for (let i = 1; i <= 25; i++) {
      const chave = i.toString()
      if (json.hasOwnProperty(chave)) {
         multiplicador += parseFloat(json[chave])
      }
   }
   return multiplicador
}

async function gerarNumeroUnico() {
   return crypto.randomBytes(8).toString("hex")
}

async function returnrwm(json: { [key: string]: any }) {
   let value = 0
   for (let chave in json) {
      if (json.hasOwnProperty(chave)) {
         value += parseFloat(json[chave])
      }
   }
   return value
}

function getSteps(token: string, gamename: string): number {
   const key = `${token}:${gamename}`
   return stepsStorage[key] || 0
}

function setSteps(token: string, gamename: string, steps: number) {
   const key = `${token}:${gamename}`
   stepsStorage[key] = steps
}

function incrementSteps(token: string, gamename: string) {
   const key = `${token}:${gamename}`
   stepsStorage[key] = (stepsStorage[key] || 0) + 1
}

function resetSteps(token: string, gamename: string) {
   const key = `${token}:${gamename}`
   delete stepsStorage[key]
}

export default {
   async getriver(req: Request, res: Response) {
      try {
         const token = req.body.atk
         const gamename = "thai-river"
         const user = await allfunctions.getuserbyatk(token)
         logger.info("[+] Usuario logado: " + user[0].username)
         const jsonprimay = await allfunctions.getSpinByPlayerId(user[0].id)
         const jsoninicial = await allfunctions.getjsonprimary(gamename)
         if (jsonprimay.length === 0) {
            await allfunctions.createOrUpdateSpin(user[0].id, gamename, jsoninicial[0].json)
         } else if (jsonprimay[0].game_code === gamename) {
            logger.info("[+] Json Recuperado Do Ultimo Spin.")
         } else {
            await allfunctions.createOrUpdateSpin(user[0].id, gamename, jsoninicial[0].json)
         }
         const json = await allfunctions.getSpinByPlayerId(user[0].id)
         const jsonformatado = JSON.parse(json[0].json)
         res.send({
            dt: {
               fb: { is: true, bm: 75, t: 0.6 },
               wt: { mw: 3.0, bw: 5.0, mgw: 15.0, smgw: 35.0 },
               maxwm: 7500,
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
      let cs: number = parseFloat(req.body.cs)
      let ml: number = parseFloat(req.body.ml)
      const token = req.body.atk

      try {
         const user = await thairiverfunctions.getuserbyatk(token)
         let bet: number = r2(cs * ml * 20)
         let saldoatual: number = Number(user[0].saldo)
         const gamename = "thai-river"

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
         if (checkuserbalance.data.msg === "INVALID_USER" || checkuserbalance.data.msg === "INSUFFICIENT_USER_FUNDS") {
            res.send(await notcashriver.notcash(saldoatual, cs, ml))
            return
         }

         const retornado = user[0].valorganho
         const valorapostado = user[0].valorapostado

         const rtp = (retornado / valorapostado) * 100

         if (saldoatual < bet) {
            res.send(await notcashriver.notcash(saldoatual, cs, ml))
            return
         }

         let steps = getSteps(token, gamename)
         // So o passo 0 de uma rodada cobra a aposta. Nos passos de cascata o bet ja
         // foi pago no inicio da rodada, por isso tb=0 e o callback vai com bet=0.
         const primeiroPasso = steps === 0
         const betPasso = primeiroPasso ? bet : 0

         const resultadospin = await allfunctions.calcularganho(bet, saldoatual, token, gamename)

         if (steps > 0) {
            resultadospin.result = "ganho"
         }

         if (resultadospin.result === "bonus") {
            resultadospin.result = "ganho"
         }

         // NAO converter perda em ganho aqui: o ramo de perda abaixo tem de correr.
         if (resultadospin.result === "perda") {
            let newbalance = r2(saldoatual - bet)
            await thairiverfunctions.attsaldobyatk(token, newbalance)
            await thairiverfunctions.atualizardebitado(token, bet)
            await thairiverfunctions.atualizarapostado(token, bet)
            const perdajson = await linhaperdariver.linhaperda()

            let json = {
               dt: {
                  si: {
                     sc: perdajson.sc,
                     wbwp: perdajson.wbwp,
                     wp: null,
                     twp: perdajson.twp,
                     lw: null,
                     trl: perdajson.trl,
                     torl: perdajson.torl,
                     bwp: perdajson.bwp,
                     now: perdajson.now,
                     nowpr: perdajson.nowpr,
                     snww: null,
                     esb: perdajson.esb,
                     ebb: perdajson.ebb,
                     es: perdajson.es,
                     eb: perdajson.eb,
                     fs: null,
                     rs: null,
                     ssaw: 0.0,
                     ptbr: null,
                     tptbr: null,
                     orl: perdajson.orl,
                     gwt: 0,
                     ctw: 0.0,
                     pmt: null,
                     cwc: 0,
                     fstc: null,
                     pcwc: 0,
                     rwsp: null,
                     hashr: null,
                     fb: null,
                     ml: ml,
                     cs: cs,
                     rl: perdajson.rl,
                     sid: "0",
                     psid: "0",
                     st: 1,
                     nst: 1,
                     pf: 0,
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
                     ge: null,
                  },
               },
               err: null,
            }

            await allfunctions.savejsonspin(user[0].id, JSON.stringify(json), gamename)
            const txnid = uuidv4()
            const dataFormatada = moment().toISOString()

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
            })
            res.send(json)
            return
         }

         if (resultadospin.result === "ganho") {
            try {
               const userId = user[0].id

               // Recuperar a linha de ganho do banco de dados
               let linhaGanhoAnterior = await thairiverfunctions.obterLinhaGanho(userId, gamename)

               // Se houver um ganho anterior, use a linha armazenada, caso contrário, gere uma nova
               let numeroAleatorio
               if (linhaGanhoAnterior !== null && linhaGanhoAnterior !== undefined) {
                  numeroAleatorio = linhaGanhoAnterior
               } else {
                  // numeroAleatorio = 3;
                  numeroAleatorio = Math.floor(Math.random() * 34) + 1 // Supondo que maxLinhas seja o número máximo de linhas disponíveis
                  linhaGanhoAnterior = numeroAleatorio // Armazenar a nova linha de ganho
               }

               console.log("Linha de ganho escolhida: " + numeroAleatorio)

               const ganhojson = await linhaganhoriver.linhaganho(numeroAleatorio)

               // Verificar se ganhojson não é nulo ou indefinido
               if (!ganhojson) {
                  throw new Error("Dados de ganho inválidos")
               }

               const multplicador = await countrwsp(ganhojson[steps].rwsp || 0)
               await lwchange(ganhojson[steps].rwsp, ganhojson[steps].lw, cs, ml)

               let valorganho = r2(cs * ml * multplicador)
               let wmvalue = 0
               console.log("VALOR GANHO " + valorganho)

               // Verificar se saldoatual e bet são válidos
               if (typeof saldoatual !== "number" || typeof bet !== "number") {
                  throw new Error("Saldo ou aposta inválidos")
               }

               // So desconta o bet no primeiro passo da rodada
               let newbalance = primeiroPasso
                  ? r2(saldoatual - bet + valorganho)
                  : r2(saldoatual + valorganho)

               // Atualizar saldo; debito e apostado so contam no primeiro passo
               await thairiverfunctions.attsaldobyatk(token, newbalance)
               if (primeiroPasso) {
                  await thairiverfunctions.atualizardebitado(token, bet)
                  await thairiverfunctions.atualizarapostado(token, bet)
               }
               await thairiverfunctions.atualizarganho(token, valorganho)

               let json = {
                  dt: {
                     si: {
                        sc: ganhojson[steps].sc,
                        wbwp: ganhojson[steps].wbwp,
                        wp: ganhojson[steps].wp,
                        twp: ganhojson[steps].twp,
                        lw: ganhojson[steps].lw,
                        trl: ganhojson[steps].trl,
                        torl: ganhojson[steps].torl,
                        bwp: ganhojson[steps].bwp,
                        now: ganhojson[steps].now,
                        nowpr: ganhojson[steps].nowpr,
                        snww: ganhojson[steps].snww,
                        esb: ganhojson[steps].esb,
                        ebb: ganhojson[steps].ebb,
                        es: ganhojson[steps].es,
                        eb: ganhojson[steps].eb,
                        fs: ganhojson[steps].fs,
                        rs: ganhojson[steps].rs,
                        ssaw: valorganho,
                        ptbr: ganhojson[steps].ptbr,
                        tptbr: ganhojson[steps].tptbr,
                        orl: ganhojson[steps].orl,
                        gwt: -1,
                        ctw: valorganho,
                        pmt: ganhojson[steps].pmt,
                        cwc: 1,
                        fstc: ganhojson[steps].fstc,
                        pcwc: ganhojson[steps].pcwc,
                        rwsp: ganhojson[steps].rwsp,
                        hashr: "0:6;3;2;6;11;12#9;3;3;6;11;12#9;4;6;7;12;8#8;4;6;7;12;10#11;6;7;12;7;11#R#6#001422233031#MV#12.0#MT#1#MG#6.0#",
                        fb: ganhojson[steps].fb,
                        ml: ml,
                        cs: cs,
                        rl: ganhojson[steps].rl,
                        sid: "1838871119160868352",
                        psid: "1838871119160868352",
                        st: ganhojson[steps].st,
                        nst: ganhojson[steps].nst,
                        pf: ganhojson[steps].pf,
                        aw: valorganho,
                        wid: 0,
                        wt: "C",
                        wk: "0_C",
                        wbn: null,
                        wfg: null,
                        blb: saldoatual,
                        blab: primeiroPasso ? r2(saldoatual - bet) : saldoatual,
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
               }

               // Salvar os dados do spin
               await allfunctions.savejsonspin(user[0].id, JSON.stringify(json), gamename)

               const txnid = uuidv4()
               const dataFormatada = moment().toISOString()

               // Salvar a linha de ganho atual no banco de dados
               await thairiverfunctions.atualizarLinhaGanho(userId, gamename, numeroAleatorio)
               logger.info("LINHA DE GANHO SALVA NO BD: " + numeroAleatorio)

               // Incrementar e verificar steps
               incrementSteps(token, gamename)
               if (getSteps(token, gamename) >= Object.keys(ganhojson).length) {
                  resetSteps(token, gamename)
                  await thairiverfunctions.atualizarLinhaGanho(userId, gamename, null) // Resetar a linha de ganho quando os steps são resetados
               }

               // Callback para o jogo: bet=0 nos passos de cascata, senao o site cobra duas vezes
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
               })

               res.send(json)
               return
            } catch (error) {
               if (error instanceof Error) {
                  logger.error(error.message)
               } else {
                  logger.error("Ocorreu um erro desconhecido")
               }
               res.status(500).send({
                  err: {
                     type: "InternalError",
                     message: "Ocorreu um erro desconhecido, tente novamente. (codigo de erro:G1008)",
                  },
               })
            }
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
