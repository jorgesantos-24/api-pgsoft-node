import { Request, Response } from "express"
import axios from "axios"
import logger from "../../logger"
import * as crypto from "crypto"
import { v4 } from "uuid"
import moment from "moment"
import fortunefunctions from "../../functions/fortune-tiger/fortunetigerfunctions"
import allfunctions from "../../functions/allfunctions"
import apicontroller from "../apicontroller"
import { emitirEventoInterno } from "../../serverEvents"
import notcashtiger from "../../jsons/fortune-tiger/notcashtiger"

import strips from "../../jsons/fortune-tiger/strips"
import feature from "../../jsons/fortune-tiger/feature"
import paytable from "../../jsons/fortune-tiger/paytable"

import "dotenv/config"

const FATOR_NORMAL = 0.9878
const FATOR_VITRINE = 1.3422
const CAP_MULT = 2500
const TIMEOUT_OPERADOR = 8000

const SCATTER = "8"
const WILD = "0"
const LINHAS: number[][] = paytable.lines as unknown as number[][]
const N_LINHAS = LINHAS.length
const PAY_SCALE: number = paytable.payScale
const SIMBOLOS = paytable.symbols as Record<string, { pay3: number }>

const r2 = (v: number) => Math.round((Number(v) + Number.EPSILON) * 100) / 100
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

function compensacao(bet: number): number {
   if (bet <= 0.15) return 1.13
   if (bet <= 0.3) return 1.06
   if (bet <= 0.6) return 1.02
   return 1.0
}

function sortearGrade(): string[] {
   const vis: string[] = []
   for (let r = 0; r < 3; r++) {
      const rolo = strips[r]
      const inicio = Math.floor(Math.random() * rolo.length)
      for (let linha = 0; linha < 3; linha++) vis.push(rolo[(inicio + linha) % rolo.length])
   }
   return vis
}

function avaliarLinhas(vis: string[]) {
   let pay = 0
   const wp: Record<string, number[]> = {}

   for (const linha of LINHAS) {
      const [a, b, c] = linha.map((i) => vis[i])
      if (a === SCATTER || b === SCATTER || c === SCATTER) continue

      let sym: string | null = null
      if (a !== WILD) sym = a
      else if (b !== WILD) sym = b
      else if (c !== WILD) sym = c
      else sym = WILD

      const bate = [a, b, c].every((s) => s === sym || s === WILD)
      if (bate) {
         pay += SIMBOLOS[sym!].pay3
         wp[sym!] = [...(wp[sym!] ?? []), ...linha]
      }
   }

   return { pay: (pay * PAY_SCALE) / N_LINHAS, wp }
}

export default {
   async getiger(req: Request, res: Response) {
      try {
         const token = req.body.atk
         const user = await allfunctions.getuserbyatk(token)
         if (!user[0]) {
            res.status(400).send({ dt: null, err: { cd: "401", msg: "Token invalido", tid: "FTIGER" } })
            return false
         }
         logger.info("[+] Usuario logado: " + user[0].username)

         res.send({
            dt: {
               fb: null,
               wt: { mw: 5.0, bw: 20.0, mgw: 35.0, smgw: 50.0 },
               maxwm: CAP_MULT,
               cs: [0.02, 0.2, 1.0, 5.0],
               ml: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
               mxl: 9,
               bl: user[0].saldo,
               inwe: false,
               iuwe: false,
               ls: null,
               cc: "BRL",
            },
            err: null,
         })
      } catch (error) {
         logger.error(error)
         res.status(500).send({ dt: null, err: { cd: "500", msg: "Internal error", tid: "FTIGER" } })
      }
   },

   async spin(req: Request, res: Response) {
      const cs: number = Number(req.body.cs)
      const ml: number = Number(req.body.ml)
      const token = req.body.atk
      const gamename = "fortune-tiger"

      try {
         const user = await fortunefunctions.getuserbyatk(token)
         if (!user[0]) {
            res.status(400).send({ dt: null, err: { cd: "401", msg: "Token invalido", tid: "FTIGER" } })
            return false
         }

         const bet: number = r2(cs * ml * 5)
         let saldoatual: number = Number(user[0].saldo)
         const base = user[0].isinfluencer === 1 ? FATOR_VITRINE : FATOR_NORMAL
         const fator = base * compensacao(bet)

         emitirEventoInterno("att", {
            token,
            username: user[0].username,
            bet,
            saldo: saldoatual,
            rtp: user[0].rtp,
            agentid: user[0].agentid,
            gamecode: gamename,
         })

         const agent = await allfunctions.getagentbyid(user[0].agentid)

         // Operador é a fonte de verdade, mas um timeout não pode matar o giro:
         // tenta duas vezes e, se falhar, segue com o saldo do banco.
         let saldoOperador: number | null = null
         for (let tentativa = 1; tentativa <= 2; tentativa++) {
            try {
               const r = await axios({
                  maxBodyLength: Infinity,
                  method: "POST",
                  timeout: TIMEOUT_OPERADOR,
                  url: `${agent[0].callbackurl}gold_api/user_balance`,
                  headers: { "Content-Type": "application/json" },
                  data: { user_code: user[0].username },
               })

               if (r.data.msg === "INVALID_USER" || r.data.msg === "INSUFFICIENT_USER_FUNDS") {
                  res.send(await notcashtiger.notcash(saldoatual, cs, ml))
                  return false
               }
               if (r.data.user_balance != null) saldoOperador = Number(r.data.user_balance)
               break
            } catch (e: any) {
               logger.warn(`[spin] user_balance falhou (tentativa ${tentativa}): ${e.message}`)
               if (tentativa === 2) logger.warn("[spin] seguindo com o saldo do banco")
            }
         }
         if (saldoOperador !== null) saldoatual = saldoOperador

         if (saldoatual < bet) {
            res.send(await notcashtiger.notcash(saldoatual, cs, ml))
            return false
         }

         // ---------------- resultado ----------------
         const grade = sortearGrade()
         const linha = avaliarLinhas(grade)
         const gatilhou = grade.filter((s) => s === SCATTER).length >= 3

         let multiplicador = linha.pay
         let valorFeature = 0
         const rwsp: Record<string, number> = {}
         const lw: Record<string, number> = {}

         for (const [sym, posicoes] of Object.entries(linha.wp)) {
            const mult = SIMBOLOS[sym].pay3
            rwsp[sym] = r2(mult * fator)
            lw[sym] = r2(bet * ((mult * PAY_SCALE) / N_LINHAS) * fator)
            linha.wp[sym] = [...new Set(posicoes)]
         }

         if (gatilhou) {
            valorFeature = pick(feature)
            multiplicador += valorFeature
            rwsp[SCATTER] = r2(valorFeature * fator)
            lw[SCATTER] = r2(bet * valorFeature * fator)
            linha.wp[SCATTER] = grade
               .map((s, i) => (s === SCATTER ? i : -1))
               .filter((i) => i >= 0)
         }

         let valorganho = r2(bet * multiplicador * fator)
         const teto = r2(bet * CAP_MULT)
         if (valorganho > teto) valorganho = teto
         if (valorganho === 0 && multiplicador > 0) valorganho = 0.01

         const newbalance = r2(saldoatual + valorganho - bet)

         await fortunefunctions.registrarSpin(token, newbalance, bet, valorganho)

         const json: any = {
            dt: {
               si: {
                  wc: valorganho > 0 ? 17 : 31,
                  ist: false,
                  itw: false,
                  fws: gatilhou ? 10 : 0,
                  wp: linha.wp,
                  orl: grade,
                  lw,
                  irs: false,
                  gwt: bet,
                  fb: null,
                  ctw: valorganho,
                  pmt: null,
                  cwc: gatilhou ? 1 : 0,
                  fstc: gatilhou ? { "8": 3 } : null,
                  pcwc: 0,
                  rwsp,
                  hashr: null,
                  ml,
                  cs,
                  rl: grade,
                  sid: Date.now().toString(),
                  psid: Date.now().toString(),
                  st: gatilhou ? 4 : 1,
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
                  np: r2(valorganho - bet),
                  ocr: null,
                  mr: null,
                  ge: [1, 11],
               },
            },
            err: null,
         }

         await allfunctions.savejsonspin(user[0].id, JSON.stringify(json), gamename)

         await apicontroller.callbackgame({
            agent_code: agent[0].agentcode,
            agent_secret: agent[0].secretKey,
            user_code: user[0].username,
            user_balance: newbalance,
            user_total_credit: Number(user[0].valorganho) + valorganho,
            user_total_debit: Number(user[0].valorapostado) + bet,
            game_type: "slot",
            slot: {
               provider_code: "PGSOFT",
               game_code: gamename,
               round_id: crypto.randomBytes(8).toString("hex"),
               type: gatilhou ? "FREE" : "BASE",
               bet,
               win: valorganho,
               txn_id: v4(),
               txn_type: "debit_credit",
               is_buy: false,
               is_call: gatilhou,
               user_before_balance: saldoatual,
               user_after_balance: newbalance,
               agent_before_balance: 100,
               agent_after_balance: 100,
               created_at: moment().toISOString(),
            },
         })

         res.send(json)
      } catch (error) {
         logger.error(error)
         if (!res.headersSent) {
            res.status(500).send({ dt: null, err: { cd: "500", msg: "Internal error", tid: "FTIGER" } })
         }
      }
   },
}