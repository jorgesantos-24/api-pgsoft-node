"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitirEventoInterno = emitirEventoInterno;
exports.adicionarListener = adicionarListener;
const events_1 = require("events");
// Crie um EventEmitter para comunicação interna do servidor
const internalEmitter = new events_1.EventEmitter();
// Função para emitir um evento interno
function emitirEventoInterno(evento, dados) {
    internalEmitter.emit(evento, dados);
}
// Função para adicionar um listener para eventos internos
function adicionarListener(evento, listener) {
    internalEmitter.on(evento, listener);
}
