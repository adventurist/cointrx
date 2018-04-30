const SOCKET_CONNECTING = 0;
const SOCKET_OPEN = 1;
const SOCKET_CLOSING = 2;
const SOCKET_CLOSED = 3;

export async function request(options) {
    const {
        url,
        method,
        params,
        body,
        headers,
        credentials
    } = {...options}

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
        body: body !== void 0 ? body : '',
        headers: requestHeaders,
        credentials: credentials !== void 0 ? credentials : 'omit'
    }

    if (requestOptions.method === 'GET') {
        delete requestOptions.body
    }


    const response = await fetch(`${url}${queryString ? queryString : ''}`, requestOptions)
    if (response) {
        let error = response.error
        const responseData = await response.json()
        return {
            body: responseData,
            error: error !== undefined ? error : false,
        }
    }
    // return fetch('http://localhost:6969/bot/start' + queryString, requestOptions)
    //     .then(response => {
    //         let error = response.error
    //         return response.json()
    //             .then(responseBody => {
    //                 return {
    //                     body: responseBody,
    //                     error: error !== undefined ? error : false,
    //                 }
    //             })
    //     })
}

export function handleResponse(response) {
    const data = typeof response === 'string' ? JSON.parse(response) : response
    let error = false
    if ('error' in data) {
            error = data.error
    }

    return {
        body: 'body' in response ? response.body : false,
        error: error,
        code: 'code' in response ? response.body : false,
    }
}

export function requestWs(options) {
    const {
        url, params
    } = {...options}

    const urlString = params ? url + paramsToQuery(params) : url

    const ws = new WebSocket(urlString)

    Object.defineProperty(ws, 'timer', {writable: true, value: undefined})

    ws.onopen = (event) => {
        console.log(event)
        ws.send('HELLO FROM THE FRONT END, BITCHES!!')
    }

    ws.onmessage = (message) => {
        console.log(message)
        if ('data' in message && isJson(message.data)) {
            const data = JSON.parse(message.data)
            if ('keepAlive' in data) {
                pong(ws)
            } else {
                ping(ws)
            }
        }
        if ('data' in message) {
            console.log(message.data)
        }
        if ('type' in message) {
            console.log(`WS Data Event Type: ${message.type}`)
        }
    }

    return ws
}

function ping(ws) {
    if (ws.readyState === SOCKET_OPEN) {
        ws.send('__ping__');
    } else {
        console.log('Server - connection needs to be closed for client: ' + ws);
    }
}

function pong(ws) {
    console.log('Server - ' + ws + ' is still active');
    clearTimeout(ws.timer);
    ws.timer = setTimeout(function () {
        ping(ws);
    }, 20000)
}

function paramsToQuery (params) {
    if (params) {
        let keys = Object.keys({...params})
        if (keys.length > 0) {
            return '?' + keys.map(key => `${key}=${params[key]}`).join('&')
        }
    }
    return false
}

export function isJson(str) {
    try {
        JSON.parse(str);
    }
    catch (e) {
        return false;
    }
    return true;
}