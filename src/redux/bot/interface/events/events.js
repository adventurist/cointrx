import * as actionTypes from '../actionTypes'
import * as eventTypes from './eventTypes'

const eventsMap = {}

eventsMap[actionTypes.SET_BOTS] = (action) => [{
        type: eventTypes.BOT_CHANGE,
        args: action.payload
    }]

export default eventsMap