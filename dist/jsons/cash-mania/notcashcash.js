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
    notcash(saldo, cs, ml) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                dt: {
                    si: {
                        wp: null,
                        lw: null,
                        twbm: 0,
                        fs: null,
                        imw: false,
                        rv: [0.05, 5, 0.25, 1, 0, 5, 5, 0.5, 2.5],
                        orl: null,
                        orv: null,
                        rsrl: null,
                        rsrv: null,
                        nfp: null,
                        gwt: -1,
                        fb: null,
                        ctw: 0,
                        pmt: null,
                        cwc: 0,
                        fstc: null,
                        pcwc: 0,
                        rwsp: null,
                        hashr: null,
                        ml: ml,
                        cs: cs,
                        rl: [1, 5, 2, 1, 0, 4, 5, 3, 4],
                        sid: "1782519894961689090",
                        psid: "1782519894961689090",
                        st: 1,
                        nst: 1,
                        pf: 1,
                        aw: 0,
                        wid: 0,
                        wt: "C",
                        wk: "0_C",
                        wbn: null,
                        wfg: null,
                        blb: saldo,
                        blab: saldo,
                        bl: saldo,
                        tb: 0,
                        tbb: 0,
                        tw: 0,
                        np: 0,
                        ocr: null,
                        mr: null,
                        ge: [1, 11],
                    },
                },
                err: { cd: "3202", msg: "Not enough cash.", tid: "RACEVR16" },
            };
        });
    },
};
