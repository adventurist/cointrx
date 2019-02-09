import * as actionTypes from '../actionTypes'
import * as eventTypes from './eventTypes'

const eventsMap = {}

eventsMap[actionTypes.SET_TOKEN] = (action) => [{
        type: eventTypes.TOKEN_CHANGE,
        args: action.payload
    }]

export default eventsMap