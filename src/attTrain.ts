import logger from "./logger/index"

// "Treino de att": em vez de mandar o att 5 vezes e calar, o servidor repete
// ate o motor do jogo responder com o verifySession. Num boot lento (cache fria)
// o motor so fica pronto depois dos 6s e, sem isto, ficava preso no botao de girar.
// Fica num modulo proprio para nao criar import circular entre indexprod e sessioncontroller.

export const ATRASOS = [0, 300, 700, 1200, 2000, 3000, 4500, 6500, 9000, 12000, 16000, 20000]

const treinos = new Map<string, { tk: string; t: NodeJS.Timeout }>()

export function treinoAtt(socket: any, tk: string, att: any, idx = 0) {
   const t = setTimeout(() => {
      if (!socket.connected) {
         treinos.delete(socket.id)
         return
      }

      socket.emit("att", att)
      logger.info("[att] envio " + (idx + 1) + "/" + ATRASOS.length + " tk=" + tk)

      if (idx + 1 < ATRASOS.length) {
         treinoAtt(socket, tk, att, idx + 1)
      } else {
         treinos.delete(socket.id)
      }
   }, ATRASOS[idx])

   treinos.set(socket.id, { tk, t })
}

export function pararTreino(tk: string) {
   for (const [sid, v] of treinos) {
      if (v.tk === tk) {
         clearTimeout(v.t)
         treinos.delete(sid)
         logger.info("[att] treino parado por verifySession tk=" + tk)
      }
   }
}