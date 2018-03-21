import * as jet from 'node-jet'
import * as http from 'http'
import finalhandler from 'finalhandler'

export const serverFactory = (options: serverConfig) => {
    const httpServer = http.createServer((req, res) => {
        let done = finalhandler(req, res)
    })

    httpServer.listen(options.port)

    try {
        const daemon = new jet.Daemon()
        daemon.listen({
            server: httpServer,
            tcpPort: options.tcpPort
        })

        daemon.on('connection', (bot) => {
            console.log(`Bot connected: ${bot.id}`)
        })

        daemon.on('disconnect', (bot) => {
            console.log(`Bot disconnected: ${bot.id}`)
        })

        daemon.on('reserve', (bot) => {
            console.log(`Reserve called from Daemon for ${bot.id}`)
        })

        return daemon

    } catch (e) {
        console.error(e)
    }
}

interface serverConfig {
    port: number,
    tcpPort: number
}