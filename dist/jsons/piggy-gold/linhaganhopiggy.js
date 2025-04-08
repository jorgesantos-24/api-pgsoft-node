"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    linhaganho(bet) {
        return __awaiter(this, void 0, void 0, function* () {
            const numeroAleatorio = Math.floor(Math.random() * 401) + 1;
            console.log("linha de ganho " + numeroAleatorio);
            const jsons = {
                [0]: {
                    wp: { "1": [0, 1, 2] },
                    lw: { "1": 3.0 },
                    frl: [3, 6, 3, 4, 0, 2, 5, 6, 3],
                    pc: 6,
                    wm: 2,
                    tnbwm: null,
                    gwt: 2,
                    ctw: 6.0,
                    pmt: null,
                    cwc: 1,
                    fstc: null,
                    pcwc: 1,
                    rwsp: { "1": 5.0 },
                    hashr: "0:6;0;6#R#6#001020#MV#0.6#MT#1#MG#6.0#",
                    fb: null,
                    ml: 2,
                    cs: 0.3,
                    rl: [6, 0, 6],
                    sid: "1836965364233076224",
                    psid: "1836965364233076224",
                    st: 1,
                    nst: 1,
                    pf: 1,
                    aw: 6.0,
                    wid: 0,
                    wt: "C",
                    wk: "0_C",
                    wbn: null,
                    wfg: null,
                    blb: 99994.6,
                    blab: 99994.0,
                    bl: 100000.0,
                    tb: 0.6,
                    tbb: 0.6,
                    tw: 6.0,
                    np: 5.4,
                    ocr: null,
                    mr: null,
                    ge: [3, 11],
                },
            };
            return jsons[0];
        });
    },
};
