"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PatternAnalyzer_1 = require("./PatternAnalyzer");
class Bot {
    /**
     *
     * @param {Websocket} ws
     * @param {Array} findings
     * @constructor
     */
    constructor(id, ws, findings) {
        this.id = id;
        this.ws = ws;
        this.findings = findings;
        this.analyzer = new PatternAnalyzer_1.default(this.findings);
    }
    /**
     * decide
     *
     * Makes a determination on whether or not to perform a trade
     *
     * @returns {Boolean} Indication of successul completion of analysis
     */
    decide() {
        return this.analyzer.analyze();
    }
    /**
     * isReady
     *
     * Reports ready status
     *
     * @returns {Boolean} ready status
     */
    isReady() {
        return this.analyzer.isReady();
    }
    /**
     * setFindings
     *
     * @param findings
     */
    setFindings(findings) {
        this.findings = findings;
    }
    /**
     * trade
     *
     * Perform a trade
     *
     * @param {Object} recipient
     * @param {Boolean} selfDetermine
     *
     * @returns {Object} trade info object
     */
    trade(recipient, selfDetermine = false) {
        return { result: true, error: false };
    }
}
exports.default = Bot;
