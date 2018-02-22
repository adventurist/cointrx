"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bitcore_lib_1 = require("bitcore-lib");
bitcore_lib_1.Networks.enableRegtest();
exports.convertWifToPrivate = (config) => {
    const bitcoinKey = new BitcoinKey(config);
    if (bitcoinKey) {
        return bitcoinKey.toPrivateKey();
    }
};
class BitcoinKey {
    constructor(config) {
        this.config = config;
        this.config = config;
        if (!config.multi) {
            this.bitcoinKey = bitcore_lib_1.PrivateKey.fromWIF(this.config.wif);
        }
    }
    toPrivateKey() {
        if (this.bitcoinKey) {
            return this.bitcoinKey.toString();
        }
    }
}
