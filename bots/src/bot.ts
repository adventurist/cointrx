import * as jet from 'node-jet'

export class TradeBot {
    private peer: typeof jet.Peer;
    constructor (config) {
        this.peer = new jet.Peer(config)
    }

    connect() {
        this.peer.connect()
    }
}

