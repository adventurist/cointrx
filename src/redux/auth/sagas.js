import {take, put, call, select} from 'redux-saga/effects'
import * as authActions from './interface/actionTypes'

export function * subscribe () {
    while (true) {
        const action = yield (authActions.CONNECT)
    }
}
