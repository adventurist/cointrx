"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const daemon_1 = require("./daemon");
const bot_1 = require("./bot");
const defaultOptions = {
    port: 9779,
    tcpPort: 11127
};
const session = () => {
    const server = daemon_1.serverFactory(defaultOptions);
    console.dir(server);
    const bots = [];
    for (let i = 0; i < 10; i++) {
        bots.push(new bot_1.TradeBot({ url: `ws://localhost:${defaultOptions.tcpPort}` }));
    }
    if (bots.length > 0) {
        bots.forEach((bot) => {
            bot.connect();
        });
    }
};
session();
