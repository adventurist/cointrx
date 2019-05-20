import * as actionTypes from './actionTypes'

export function setBots (bots, err) {
    return {
        type: actionTypes.SET_BOTS,
        payload: bots,
        error: err ? true : false
    }
}
