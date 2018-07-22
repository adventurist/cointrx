import { combineReducers, createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { memoize, mergeWith } from 'lodash/fp'
import log from 'loglevel'

const ERR_NO_STORE = 'Unable to access store in factory'

/**
 * Create an instance of the TRX client-side store
 * @param plugins
 */
export function factory(plugins) {
    let version = '0.0.1'
    log.info(`TRX version ${version}`)
    var store, loggerMiddleware
    const middlewares = []
    const reducers = {}
    const context = {
        capabilities: [],
        api: {},
        getState() {
            if (!store) {
                throw Error (ERR_NO_STORE)
            }
            return store.getState()
        },
        dispatch(...args) {
            if (!store) {
                throw Error(ERR_NO_STORE)
        }
        return store.dispatch(...args)
    },
        subscribe(fn) {
            if (!store) {
                throw Error(ERR_NO_STORE)
            }
            return store.subscribe(fn)
        }
    }

    plugins.forEach( (plugin) => {
        if (plugin.capabilities) {
            context.capabilities = context.capabilities.concat(plugin.capabilities)
        }
        if (plugin.reducer) {
            reducers[plugin.name] = plugin.reducer
        }
        if (plugin.selector) {
            selectors[plugin.name] = memoize(plugin.selector)
        }
        if (plugin.middleware) {
            middlewares.push( () => plugin.middleware(context))
        }
        if (plugin.api) {
            context.api = mergeWith((objValue, srcValue, property, destination, source) => {
                const descriptor = Object.getOwnPropertyDescriptor(source, property)
                if (descriptor) {
                    Object.defineProperty(destination, property, descriptor)
                } else {
                    if (destination === undefined) {
                        destination = {}
                    }
                    destination[property] = source[property]
                }
            }, context.api, plugin.api(context))
        }

    })

    store = createStore(combineReducers(reducers),
        composeWithDevTools(applyMiddleware(...middlewares)))

    var selectState = (trxState) => {
        var exposedState = {}

        plugins.forEach((plugin) => {
            let name = plugin.name
            if (selectors[name]) {
                exposedState[name] = trxState[name]
            }
        })
        return exposedState
    }

    selectState = memoize(selectState)

    const publicAPI = {
        ...context.api,
        state: {
            get: () => { return selectState(store.getState())},
            subscribe: (...args) => { return store.subscribe(...args)},
            getCapabilities() { return context.capabilities},
            getVersion() { return version }
        }
    }

    return publicAPI
}
