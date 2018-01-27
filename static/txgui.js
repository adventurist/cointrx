import { PrivateKey, Networks } from 'bitcore-lib'

const btc = 100000000

const urls = {
    sendTransaction: txUrl,
    blockGenerate: blockgenUrl,
    userBalance: userBalanceUrl
};

let userTransaction = {
    sender: undefined,
    recipient: undefined
}

function updateProgress(oEvent) {
    if (oEvent.lengthComputable) {
        var percentComplete = oEvent.loaded / oEvent.total;
        console.log(percentComplete);
    } else {
        // Unable to compute progress information since the total size is unknown
    }
}

function transferComplete(evt) {
    console.log("The transfer is complete.");
}

function transferFailed(evt) {
    console.log("An error occurred while transferring the file.");
}

function transferCanceled(evt) {
    console.log('Transfer cancelled')
}

$('document').ready(() => {
    let sendButton = document.getElementById('submit-tx')

    sendButton.addEventListener('click', () => {

        event.preventDefault()
        event.stopPropagation()

        const recipient = $('#to-address').val()
        const senderAddress = $('#from-address').val()
        const senderWIF = $('#from-secret').val()
        const satoshis = $('#satoshis').val()

        const senderPrivateKey = PrivateKey.fromWIF(senderWIF)
        // const senderAddress = senderPrivateKey.toAddress(Networks.testnet)

        console.log("Recipient: " + recipient + "\n" + "Sender Key: " + senderPrivateKey + "\n" + "Sender Address: " + senderAddress + "Amount: " + satoshis)

        const xhr = xhrRequest(
            urls.sendTransaction, {
                address: senderAddress,
                key: senderWIF
            },
            recipient,
            satoshis)
        console.dir(xhr)
    })
})

$('document').ready(() => {
    let sendButton = document.getElementById('submit-tx');

    sendButton.addEventListener('click', () => {
        event.preventDefault();
        event.stopPropagation();

        const recipient = $('#to-address').val();
        const senderAddress = $('#from-address').val();
        const senderWIF = $('#from-secret').val();
        const satoshis = 100000000 * $('#satoshis').val();

        const senderPrivateKey = PrivateKey.fromWIF(senderWIF)
        // const senderAddress = senderPrivateKey.toAddress(Networks.testnet)

        console.log("Recipient: " + recipient + "\n" + "Sender Key: " + senderPrivateKey + "\n" + "Sender Address: " + senderAddress + "Amount: " + satoshis);

        const xhr = xhrFetchRequest(urls.sendTransaction, {
            address: senderAddress,
            key: senderWIF
        }, recipient, satoshis);
    });
});

const xhrRequest = (url, senderData, recipient, amount) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
        console.dir(_arguments);
    };
    xhr.addEventListener('progress', updateProgress);
    xhr.addEventListener('abort', transferCanceled);
    xhr.addEventListener('error', transferFailed);

    xhr.open("POST", url);

    xhr.setRequestHeader('Content-Type', 'application/json');
    // TODO change sender parameter to object with keyed properties for address and private key
    xhr.send(JSON.stringify({
        sender: senderData,
        recipient: recipient,
        amount: amount
    }));

    return xhr;
};

const xhrFetch = (url, method, data) => {
    let options = {
        method: method,
        headers: new Headers({'Content-Type': 'application/json'})
    }
    if (method === 'POST' && data !== void 0) {
        options.body = JSON.stringify(data)
    }
    fetch(url, options).then(res =>
        res.json()
            .catch(error =>
                console.error('Error:', error)
            ))
        .then(response => {
            console.log('Success')
            console.dir(response)
            updateUserBalance(response)
        })
}

const xhrFetchRequest = (url, senderData, recipient, amount) => {
    fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            sender: senderData,
            recipient: recipient,
            amount: amount
        }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    }).then(res =>
        res.json()
            .catch(error =>
                console.error('Error:', error)
            ))
        .then(response => {
            if (response.response === 200) {
                xhrFetch(urls.userBalance + '?sid=' + userTransaction.sender + '&rid=' + userTransaction.recipient, 'GET', userTransaction)
            }
            console.log('Success:', response)
        })
}

const xhrBaseRequest = (url, params, type) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
        console.dir(_arguments);
    };
    xhr.addEventListener('progress', updateProgress);
    xhr.addEventListener('abort', transferCanceled);
    xhr.addEventListener('error', transferFailed);

    xhr.open(type, url);

    xhr.setRequestHeader('Content-Type', 'application/json');
    // TODO change sender parameter to object with keyed properties for address and private key
    xhr.send();

    return xhr;
};

const wifToAddress = (wif) => {
    return (PrivateKey.fromWIF(wif)).toAddress(Networks.testnet)
}

const buttonListeners = () => {
    const wifElement = document.getElementById('from-secret');
    const addElement = document.getElementById('from-address');
    const toElement = document.getElementById('to-address');

    Array.from(document.querySelectorAll('.user-wrap > button')).forEach(button => {
        button.addEventListener('click', e => {
            let addresses = findUserAddress(e);

            if (addresses !== null && addresses.length > 0) {
                toElement.value = addresses[addresses.length - 1];
            }//
        });
    });

    Array.from(document.querySelectorAll('.key-row > button')).forEach(button => {
        button.addEventListener('click', e => {
            let wif = findUserWif(e);

            if (wif !== null && wif !== void 0) {
                wifElement.value = wif;
                addElement.value = wifToAddress(wif);
            }
        });
    });

    document.getElementById('trx-add-block').addEventListener('click', () => {
        const request = xhrBaseRequest(urls.blockGenerate, {}, 'GET');
    });
};

const findUserAddress = e => {
    let addresses = [];
    Array.from(e.srcElement.parentElement.querySelectorAll('.user-keys .wif-value')).forEach(key => {
        let add = wifToAddress(key.value);
        addresses.push(add.toString());
    });
    userTransaction.recipient = e.srcElement.nextElementSibling.querySelector('.user-data span.user-id').textContent
    return addresses;
};

const findUserWif = e => {
    userTransaction.sender = e.srcElement.parentElement.parentElement.parentElement.parentElement.querySelector('.user-data span.user-id').textContent
    return e.srcElement.previousElementSibling.value;
};

function updateUserBalance(userData) {
    userData = Array.isArray(userData) ? userData : [userData]
    userData.forEach( (user) => {
        let uid = Object.keys(user)[0]
        document.getElementById('user-data-container').querySelectorAll('.user-data').forEach( (userContainer) => {
            let userId = userContainer.querySelector('.user-id span.user-id').textContent
            if (userId == uid) {
                userContainer.querySelector('.user-balance span.user-balance').textContent = `${(user.uid / btc)} BTC`
            }
        })
    })
}

buttonListeners();
