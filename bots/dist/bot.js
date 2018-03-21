"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jet = require("node-jet");
class TradeBot {
    constructor(config) {
        this.peer = new jet.Peer(config);
    }
    connect() {
        this.peer.connect();
    }
}
exports.TradeBot = TradeBot;
