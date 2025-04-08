"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessioncontroller_1 = __importDefault(require("./controllers/sessioncontroller"));
const apicontroller_1 = __importDefault(require("./controllers/apicontroller"));
//CONTROLLERS GAMES
const fortunetiger_1 = __importDefault(require("./controllers/fortune-tiger/fortunetiger"));
const fortuneox_1 = __importDefault(require("./controllers/fortune-ox/fortuneox"));
const fortunemouse_1 = __importDefault(require("./controllers/fortune-mouse/fortunemouse"));
const fortunedragon_1 = __importDefault(require("./controllers/fortune-dragon/fortunedragon"));
const fortunerabbit_1 = __importDefault(require("./controllers/fortune-rabbit/fortunerabbit"));
const bikiniparadise_1 = __importDefault(require("./controllers/bikini-paradise/bikiniparadise"));
const jungledelight_1 = __importDefault(require("./controllers/jungle-dlight/jungledelight"));
const doublefortune_1 = __importDefault(require("./controllers/double-fortune/doublefortune"));
const ganeshagold_1 = __importDefault(require("./controllers/ganesha-gold/ganeshagold"));
const dragontigerluck_1 = __importDefault(require("./controllers/dragon-tiger-luck/dragontigerluck"));
const cashmania_1 = __importDefault(require("./controllers/cash-mania/cashmania"));
const ultimatestriker_1 = __importDefault(require("./controllers/ultimate-striker/ultimatestriker"));
const butterfly_blossom_1 = __importDefault(require("./controllers/btrfly-blossom/butterfly-blossom"));
const luckyclover_1 = __importDefault(require("./controllers/lucky-clover/luckyclover"));
const ninjaraccoon_1 = __importDefault(require("./controllers/ninja-raccoon/ninjaraccoon"));
const prosperftree_1 = __importDefault(require("./controllers/prosper-ftree/prosperftree"));
const chickyrun_1 = __importDefault(require("./controllers/chicky-run/chickyrun"));
const wingsiguazu_1 = __importDefault(require("./controllers/wings-iguazu/wingsiguazu"));
const piggygold_1 = __importDefault(require("./controllers/piggy-gold/piggygold"));
const wildbandito_1 = __importDefault(require("./controllers/wild-bandito/wildbandito"));
const zombieoutbreak_1 = __importDefault(require("./controllers/zombie-outbreak/zombieoutbreak"));
const majesticts_1 = __importDefault(require("./controllers/majestic-ts/majesticts"));
//import aztec from "./controllers/treasures-aztec/treasuresaztec"
const thairiver_1 = __importDefault(require("./controllers/thai-river/thairiver"));
const shaolinsoccer_1 = __importDefault(require("./controllers/shaolin-soccer/shaolinsoccer"));
const gdnicefire_1 = __importDefault(require("./controllers/gdn-ice-fire/gdnicefire"));
const riseapollo_1 = __importDefault(require("./controllers/rise-apollo/riseapollo"));
const wildbountrysd_1 = __importDefault(require("./controllers/wild-bounty-sd/wildbountrysd"));
const treasuresaztec_1 = __importDefault(require("./controllers/treasures-aztec/treasuresaztec"));
const threeczpigs_1 = __importDefault(require("./controllers/three-cz-pigs/threeczpigs"));
//import wildape from "./controllers/wild-ape/wildape"
const routes = (0, express_1.Router)();
//CONTROLLER SESSION
routes.post("/web-api/game-proxy/v2/Resources/GetByReferenceIdsResourceTypeIds", sessioncontroller_1.default.GetByReferenceIdsResourceTypeIds);
routes.post("/web-api/game-proxy/v2/Resources/GetByResourcesTypeIds", sessioncontroller_1.default.resourcetypeids);
routes.post("/web-api/game-proxy/v2/GameName/Get", sessioncontroller_1.default.gamename);
routes.post("/web-api/game-proxy/v2/GameRule/Get", sessioncontroller_1.default.gamesrules);
routes.post("/web-api/game-proxy/v2/BetSummary/Get", sessioncontroller_1.default.betsummary);
routes.post("/web-api/game-proxy/v2/BetHistory/Get", sessioncontroller_1.default.bethistory);
//RED TIGER
routes.post("/rtg/platform/game/settings", sessioncontroller_1.default.redtiger);
routes.post("/rtg/platform/game/spin", sessioncontroller_1.default.redtigerspin);
//API CONTROLLERS
routes.post("/api/v1/game_launch", apicontroller_1.default.launchgame);
routes.post("/api/v1/getagent", apicontroller_1.default.getagent);
routes.post("/api/v1/attagent", apicontroller_1.default.attagent);
//GAMES CONTROLLERS ROUTES
routes.post("/web-api/auth/session/v2/verifySession", sessioncontroller_1.default.verifySession);
//FORTUNE TIGER
routes.post("/game-api/fortune-tiger/v2/GameInfo/Get", fortunetiger_1.default.getiger);
routes.post("/game-api/fortune-tiger/v2/Spin", fortunetiger_1.default.spin);
//FORTUNE OX
routes.post("/game-api/fortune-ox/v2/GameInfo/Get", fortuneox_1.default.getox);
routes.post("/game-api/fortune-ox/v2/Spin", fortuneox_1.default.spin);
//FORTUNE MOUSE
routes.post("/game-api/fortune-mouse/v2/GameInfo/Get", fortunemouse_1.default.getmouse);
routes.post("/game-api/fortune-mouse/v2/Spin", fortunemouse_1.default.spin);
//FORTUNE DRAGON
routes.post("/game-api/fortune-dragon/v2/GameInfo/Get", fortunedragon_1.default.getdragon);
routes.post("/game-api/fortune-dragon/v2/Spin", fortunedragon_1.default.spin);
//FORTUNE RABBIT
routes.post("/game-api/fortune-rabbit/v2/GameInfo/Get", fortunerabbit_1.default.getrabbit);
routes.post("/game-api/fortune-rabbit/v2/Spin", fortunerabbit_1.default.spin);
//BIKINE PARADISE
routes.post("/game-api/bikine-paradise/v2/GameInfo/Get", bikiniparadise_1.default.getparadise);
routes.post("/game-api/bikine-paradise/v2/Spin", bikiniparadise_1.default.spin);
//JUNGLE DELIGHT
routes.post("/game-api/jungle-delight/v2/GameInfo/Get", jungledelight_1.default.getjungle);
routes.post("/game-api/jungle-delight/v2/Spin", jungledelight_1.default.spin);
//DOUBLE FORTUNE
routes.post("/game-api/double-fortune/v2/GameInfo/Get", doublefortune_1.default.getdouble);
routes.post("/game-api/double-fortune/v2/Spin", doublefortune_1.default.spin);
//GANESHA GOLD
routes.post("/game-api/ganesha-gold/v2/GameInfo/Get", ganeshagold_1.default.getganesha);
routes.post("/game-api/ganesha-gold/v2/Spin", ganeshagold_1.default.spin);
//DRAGON TIGER LUCKY
routes.post("/game-api/dragon-tiger-luck/v2/GameInfo/Get", dragontigerluck_1.default.getdragontiger);
routes.post("/game-api/dragon-tiger-luck/v2/Spin", dragontigerluck_1.default.spin);
//CASH MANIA
// DESATIVADO (sem dados de jogadas): routes.post("/game-api/cash-mania/v2/GameInfo/Get", cashmania_1.default.getcash);
// DESATIVADO (sem dados de jogadas): routes.post("/game-api/cash-mania/v2/Spin", cashmania_1.default.spin);
//ULTIMATE STRIKER
routes.post("/game-api/ultimate-striker/v2/GameInfo/Get", ultimatestriker_1.default.getstriker);
routes.post("/game-api/ultimate-striker/v2/Spin", ultimatestriker_1.default.spin);
//BUTTERFLY BLOSSOM
routes.post("/game-api/butterfly-blossom/v2/GameInfo/Get", butterfly_blossom_1.default.getbutterfly);
routes.post("/game-api/butterfly-blossom/v2/Spin", butterfly_blossom_1.default.spin);
//LUCKY CLOVER
routes.post("/game-api/lucky-clover/v2/GameInfo/Get", luckyclover_1.default.getclover);
routes.post("/game-api/lucky-clover/v2/Spin", luckyclover_1.default.spin);
//NINJA RACCOON
routes.post("/game-api/ninja-raccoon/v2/GameInfo/Get", ninjaraccoon_1.default.getninja);
routes.post("/game-api/ninja-raccoon/v2/Spin", ninjaraccoon_1.default.spin);
//FORTUNE TREE
routes.post("/game-api/prosper-ftree/v2/GameInfo/Get", prosperftree_1.default.gettree);
routes.post("/game-api/prosper-ftree/v2/Spin", prosperftree_1.default.spin);
//CHICKY RUN
routes.post("/game-api/chicky-run/v2/GameInfo/Get", chickyrun_1.default.getchicky);
routes.post("/game-api/chicky-run/v2/Play", chickyrun_1.default.Play);
//WINGS IGUAZU
routes.post("/game-api/wings-iguazu/v2/GameInfo/Get", wingsiguazu_1.default.getiguazu);
routes.post("/game-api/wings-iguazu/v2/Spin", wingsiguazu_1.default.spin);
//PIGGY GOLD
routes.post("/game-api/piggy-gold/v2/GameInfo/Get", piggygold_1.default.getpiggy);
routes.post("/game-api/piggy-gold/v2/Spin", piggygold_1.default.spin);
//WILD BANDITO
routes.post("/game-api/wild-bandito/v2/GameInfo/Get", wildbandito_1.default.getwildbandito);
routes.post("/game-api/wild-bandito/v2/Spin", wildbandito_1.default.spin);
//WILD ZOMBIE
routes.post("/game-api/zombie-outbreak/v2/GameInfo/Get", zombieoutbreak_1.default.getzombie);
routes.post("/game-api/zombie-outbreak/v2/Spin", zombieoutbreak_1.default.spin);
//MAJESTIC TS
routes.post("/game-api/majestic-ts/v2/GameInfo/Get", majesticts_1.default.getmajestic);
routes.post("/game-api/majestic-ts/v2/Spin", majesticts_1.default.spin);
//TREASURES AZTEC
//routes.post("/game-api/treasures-aztec/v2/GameInfo/Get", aztec.getaztec)
//routes.post("/game-api/treasures-aztec/v2/Spin", aztec.spin)
//THAI RIVER
routes.post("/game-api/thai-river/v2/GameInfo/Get", thairiver_1.default.getriver);
routes.post("/game-api/thai-river/v2/Spin", thairiver_1.default.spin);
//SHAOLIN SOCCER
// DESATIVADO (sem dados de jogadas): routes.post("/game-api/shaolin-soccer/v2/GameInfo/Get", shaolinsoccer_1.default.getshaolin);
// DESATIVADO (sem dados de jogadas): routes.post("/game-api/shaolin-soccer/v2/Spin", shaolinsoccer_1.default.spin);
//GDN ICE FIRE
routes.post("/game-api/gdn-ice-fire/v2/GameInfo/Get", gdnicefire_1.default.geticefire);
routes.post("/game-api/gdn-ice-fire/v2/Spin", gdnicefire_1.default.spin);
//GDN RISE APOLLO
routes.post("/game-api/rise-apollo/v2/GameInfo/Get", riseapollo_1.default.getriseapollo);
routes.post("/game-api/rise-apollo/v2/Spin", riseapollo_1.default.spin);
//WILD BOUTY SD
routes.post("/game-api/wild-bounty-sd/v2/GameInfo/Get", wildbountrysd_1.default.getbounty);
routes.post("/game-api/wild-bounty-sd/v2/Spin", wildbountrysd_1.default.spin);
//TREASURES AZTEC
routes.post("/game-api/treasures-aztec/v2/GameInfo/Get", treasuresaztec_1.default.getaztec);
routes.post("/game-api/treasures-aztec/v2/Spin", treasuresaztec_1.default.spin);
//THREE CRAZY PIGS
routes.post("/game-api/three-cz-pigs/v2/GameInfo/Get", threeczpigs_1.default.getthreecz);
routes.post("/game-api/three-cz-pigs/v2/Spin", threeczpigs_1.default.spin);
//WILD APE
//routes.post("/game-api/wild-ape/v2/GameInfo/Get", wildape.getape)
//routes.post("/game-api/wild-ape/v2/Spin", wildape.spin)
exports.default = routes;
