import { setBots } from './actions'

export default function api(context) {

    const botApi = {
        setBots: bots => {
            context.dispatch(setBots(bots))
        },
        getBots: () => {
            return [...context.getState().Bot.bots]
        }
    }

    return { bot: botApi }
}
