import * as actionTypes from './actionTypes'

export function setToken (token, err) {
    return {
        type: actionTypes.SET_TOKEN,
        payload: token,
        error: err ? true : false
    }
}

// export function setCredentials (credentials) {
//     return {
//         type: actionTypes.SET_CREDENTIALS,
//         payload: credentials,
//         error: err ? true : false
//     }
// }
