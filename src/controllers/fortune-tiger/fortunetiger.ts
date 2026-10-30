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

const FATOR_NORMAL = 0.9417
const FATOR_VITRINE = 1.2795
const CAP_MULT = 2500

const SCATTER = "8"
const WILD = "0"
const LINHAS: number[][] = paytable.lines as unknown as number[][]
const N_LINHAS = LINHAS.length
const PAY_SCALE: number = paytable.payScale
const SIMBOLOS = paytable.symbols as Record<string, { pay3: number }>

const r2 = (v: number) => Math.round((Number(v) + Number.EPSILON) * 100) / 100
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

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
         res.status(500).send({
            dt: null,
            err: { cd: "500", msg: "Internal error", tid: "FTIGER" },
         })
      }
   },

   async spin(req: Request, res: Response) {
      const cs: number = Number(req.body.cs)
      const ml: number = Number(req.body.ml)
      const token = req.body.atk
      const gamename = "fortune-tiger"

      try {
         const user = await fortunefunctions.getuserbyatk(token)
         const bet: number = r2(cs * ml * 5)
         let saldoatual: number = Number(user[0].saldo)

         const fator = user[0].isinfluencer === 1 ? FATOR_VITRINE : FATOR_NORMAL

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

         const checkuserbalance = await axios({
            maxBodyLength: Infinity,
            method: "POST",
            url: `${agent[0].callbackurl}gold_api/user_balance`,
            headers: { "Content-Type": "application/json" },
            data: { user_code: user[0].username },
         })

         if (checkuserbalance.data.user_balance != null) {
            saldoatual = Number(checkuserbalance.data.user_balance)
         }
         if (
            checkuserbalance.data.msg === "INVALID_USER" ||
            checkuserbalance.data.msg === "INSUFFICIENT_USER_FUNDS"
         ) {
            res.send(await notcashtiger.notcash(saldoatual, cs, ml))
            return false
         }

         if (saldoatual < bet) {
            res.send(await notcashtiger.notcash(saldoatual, cs, ml))
            return false
         }

         // ---------------- resultado ----------------
         const grade = sortearGrade()
         const base = avaliarLinhas(grade)
         const gatilhou = grade.filter((s) => s === SCATTER).length >= 3

         let multiplicador = base.pay
         let valorFeature = 0
         const rwsp: Record<string, number> = {}
         const lw: Record<string, number> = {}

         for (const [sym, posicoes] of Object.entries(base.wp)) {
            const mult = SIMBOLOS[sym].pay3
            rwsp[sym] = r2(mult * fator)
            lw[sym] = r2(cs * ml * mult * fator)
            base.wp[sym] = [...new Set(posicoes)]
         }

         if (gatilhou) {
            valorFeature = pick(feature)
            multiplicador += valorFeature
            rwsp[SCATTER] = r2(valorFeature * fator)
            lw[SCATTER] = r2(cs * ml * valorFeature * fator)
            base.wp[SCATTER] = grade
               .map((s, i) => (s === SCATTER ? i : -1))
               .filter((i) => i >= 0)
         }

         let valorganho = r2(cs * ml * multiplicador * fator)
         const teto = r2(bet * CAP_MULT)
         if (valorganho > teto) valorganho = teto

         const newbalance = r2(saldoatual + valorganho - bet)

         await fortunefunctions.attsaldobyatk(token, newbalance)
         await fortunefunctions.atualizardebitado(token, bet)
         await fortunefunctions.atualizarapostado(token, bet)
         await fortunefunctions.atualizarganho(token, valorganho)

         const json: any = {
            dt: {
               si: {
                  wc: valorganho > 0 ? 17 : 31,
                  ist: false,
                  itw: false,
                  fws: gatilhou ? 10 : 0,
                  wp: base.wp,
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
            res.status(500).send({
               dt: null,
               err: { cd: "500", msg: "Internal error", tid: "FTIGER" },
            })
         }
      }
   },
}