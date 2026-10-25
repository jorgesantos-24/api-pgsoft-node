"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATRASOS = void 0;
exports.treinoAtt = treinoAtt;
exports.pararTreino = pararTreino;
const index_1 = __importDefault(require("./logger/index"));
// "Treino de att": em vez de mandar o att 5 vezes e calar, o servidor repete
// ate o motor do jogo responder com o verifySession. Num boot lento (cache fria)
// o motor so fica pronto depois dos 6s e, sem isto, ficava preso no botao de girar.
// Fica num modulo proprio para nao criar import circular entre indexprod e sessioncontroller.
exports.ATRASOS = [0, 300, 700, 1200, 2000, 3000, 4500, 6500, 9000, 12000, 16000, 20000];
const treinos = new Map();
function treinoAtt(socket, tk, att, idx = 0) {
    const t = setTimeout(() => {
        if (!socket.connected) {
            treinos.delete(socket.id);
            return;
        }
        socket.emit("att", att);
        index_1.default.info("[att] envio " + (idx + 1) + "/" + exports.ATRASOS.length + " tk=" + tk);
        if (idx + 1 < exports.ATRASOS.length) {
            treinoAtt(socket, tk, att, idx + 1);
        }
        else {
            treinos.delete(socket.id);
        }
    }, exports.ATRASOS[idx]);
    treinos.set(socket.id, { tk, t });
}
function pararTreino(tk) {
    for (const [sid, v] of treinos) {
        if (v.tk === tk) {
            clearTimeout(v.t);
            treinos.delete(sid);
            index_1.default.info("[att] treino parado por verifySession tk=" + tk);
        }
    }
}
