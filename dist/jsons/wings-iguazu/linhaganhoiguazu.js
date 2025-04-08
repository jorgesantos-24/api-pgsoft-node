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
            console.log("linha de ganho " + bet);
            const jsons = {
                [1]: {
                    "wp": {
                        "5": [
                            1,
                            5,
                            9
                        ],
                        "6": [
                            1,
                            6,
                            9
                        ],
                        "8": [
                            2,
                            6,
                            9
                        ]
                    },
                    "lw": {
                        "5": 3.0,
                        "6": 3.0,
                        "8": 3.0
                    },
                    "orl": [
                        4,
                        7,
                        7,
                        99,
                        5,
                        7,
                        0,
                        6,
                        8,
                        7,
                        8,
                        99
                    ],
                    "gm": 1,
                    "sc": 0,
                    "ssaw": 9.00,
                    "crtw": 0.0,
                    "imw": false,
                    "fs": null,
                    "gwt": -1,
                    "fb": null,
                    "ctw": 9.0,
                    "pmt": null,
                    "cwc": 1,
                    "fstc": null,
                    "pcwc": 1,
                    "rwsp": {
                        "5": 5.0,
                        "6": 5.0,
                        "8": 5.0
                    },
                    "hashr": "0:4;5;8#7;7;7#7;0;8#99;6;99#R#7#011121#MV#6.0#MT#1#R#7#011221#MV#6.0#MT#1#R#7#021221#MV#6.0#MT#1#MG#9.0#",
                    "ml": 2,
                    "cs": 0.3,
                    "rl": [
                        4,
                        7,
                        7,
                        99,
                        5,
                        7,
                        0,
                        6,
                        8,
                        7,
                        8,
                        99
                    ],
                    "sid": "1836234125788249600",
                    "psid": "1836234125788249600",
                    "st": 1,
                    "nst": 1,
                    "pf": 1,
                    "aw": 9.00,
                    "wid": 0,
                    "wt": "C",
                    "wk": "0_C",
                    "wbn": null,
                    "wfg": null,
                    "blb": 99988.00,
                    "blab": 99982.00,
                    "bl": 99991.00,
                    "tb": 6.00,
                    "tbb": 6.00,
                    "tw": 9.00,
                    "np": 3.00,
                    "ocr": null,
                    "mr": null,
                    "ge": [
                        1,
                        11
                    ]
                },
            };
            return jsons[1];
        });
    },
};
