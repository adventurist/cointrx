import TRXSocket from './TRXSocket'

// Third party tools
import format from 'date-fns/format'

/**
 *
 * @type {number}
 */
export const SOCKET_CONNECTING = 0;
export const SOCKET_OPEN = 1;
export const SOCKET_CLOSING = 2;
export const SOCKET_CLOSED = 3;

/**
 *
 * @param options
 * @returns {Promise.<{body: *, error: boolean}>}
 */
export async function request(options) {
    const {
        url,
        method,
        params,
        body,
        headers,
        credentials
    } = { ...options }

    delete options.body
    delete options.credentials
    delete options.method
    delete options.url
    delete options.headers
    delete options.params


    let queryString
    let requestHeaders
    let requestOptions

    if (params) {
        let keys = Object.keys({...params})
        if (keys.length > 0) {
            queryString = '?' + keys.map(key => `${key}=${params[key]}`).join('&')
        }
    }

    if (headers) {
        let keys = Object.keys({...headers})
        if (keys.length > 0) {
            requestHeaders = headers
        }
    }

    requestOptions = {
        method: method !== void 0 ? method : 'GET',
        body: body !== void 0 ? typeof body === 'string' ? body : JSON.stringify(body): '',
        headers: requestHeaders,
        credentials: credentials !== void 0 ? credentials : 'omit',
        // Pass all remaining options
        ... options
    }

    if (requestOptions.method === 'GET') {
        delete requestOptions.body
    }


    const response = await fetch(`${url}${queryString ? queryString : ''}`, requestOptions)
    if (response) {
        const responseData = await response.json()
        let error = responseData.error ? responseData.error : false
        return {
            body: responseData,
            error
        }
    }
}

/**
 *
 * @param response
 * @returns {{body: boolean, error: boolean, code: boolean}}
 */
export function handleResponse(response) {
    const data = typeof response === 'string' ? JSON.parse(response) : response
    let error = false
    if ('error' in data) {
        error = data.error
    } else if (response.body && 'error' in response.body) {
        error = response.body.error
    }

    return {
        body: response.body || false,
        error: error,
        code: response.code || false,
    }
}

/**
 *
 * @param options
 * @param msgHandler
 * @returns {WebSocket}
 */
export function requestWs(options, msgHandler = undefined) {
    const {
        url, params
    } = {...options}

    const urlString = params ? url + paramsToQuery(params) : url

    const ws = new TRXSocket(urlString)

    ws.onopen = (event) => {
        ws.send('Socket Connection Initialized')
    }

    /**
     *
     * @param {Object} message Message sent from TRX Services
     * @param {string} [message.data] Additional data in the message
     */
    ws.onmessage = (message) => {
        if ('data' in message && isJson(message.data)) {
            const data = JSON.parse(message.data)
            if ('keepAlive' in data) {
                pong(ws)
                delete data.keepAlive
            } else {
                ping(ws)
            }
            if ('action' in message) {
                data.action = message.action
                if ('payload' in message) {
                    data.payload = message.payload
                }
            }
            if (msgHandler !== void 0) {
                data.type = 'type' in message ? message.type : 'Websocket Message'
                msgHandler(data)
            }
        }
    }

    ws.onerror = event => {
        console.error('WebSocket error has occurred: ', event)
    }
    return ws
}

/**
 *
 * @param ws
 */
function ping(ws) {
    if (ws.readyState === SOCKET_OPEN) {
        ws.send('__ping__');
    } else {
        console.log('Server - connection needs to be closed for client: ' + ws);
    }
}

/**
 *
 * @param ws
 */
function pong(ws) {
    clearTimeout(ws.timer);
    ws.timer = setTimeout(function () {
        ping(ws);
    }, 20000)
}

/**
 *
 * @param params
 * @returns {*}
 */
function paramsToQuery (params) {
    if (params) {
        let keys = Object.keys({...params})
        if (keys.length > 0) {
            return '?' + keys.map(key => `${key}=${params[key]}`).join('&')
        }
    }
    return false
}

/**
 *
 * @param str
 * @returns {boolean}
 */
export function isJson(str) {
    try {
        JSON.parse(str);
    }
    catch (e) {
        return false;
    }
    return true;
}

/**
 *
 * @param {number|String} timestamp
 * @returns {String} A human-readable formatted timestamp
 */
export function formatTimestamp(timestamp, short = false) {
    return format(
        new Date(timestamp),
        short === false ? 'MMMM dd, YYYY - H:mm' : 'M/d H:mm:ss'
    )
}
