import * as actionTypes from './actionTypes'

export function fetchUsers(err) {
    return {
        type: actionTypes.FETCH_USERS,
        error: err ? true : false
    }
}

export function fetchUser(id, err) {
    return {
        type: actionTypes.FETCH_USER,
        payload: id,
        error: err ? true : false
    }
}