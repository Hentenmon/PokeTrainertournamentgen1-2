"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var Simulation_test_1_exports = {};
__export(Simulation_test_1_exports, {
  HeuristicsPlayerAI: () => HeuristicsPlayerAI
});
module.exports = __toCommonJS(Simulation_test_1_exports);
var import__ = require("..");
var import_random_player_ai = require("../tools/random-player-ai");
var fs = __toESM(require("fs"));
var import_dex = require("../dex");
var import_runner = require("../tools/runner");
/**
 * Battle Stream Example
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Example of how to create AIs battling against each other.
 * Run this using `node build && node dist/sim/examples/simulation-test-1`.
 *
 * @license MIT
 * @author Guangcong Luo <guangcongluo@gmail.com>
 */
class activeTracker {
  constructor() {
    this._p1_active = {
      species: void 0,
      currentHp: 0,
      currentHpPercent: 0,
      boosts: {},
      stats: {},
      moves: [],
      n_remaining_mons: 0,
      sideConditions: {},
      firstTurn: 0,
      protectCount: 0,
      FutureSightCounter: 0,
      teraType: void 0
    };
    this._p2_active = {
      species: void 0,
      currentHp: 0,
      currentHpPercent: 0,
      boosts: {},
      stats: {},
      moves: [],
      n_remaining_mons: 0,
      sideConditions: {},
      firstTurn: 0,
      protectCount: 0,
      FutureSightCounter: 0,
      teraType: void 0
    };
  }
  get p1_active() {
    return this._p1_active;
  }
  set p1_active(pokemon) {
    this._p1_active = pokemon;
  }
  get p2_active() {
    return this._p2_active;
  }
  set p2_active(pokemon) {
    this._p2_active = pokemon;
  }
}
class HeuristicsPlayerAI extends import_random_player_ai.RandomPlayerAI {
  constructor(playerStream, options, activeTracker2) {
    super(playerStream, options);
    this.ENTRY_HAZARDS = ["spikes", "stealthrock", "stickyweb", "toxicspikes"];
    this.ANTI_HAZARDS_MOVES = ["rapidspin", "defog", "tidyup"];
    this.SELF_RECOVERY_MOVES = ["healorder", "milkdrink", "recover", "rest", "roost", "slackoff", "softboiled"];
    this.WEATHER_SETUP_MOVES = {
      "chillyreception": "Snow",
      "hail": "Hail",
      "raindance": "RainDance",
      "sandstorm": "Sandstorm",
      "snowscape": "Snow",
      "sunnyday": "SunnyDay"
    };
    this.SOUND_BASED_MOVES = [
      "growl",
      "roar",
      "sing",
      "supersonic",
      "screech",
      "snore",
      "healbell",
      "uproar",
      "hypervoice",
      "metalsound",
      "grasswhistle",
      "howl",
      "bugbuzz",
      "chatter",
      "round",
      "echoedvoice",
      "relicsong",
      "snarl",
      "nobleroar",
      "disarmingvoice",
      "partingshot",
      "boomburst",
      "confide",
      "sparklingaria",
      "clangingscales",
      "clangoroussoulblaze",
      "clangoroussoul",
      "overdrive",
      "eeriespell",
      "torchsong",
      "alluringvoice",
      "psychicnoise"
    ];
    this.SPEED_TIER_COEFICIENT = 0.1;
    this.HP_FRACTION_COEFICIENT = 0.4;
    this.SWITCH_OUT_MATCHUP_THRESHOLD = -2;
    this.SELF_KO_MOVE_MATCHUP_THRESHOLD = 0.3;
    this.TRICK_ROOM_THRESHOLD = 85;
    this.RECVOERY_MOVE_THRESHOLD = 0.4;
    this.ACCURACY_SWITCH_THRESHOLD = -3;
    this.activeTracker = activeTracker2;
  }
  // estimates a given matchup and returns a score
  _estimateMatchup(request, nonActiveMon) {
    this._updateActiveTracker(request);
    const mon_opponent = this._getCurrentPlayer(request);
    var mon = mon_opponent[0].species;
    var opponent = mon_opponent[1].species;
    if (nonActiveMon)
      mon = nonActiveMon.details;
    const { Dex: Dex2 } = require("pokemon-showdown");
    let score = 1;
    score = this.bestDamageMultiplier(mon, opponent);
    score -= this.bestDamageMultiplier(opponent, mon);
    if (Dex2.species.get(mon).baseStats.spe > Dex2.species.get(opponent).baseStats.spe) {
      score += this.SPEED_TIER_COEFICIENT;
    } else if (Dex2.species.get(opponent).baseStats.spe > Dex2.species.get(mon).baseStats.spe) {
      score -= this.SPEED_TIER_COEFICIENT;
    }
    if (request.side.id == "p1") {
      if (nonActiveMon)
        score += this._getCurrentHp(nonActiveMon.condition) * this.HP_FRACTION_COEFICIENT;
      else
        score += this.activeTracker.p1_active.currentHp * this.HP_FRACTION_COEFICIENT;
      score -= this.activeTracker.p2_active.currentHp * this.HP_FRACTION_COEFICIENT;
    } else {
      if (nonActiveMon)
        score += this._getCurrentHp(nonActiveMon.condition) * this.HP_FRACTION_COEFICIENT;
      else
        score += this.activeTracker.p2_active.currentHp * this.HP_FRACTION_COEFICIENT;
      score -= this.activeTracker.p1_active.currentHp * this.HP_FRACTION_COEFICIENT;
    }
    return score;
  }
  // estimate matchup function for team preview
  _estimateMatchupTeamPreview(nonActiveMon, nonActiveOpp) {
    const monName = nonActiveMon.details;
    const oppName = nonActiveOpp.species;
    const { Dex: Dex2 } = require("pokemon-showdown");
    let score = 1;
    score = this.bestDamageMultiplier(monName, oppName);
    score -= this.bestDamageMultiplier(oppName, monName);
    if (Dex2.species.get(monName).baseStats.spe > Dex2.species.get(oppName).baseStats.spe) {
      score += this.SPEED_TIER_COEFICIENT;
    } else if (Dex2.species.get(oppName).baseStats.spe > Dex2.species.get(monName).baseStats.spe) {
      score -= this.SPEED_TIER_COEFICIENT;
    }
    const oppHp = Math.floor((2 * Number(Dex2.species.get(nonActiveOpp.species).baseStats.hp) + Number(nonActiveOpp.ivs.hp) + Math.floor(Number(nonActiveOpp.evs.hp) / 4)) * Number(nonActiveOpp.level) / 100) + Number(nonActiveOpp.level) + 10;
    score += this._getCurrentHp(nonActiveMon.condition) * this.HP_FRACTION_COEFICIENT;
    score -= oppHp * this.HP_FRACTION_COEFICIENT;
    return score;
  }
  shouldDynamax(request, canDynamax) {
    this._updateActiveTracker(request);
    if (canDynamax) {
      const mon_opponent = this._getCurrentPlayer(request);
      const mon = mon_opponent[0];
      const opponent = mon_opponent[1];
      if (request.side.pokemon.filter((m) => parseInt(m.condition.split("/")[0], 10) == 1).length == 1 && mon.currentHp == 1) {
        return true;
      }
      if (this._estimateMatchup(request) > 0 && mon.currentHpPercent == 1 && opponent.currentHpPercent == 1) {
        return true;
      }
      if (request.side.pokemon.filter((m) => Number(this._getHpFraction(m.condition)) != 0).length == 1 && mon.currentHpPercent == 1) {
        return true;
      }
    }
    return false;
  }
  shouldTera(request, canTerastallize) {
    this._updateActiveTracker(request);
    if (canTerastallize) {
      const mon_opponent = this._getCurrentPlayer(request);
      const mon = mon_opponent[0];
      const opponent = mon_opponent[1];
      if (this.bestDamageMultiplier(mon.species, opponent.species, false, mon.teraType) && request.side.pokemon.filter((m) => parseInt(m.condition.split("/")[0], 10) == 1).length == 1 && mon.currentHp == 1) {
        return true;
      }
      if (this.bestDamageMultiplier(mon.species, opponent.species, false, mon.teraType) && request.side.pokemon.filter((m) => Number(this._getHpFraction(m.condition)) != 0).length == 1 && mon.currentHpPercent == 1) {
        return true;
      }
      if (this._estimateMatchup(request) < 0 && this.bestDamageMultiplier(mon.species, opponent.species, false, mon.teraType) && mon.currentHpPercent == 1 && opponent.currentHpPercent >= 0.75) {
        return true;
      }
    }
    return false;
  }
  _should_switch_out(request) {
    this._updateActiveTracker(request);
    const mon_opponent = this._getCurrentPlayer(request);
    const mon = mon_opponent[0];
    const opponent = mon_opponent[1];
    const availableSwitches = request.side.pokemon.filter((m) => m.active == false && this._getHpFraction(m.condition) != 0);
    if (!availableSwitches)
      return false;
    if (availableSwitches.filter((m) => this._estimateMatchup(request) > 0).length && request.side.pokemon.trapped == false) {
      if (mon.boosts["accuracy"] <= this.ACCURACY_SWITCH_THRESHOLD) {
        return true;
      }
      if (mon.boosts["def"] <= -3 || mon.boosts["spd"] <= -3) {
        return true;
      }
      if (mon.boosts["atk"] <= -3 && mon.stats["atk"] >= mon.stats["spa"]) {
        return true;
      }
      if (mon.boosts["spa"] <= -3 && mon.stats["atk"] <= mon.stats["spa"]) {
        return true;
      }
      if (this._estimateMatchup(request) < this.SWITCH_OUT_MATCHUP_THRESHOLD) {
        return true;
      }
    }
    const activeOpp = request.side.foe.pokemon.filter((mon2) => mon2.isActive == true)[0];
    if (Object.keys(activeOpp.volatiles).includes("perishsong") || Object.keys(activeOpp.volatiles).includes("perish1")) {
      return true;
    }
    return false;
  }
  _stat_estimation(mon, stat) {
    if (mon.boosts[stat] > 1) {
      const boost = (2 + mon.boosts[stat]) / 2;
      return (2 * import_dex.Dex.species.get(mon.species).baseStats[stat] + 31 + 5) * boost;
    } else {
      const boost = 2 / (2 - mon.boosts[stat]);
      return (2 * import_dex.Dex.species.get(mon.species).baseStats[stat] + 31 + 5) * boost;
    }
  }
  chooseMove(request, active, moves, canDynamax, canTerastallize, possibleMoves) {
    this._updateActiveTracker(request);
    const mon_opponent = this._getCurrentPlayer(request);
    const mon = mon_opponent[0];
    const opponent = mon_opponent[1];
    if (mon.protectCount > 0) {
      mon.protectCount -= 1;
    }
    if (mon.FutureSightCounter > 0) {
      mon.FutureSightCounter -= 1;
    }
    const currentWeather = request.side.pokemon[0].battle.field.weather;
    const allMoves = possibleMoves;
    for (var move of possibleMoves) {
      if (move.pp == 0 || move.disabled == true) {
        possibleMoves = possibleMoves.filter((m) => (m.id || m.move) !== (move.id || move.move));
      }
    }
    const physical_ratio = this._stat_estimation(mon, "atk") / this._stat_estimation(opponent, "def");
    const special_ratio = this._stat_estimation(mon, "spa") / this._stat_estimation(opponent, "spd");
    const monSideConditionList = Object.keys(mon.sideConditions).map((move2) => mon.sideConditions[move2].id);
    const oppSideConditionList = Object.keys(opponent.sideConditions).map((move2) => opponent.sideConditions[move2].id);
    if (possibleMoves && !this._should_switch_out(request) || request.side.pokemon.filter((m) => Number(this._getHpFraction(m.condition)) != 0).length == 1 && mon.currentHpPercent == 1) {
      const n_remaining_mons = mon.n_remaining_mons;
      const n_opp_remaining_mons = opponent.n_remaining_mons;
      for (var move of possibleMoves) {
        if ((move.id || move.move) == "fakeout" && mon.firstTurn == 1 && !import_dex.Dex.species.get(opponent.species).types.includes("Ghost")) {
          mon.firstTurn = 0;
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        }
      }
      mon.firstTurn = 0;
      for (var move of possibleMoves) {
        if (((move.id || move.move) == "explosion" || (move.id || move.move) == "selfdestruct") && mon.currentHpPercent < this.SELF_KO_MOVE_MATCHUP_THRESHOLD && opponent.currentHpPercent > 0.5 && !import_dex.Dex.species.get(opponent.species).types.includes("Ghost")) {
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        }
      }
      for (var move of possibleMoves) {
        if ((move.id || move.move) == "tailwind" && !monSideConditionList.includes(move.id || move.move)) {
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        }
        if ((move.id || move.move) == "trickroom" && !monSideConditionList.includes(move.id || move.move) && request.side.pokemon.map((m) => m.stats.spd).filter((spd) => spd <= this.TRICK_ROOM_THRESHOLD).length >= 3) {
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        }
        if ((move.id || move.move) == "auroraveil" && !monSideConditionList.includes(move.id || move.move) && (currentWeather == "Hail" || currentWeather == "Snow")) {
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        }
        if ((move.id || move.move) == "lightscreen" && !monSideConditionList.includes(move.id || move.move) && import_dex.Dex.species.get(opponent.species).baseStats.spa > import_dex.Dex.species.get(opponent.species).baseStats.atk) {
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        }
        if ((move.id || move.move) == "reflect" && !monSideConditionList.includes(move.id || move.move) && import_dex.Dex.species.get(opponent.species).baseStats.atk > import_dex.Dex.species.get(opponent.species).baseStats.spa) {
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        }
      }
      for (var move of possibleMoves) {
        if (n_opp_remaining_mons >= 3 && this.ENTRY_HAZARDS.includes(move.id || move.move) && this.ENTRY_HAZARDS.filter((word) => oppSideConditionList.includes(word)).length === 0) {
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        } else if (n_remaining_mons >= 2 && this.ANTI_HAZARDS_MOVES.includes(move.id || move.move) && this.ENTRY_HAZARDS.filter((word) => monSideConditionList.includes(word)).length > 0) {
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        }
      }
      for (var move of possibleMoves) {
        if ((move.id || move.move) == "courtchange" && (!(this.ENTRY_HAZARDS.filter((word) => monSideConditionList.includes(word)).length === 0) || (oppSideConditionList.includes("tailwind") || oppSideConditionList.includes("lightscreen") || oppSideConditionList.includes("reflect")) && !(monSideConditionList.includes("tailwind") || monSideConditionList.includes("lightscreen") || monSideConditionList.includes("reflect")) && this.ENTRY_HAZARDS.filter((word) => oppSideConditionList.includes(word)).length === 0)) {
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        }
      }
      for (var move of possibleMoves) {
        if (this.SELF_RECOVERY_MOVES.includes(move.id || move.move) && mon.currentHpPercent < this.RECVOERY_MOVE_THRESHOLD) {
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        }
      }
      for (var move of possibleMoves) {
        if ((move.id || move.move) == "strengthsap" && mon.currentHpPercent < 0.5 && import_dex.Dex.species.get(opponent.species).baseStats.atk > 80) {
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        }
      }
      for (var move of possibleMoves) {
        if ((move.id || move.move) in this.WEATHER_SETUP_MOVES && currentWeather != this.WEATHER_SETUP_MOVES[move.id || move.move].toLowerCase()) {
          if (!(currentWeather == "PrimordialSea" && this.WEATHER_SETUP_MOVES[move.id || move.move] == "RainDance") && !(currentWeather == "DesolateLand" && this.WEATHER_SETUP_MOVES[move.id || move.move] == "SunnyDay")) {
            return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
          }
        }
      }
      if (mon.currentHpPercent == 1 && this._estimateMatchup(request) > 0) {
        const SETUP_MOVES = JSON.parse(fs.readFileSync("../Data/UsefulDatasets/setup_moves.json", "utf-8"));
        for (var move of possibleMoves) {
          if ((move.id || move.move) in SETUP_MOVES && Math.min(...Object.keys(this._getNonZeroStats(move.id || move.move)).map((key) => mon.boosts[key])) < 6) {
            if ((move.id || move.move) == "curse" && import_dex.Dex.species.get(opponent.species).types.includes("Ghost")) {
              continue;
            } else {
              return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
            }
          }
        }
      }
      const STATUS_INFLICTING_MOVES = JSON.parse(fs.readFileSync("../Data/UsefulDatasets/status_inflicting_moves.json", "utf-8"));
      for (var move of possibleMoves) {
        const activeOpp = request.side.foe.pokemon.filter((mon2) => mon2.isActive == true)[0];
        if (Object.keys(activeOpp.volatiles).length === 0 && !activeOpp.status && opponent.currentHpPercent > 0.6 && mon.currentHpPercent > 0.5 && !(request.side.foe.pokemon.ability == "leafguard" && (currentWeather === "DesolateLand" || currentWeather === "SunnyDay"))) {
          const cond = STATUS_INFLICTING_MOVES[move.id || move.move];
          switch (cond) {
            case "burn":
              if (!import_dex.Dex.species.get(opponent.species).types.includes("Fire") && import_dex.Dex.species.get(opponent.species).baseStats.atk > 80) {
                return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
              }
              break;
            case "paralysis":
              if (!import_dex.Dex.species.get(opponent.species).types.includes("Electric") && import_dex.Dex.species.get(opponent.species).baseStats.spe > import_dex.Dex.species.get(mon.species).baseStats.spe) {
                return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
              }
              break;
            case "sleep":
              if (!(import_dex.Dex.species.get(opponent.species).types.includes("Grass") && (move.id || move.move) === "spore" || "sleeppowder")) {
                return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
              }
              break;
            case "confusion":
              if (!(import_dex.Dex.species.get(opponent.species).types.includes("Poison") || import_dex.Dex.species.get(opponent.species).types.includes("Steel")) && request.side.foe.pokemon.ability != "magicguard" && request.side.foe.pokemon.ability != "owntempo" && request.side.foe.pokemon.ability != "oblivious") {
                return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
              }
              break;
            case "poison":
              if (!(import_dex.Dex.species.get(opponent.species).types.includes("Poison") || import_dex.Dex.species.get(opponent.species).types.includes("Steel")) && request.side.foe.pokemon.ability != "immunity" && request.side.foe.pokemon.ability != "magicguard") {
                return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
              }
              break;
            case "cursed":
              if (import_dex.Dex.species.get(mon.species).types.includes("Ghost") && request.side.foe.pokemon.ability != "magicguard") {
                return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
              }
              break;
            case "leech":
              if (!import_dex.Dex.species.get(opponent.species).types.includes("Grass") && request.side.foe.pokemon.ability != "magicguard") {
                return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
              }
              break;
          }
        }
      }
      for (var move of possibleMoves) {
        if (mon.currentHpPercent == 1 && this._estimateMatchup(request) > 0 && opponent.boosts["accuracy"] > this.ACCURACY_SWITCH_THRESHOLD && ["flash", "kinesis", "leaftornado", "mirrorshot", "mudbomb", "mudslap", "muddywater", "nightdaze", "octazooka", "sandattack", "secretpower", "smokescreen"].includes(move.id || move.move)) {
          return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
        }
      }
      for (var move of possibleMoves) {
        const activeOpp = request.side.foe.pokemon.filter((mon2) => mon2.isActive == true)[0];
        if (["protect", "banefulbunker", "obstruct", "craftyshield", "detect", "quickguard", "spikyshield", "silktrap"].includes(move.id || move.move)) {
          if ((oppSideConditionList.includes("tailwind") && !monSideConditionList.includes("tailwind") || (Object.keys(activeOpp.volatiles).includes("curse") || activeOpp.status != "")) && mon.protectCount == 0 && request.side.foe.pokemon.ability != "unseenfist") {
            mon.protectCount = 2;
            return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
          }
        }
      }
      const moveValues = {};
      for (const move2 of possibleMoves) {
        moveValues[move2.id || move2.move] = import_dex.Dex.moves.get(move2.id || move2.move).basePower * (import_dex.Dex.species.get(mon.species).types.includes(import_dex.Dex.moves.get(move2.id || move2.move).type) ? 1.5 : 1) * Number(import_dex.Dex.moves.get(move2.id || move2.move).accuracy) * this._expectedHits(move2.id || move2.move) * this.bestDamageMultiplier(move2.id || move2.move, opponent.species, true);
        if (import_dex.Dex.moves.get(move2.id || move2.move).basePower == 0) {
          moveValues[move2.id || move2.move] = -100;
        }
        if ((move2.id || move2.move) == "fakeout") {
          moveValues[move2.id || move2.move] = 0;
        }
        if ((move2.id || move2.move) == "explosion") {
          moveValues[move2.id || move2.move] = 0;
        }
        if (request.side.pokemon.filter((mon2) => mon2.active == true)[0].status != "sleep" && (move2.id || move2.move) == "sleeptalk" || (move2.id || move2.move) == "dreameater") {
          moveValues[move2.id || move2.move] += 5;
        }
        if (request.side.foe.pokemon.ability == "lightningrod" && import_dex.Dex.moves.get(move2.id || move2.move).type == "electric" || request.side.foe.pokemon.ability == "flashfire" && import_dex.Dex.moves.get(move2.id || move2.move).type == "fire" || request.side.foe.pokemon.ability == "levitate" && import_dex.Dex.moves.get(move2.id || move2.move).type == "ground" || request.side.foe.pokemon.ability == "sapsipper" && import_dex.Dex.moves.get(move2.id || move2.move).type == "grass" || request.side.foe.pokemon.ability == "motordrive" && import_dex.Dex.moves.get(move2.id || move2.move).type == "electric" || request.side.foe.pokemon.ability == "stormdrain" && import_dex.Dex.moves.get(move2.id || move2.move).type == "water" || request.side.foe.pokemon.ability == "voltabsorb" && import_dex.Dex.moves.get(move2.id || move2.move).type == "electric" || request.side.foe.pokemon.ability == "waterabsorb" && import_dex.Dex.moves.get(move2.id || move2.move).type == "water" || request.side.foe.pokemon.ability == "immunity" && import_dex.Dex.moves.get(move2.id || move2.move).type == "poison" || request.side.foe.pokemon.ability == "eartheater" && import_dex.Dex.moves.get(move2.id || move2.move).type == "ground" || request.side.foe.pokemon.ability == "suctioncup" && (move2.id || move2.move) == "roar" || request.side.foe.pokemon.ability == "soundproof" && (move2.id || move2.move) == this.SOUND_BASED_MOVES.includes(move2.id || move2.move) || request.side.pokemon.filter((mon2) => mon2.active == true)[0].status != "sleep" && (move2.id || move2.move) == "dreameater") {
          moveValues[move2.id || move2.move] = -50;
        }
        if ((move2.id || move2.move) == "futuresight" && mon.FutureSightCounter != 0) {
          moveValues[move2.id || move2.move] = 0;
        }
      }
      const bestMoveValue = Math.max(...Object.values(moveValues));
      if (!("recharge" in moveValues)) {
        const bestMove = Object.keys(moveValues).find((m) => moveValues[m] === bestMoveValue);
        if (bestMove == "futuresight" && mon.FutureSightCounter == 0) {
          mon.FutureSightCounter = 3;
        }
        var should_Dynamax = this.shouldDynamax(request, canDynamax);
        var should_Tera = this.shouldTera(request, canTerastallize);
        if (should_Dynamax) {
          return [this._getMoveSlot(bestMove, allMoves), true, false];
        } else if (should_Tera) {
          return [this._getMoveSlot(bestMove, allMoves), false, this.shouldTera(request, canTerastallize)];
        } else {
          return [this._getMoveSlot(bestMove, allMoves), false, false];
        }
      } else {
        return ["move 1", false, false];
      }
    }
    for (var move of possibleMoves) {
      if ((move.id || move.move) == "healingwish" && mon.currentHpPercent < this.SELF_KO_MOVE_MATCHUP_THRESHOLD) {
        return [this._getMoveSlot(move.id || move.move, allMoves), false, this.shouldTera(request, canTerastallize)];
      }
    }
    if (this._should_switch_out(request)) {
      const availableSwitches = request.side.pokemon.filter((m) => m.active == false && this._getHpFraction(m.condition) != 0);
      if (availableSwitches) {
        let bestEstimation = Math.max(...availableSwitches.map((pokemon) => this._estimateMatchup(request, pokemon)));
        let bestMatchup = availableSwitches.find((pokemon) => this._estimateMatchup(request, pokemon) === bestEstimation);
        return ["switch ".concat(this._getPokemonPos(request, bestMatchup)), false, false];
      }
    }
    mon.firstTurn = 0;
    return [this.prng.sample(moves).choice, false, this.shouldTera(request, canTerastallize)];
  }
  // gets the slot number of the pasased in move
  _getMoveSlot(move, possibleMoves) {
    const bestMoveSlotIndex = possibleMoves.findIndex((item) => (item.id || item.move) === move) + 1;
    var bestMoveSlot;
    if (bestMoveSlotIndex == 1)
      bestMoveSlot = "move 1";
    if (bestMoveSlotIndex == 2)
      bestMoveSlot = "move 2";
    if (bestMoveSlotIndex == 3)
      bestMoveSlot = "move 3";
    if (bestMoveSlotIndex == 4)
      bestMoveSlot = "move 4";
    return bestMoveSlot;
  }
  // gets the slot number of the bestMatchup pokemon in the team
  _getPokemonPos(request, bestMatchup) {
    return request.side.pokemon.filter((pokemon) => pokemon.details == bestMatchup.details && this._getHpFraction(pokemon.condition) != 0 && pokemon.active == false)[0].position + 1;
  }
  // returns an approximate number of hits for a given move for estimation purposes
  _expectedHits(move) {
    const minMaxHits = import_dex.Dex.moves.get(move).multihit;
    if (move == "triplekick" || move == "tripleaxel") {
      return 1 + 2 * 0.9 + 3 * 0.81;
    }
    if (move == "bonemerang" || move == "doublehit" || move == "doubleironbash" || move == "doublekick" || move == "dragondarts" || move == "dualchop" || move == "dualwingbeat" || move == "geargrind" || move == "tachyoncutter" || move == "twinbeam" || move == "twineedle") {
      return 2;
    }
    if (move == "surgingstrikes" || move == "tripledive" || move == "watershuriken") {
      return 3;
    }
    if (move == "populationbomb") {
      return 7;
    }
    if (minMaxHits == void 0 || minMaxHits[0] == minMaxHits[1]) {
      return 1;
    }
    return (2 + 3) / 3 + (4 + 5) / 6;
  }
  // Chooses the best pokemon to switch to
  chooseSwitch(request, active, switches) {
    this._updateActiveTracker(request);
    const availableSwitches = request.side.pokemon.filter((m) => m.active == false && this._getHpFraction(m.condition) != 0);
    if (!availableSwitches)
      return 1;
    let bestEstimation = Math.max(...availableSwitches.map((pokemon) => this._estimateMatchup(request, pokemon)));
    let bestMatchup = availableSwitches.find((pokemon) => this._estimateMatchup(request, pokemon) === bestEstimation);
    this._getCurrentPlayer(request)[0].firstTurn = 1;
    return Number(this._getPokemonPos(request, bestMatchup));
  }
  chooseTeamPreview(request, team) {
    this._updateActiveTracker(request);
    return "team 1";
    const mons = request.side.pokemon;
    const opponentPokemon = request.side.foe.pokemon.map((m) => m.set);
    var bestMon;
    var bestAverage;
    var matchups;
    var average;
    for (var mon of mons) {
      matchups = opponentPokemon.map((opp) => this._estimateMatchupTeamPreview(mon, opp));
      average = matchups.reduce((total, value) => total + value, 0) / matchups.length;
      if (bestAverage == void 0 || average > bestAverage) {
        bestMon = mon;
        bestAverage = average;
      }
    }
    for (var mon of mons) {
      for (var move of mon.moves) {
        if ((move.id || move.move) in this.WEATHER_SETUP_MOVES || (move.id || move.move) in this.ENTRY_HAZARDS || (move.id || move.move) == "tailwind" || (move.id || move.move) == "trickroom" || (move.id || move.move) == "auroraveil" || (move.id || move.move) == "lightscreen" || (move.id || move.move) == "reflect") {
          bestMon = mon;
        }
      }
    }
    this._getCurrentPlayer(request)[0].firstTurn = 1;
    return "team ".concat(bestMon.position + 1);
  }
  // TODO this doesn't account for terastalised opponents, and just uses the mon's base types
  // returns the type with the best damage multiplier against the opponent
  bestDamageMultiplier(attacker, defender, isMove = false, teraType = "") {
    const typeMatchups = JSON.parse(fs.readFileSync("../Data/UsefulDatasets/gen_9_type-chart.json", "utf-8"));
    var attackerTypes;
    if (isMove) {
      attackerTypes = [import_dex.Dex.moves.get(attacker).type, "???"];
    } else {
      attackerTypes = import_dex.Dex.species.get(attacker).types;
    }
    if (!(teraType === "???") && !(teraType === void 0) && !(teraType === "")) {
      attackerTypes = [teraType, "???"];
    }
    const defenderTypes = import_dex.Dex.species.get(defender).types;
    let multiplier = 1;
    let bestMultiplier = 1;
    let counter = 0;
    for (const attackerType of attackerTypes) {
      multiplier = 1;
      for (const defenderType of defenderTypes) {
        if (!(attackerType == "???") && !(defenderType == "???") && !(attackerType == void 0) && !(defenderType == void 0) && !(attackerType == "") && !(defenderType == "") && typeMatchups[attackerType] !== void 0 && typeMatchups[attackerType][defenderType] !== void 0) {
          multiplier *= Number(typeMatchups[attackerType][defenderType]);
        } else {
          multiplier = -5;
        }
      }
      if (counter == 0) {
        bestMultiplier = multiplier;
      }
      counter += 1;
    }
    return Math.max(multiplier, bestMultiplier);
  }
  // The move options provided by the simulator have been converted from the name
  // which we're tracking, so we need to convert them back.
  fixMove(m) {
    const id = (0, import_dex.toID)(m.move);
    if (id.startsWith("return"))
      return "return";
    if (id.startsWith("frustration"))
      return "frustration";
    if (id.startsWith("hiddenpower"))
      return "hiddenpower";
    return id;
  }
  // takes hp in the form '457/457' and returns a decimal representing the amount left (with 1 as full hp and 0 as fainted)
  _getHpFraction(condition) {
    if (condition == "0 fnt")
      return 0;
    const [numerator, denominator] = condition.split("/").map((x) => parseInt(x, 10));
    return numerator / denominator;
  }
  // takes hp in the form '457/457' and returns the amount of hp left
  _getCurrentHp(condition) {
    if (condition == "0 fnt")
      return 0;
    return Number(condition.split("/")[0]);
  }
  // takes a move name and returns the stats that are boosted by that move
  _getNonZeroStats(name) {
    const SETUP_MOVES = JSON.parse(fs.readFileSync("../Data/UsefulDatasets/setup_moves.json", "utf-8"));
    if (name in SETUP_MOVES) {
      return Object.entries(SETUP_MOVES[name]).filter(([, value]) => value !== 0).reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    } else {
      return {};
    }
  }
  // fast way to update activeTracker, should be called before making decisions in choose functions
  _updateActiveTracker(request) {
    if (request.side.id == "p1") {
      var mon = this.activeTracker.p1_active;
    } else {
      mon = this.activeTracker.p2_active;
    }
    for (var pokemon of request.side.pokemon) {
      if (pokemon.active == true) {
        mon.species = pokemon.species;
        mon.currentHp = this._getCurrentHp(pokemon.condition);
        mon.currentHpPercent = this._getHpFraction(pokemon.condition);
        mon.boosts = pokemon.boosts;
        mon.stats = pokemon.stats;
        mon.moves = pokemon.moves;
        mon.n_remaining_mons = request.side.pokemon.filter((m) => Number(this._getHpFraction(m.condition)) != 0).length;
        mon.sideConditions = request.side.sideConditions;
        mon.teraType = pokemon.teraType;
      }
    }
  }
  // returns the current pokemon for the player making the request, and the opponent
  _getCurrentPlayer(request) {
    if (request.side.id == "p1") {
      var mon = this.activeTracker.p1_active;
      var opponent = this.activeTracker.p2_active;
      return [mon, opponent];
    } else {
      mon = this.activeTracker.p2_active;
      opponent = this.activeTracker.p1_active;
      return [mon, opponent];
    }
  }
}
async function main() {
  var threadNo = process.argv.slice(2)[0];
  var team1No = process.argv.slice(3)[0];
  var team2No = process.argv.slice(4)[0];
  var testTeam1 = "../Data/WorkerFiles/" + threadNo + "1.txt";
  var testTeam2 = "../Data/WorkerFiles/" + threadNo + "2.txt";
  var f = fs.readFileSync(testTeam1, "utf8");
  var g = fs.readFileSync(testTeam2, "utf8");
  var maybeteam1 = import__.Teams.import(f);
  var maybeteam2 = import__.Teams.import(g);
  let team1;
  let team2;
  if (maybeteam1 !== null) {
    team1 = maybeteam1;
  }
  if (maybeteam2 !== null) {
    team2 = maybeteam2;
  }
  console.log("[[[[[");
  console.log(team1No + " vs " + team2No);
  const spec = {
    formatid: "gen1customgame"
  };
  const dex = import_dex.Dex.forFormat(spec.formatid);
  const neutralAbility = "Illuminate";
  function assignNeutralAbilities(team) {
    if (!team)
      return;
    for (let pokemon of team) {
      pokemon.ability = neutralAbility;
    }
  }
  assignNeutralAbilities(team1);
  assignNeutralAbilities(team2);
  const tracker = new activeTracker();
  const createAI = (s, o) => new HeuristicsPlayerAI(s, o, tracker);
  try {
    await new import_runner.Runner({
      p1options: { team: team1, createAI },
      p2options: { team: team2, createAI },
      format: spec.formatid,
      output: true
    }).run();
  } catch (err) {
    console.error(err);
  }
}
main();
//# sourceMappingURL=Simulation-test-1.js.map
