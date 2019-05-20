import * as actionTypes from './actionTypes'
import { handleActions } from 'redux-actions'

const reducers = {}

reducers[actionTypes.SET_BOTS] = {
    next(state, action) {
        return {
            ...state,
            bots: action.payload
        }
    }
}

const reducer = handleActions(reducers, { bots: [] })

export default reducer
