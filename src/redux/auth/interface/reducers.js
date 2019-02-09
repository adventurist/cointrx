import * as actionTypes from './actionTypes'
import { handleActions } from 'redux-actions'

const reducers = {}

reducers[actionTypes.SET_TOKEN] = {
    next(state, action) {
        return {
            ...state,
            token: action.payload
        }
    }
}

const reducer = handleActions(reducers, { token: undefined })

export default reducer
