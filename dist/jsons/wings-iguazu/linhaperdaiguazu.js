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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../../logger"));
exports.default = {
    linhaperda() {
        return __awaiter(this, void 0, void 0, function* () {
            const numeroAleatorio = Math.floor(Math.random() * 2) + 1;
            logger_1.default.info('Linha De Perda: ' + numeroAleatorio);
            const jsons = {
                [1]: {
                    "wp": null,
                    "lw": null,
                    "orl": [
                        7,
                        5,
                        5,
                        99,
                        8,
                        8,
                        3,
                        7,
                        2,
                        2,
                        8,
                        99
                    ],
                    "gm": 4,
                    "sc": 0,
                    "ssaw": 0.00,
                    "crtw": 0.0,
                    "imw": false,
                    "fs": null,
                    "gwt": -1,
                    "fb": null,
                    "ctw": 0.0,
                    "pmt": null,
                    "cwc": 0,
                    "fstc": null,
                    "pcwc": 0,
                    "rwsp": null,
                    "hashr": "0:7;8;2#5;8;2#5;3;8#99;7;99#MV#6.0#MT#4#MG#0#",
                    "ml": 2,
                    "cs": 0.3,
                    "rl": [
                        7,
                        5,
                        5,
                        99,
                        8,
                        8,
                        3,
                        7,
                        2,
                        2,
                        8,
                        99
                    ],
                    "sid": "1836234115960995328",
                    "psid": "1836234115960995328",
                    "st": 1,
                    "nst": 1,
                    "pf": 1,
                    "aw": 0.00,
                    "wid": 0,
                    "wt": "C",
                    "wk": "0_C",
                    "wbn": null,
                    "wfg": null,
                    "blb": 99994.00,
                    "blab": 99988.00,
                    "bl": 99988.00,
                    "tb": 6.00,
                    "tbb": 6.00,
                    "tw": 0.00,
                    "np": -6.00,
                    "ocr": null,
                    "mr": null,
                    "ge": [
                        1,
                        3,
                        11
                    ]
                },
                [2]: { "wp": null,
                    "lw": null,
                    "orl": [
                        5,
                        2,
                        5,
                        99,
                        5,
                        4,
                        2,
                        3,
                        6,
                        3,
                        3,
                        99
                    ],
                    "gm": 4,
                    "sc": 0,
                    "ssaw": 0.00,
                    "crtw": 0.0,
                    "imw": false,
                    "fs": null,
                    "gwt": -1,
                    "fb": null,
                    "ctw": 0.0,
                    "pmt": null,
                    "cwc": 0,
                    "fstc": null,
                    "pcwc": 0,
                    "rwsp": null,
                    "hashr": "0:5;5;6#2;4;3#5;2;3#99;3;99#MV#6.0#MT#4#MG#0#",
                    "ml": 2,
                    "cs": 0.3,
                    "rl": [
                        5,
                        2,
                        5,
                        99,
                        5,
                        4,
                        2,
                        3,
                        6,
                        3,
                        3,
                        99
                    ],
                    "sid": "1836234101880716800",
                    "psid": "1836234101880716800",
                    "st": 1,
                    "nst": 1,
                    "pf": 1,
                    "aw": 0.00,
                    "wid": 0,
                    "wt": "C",
                    "wk": "0_C",
                    "wbn": null,
                    "wfg": null,
                    "blb": 100000.00,
                    "blab": 99994.00,
                    "bl": 99994.00,
                    "tb": 6.00,
                    "tbb": 6.00,
                    "tw": 0.00,
                    "np": -6.00,
                    "ocr": null,
                    "mr": null,
                    "ge": [
                        1,
                        3,
                        11
                    ] },
            };
            return jsons[numeroAleatorio];
        });
    },
};
