import { serverFactory } from './daemon'
import { TradeBot } from './bot'

const defaultOptions = {
    port: 9779,
    tcpPort: 11127
}

const session = () => {
    const server = serverFactory(defaultOptions)
    console.dir(server)

    const bots = []

    for (let i = 0; i < 10; i++) {
        bots.push(new TradeBot({url: `ws://localhost:${defaultOptions.tcpPort}`}))
    }

    if (bots.length > 0) {
        bots.forEach( (bot) => {
            bot.connect()
        })
    }
}

session()
