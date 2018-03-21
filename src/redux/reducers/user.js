import * as actionTypes from '../actions/actionTypes'
import { handleActions } from 'redux-actions'
import { cloneDeep, unionBy, sortBy, find } from 'lodash/fp'

const reducers = {}

reducers[actionTypes.FETCH_USERS] = {
    next(state, action) {
        return {
            ...state,
            users: {
                ...state.users,
                ...action.payload
            }
        }
    }
}

const reducer = handleActions(reducers, {users: {}})
export default reducer