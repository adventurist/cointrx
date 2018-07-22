import {take, put, call, select} from 'redux-saga/effects'
import * as userActions from '../../actions/user/actionTypes'

export function * userSaga () {
    while (true) {
        const action = yield (userActions.FETCH_USERS)

    }
}