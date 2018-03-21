"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jet = require("node-jet");
const http = require("http");
const finalhandler_1 = require("finalhandler");
exports.serverFactory = (options) => {
    const httpServer = http.createServer((req, res) => {
        let done = finalhandler_1.default(req, res);
    });
    httpServer.listen(options.port);
    try {
        const daemon = new jet.Daemon();
        daemon.listen({
            server: httpServer,
            tcpPort: options.tcpPort
        });
        daemon.on('connection', (bot) => {
            console.log(`Bot connected: ${bot.id}`);
        });
        daemon.on('disconnect', (bot) => {
            console.log(`Bot disconnected: ${bot.id}`);
        });
        daemon.on('reserve', (bot) => {
            console.log(`Reserve called from Daemon for ${bot.id}`);
        });
        return daemon;
    }
    catch (e) {
        console.error(e);
    }
};
