import * as actionTypes from '../../actions/user/actionTypes'
import * as eventTypes from './eventTypes'

const eventsMap = {}

eventsMap[actionTypes.FETCH_USERS] = (action) => [{
        type: eventTypes.USERS_CHANGE,
        args: {
            users: action.payload.users
        }
    }]

export default eventsMap