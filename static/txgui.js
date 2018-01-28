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

let trxPendingTransactions = []
let trxPendingCounter = 1

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
    const queueButton = document.getElementById('submit-tx')
    const sendMasterButton = document.getElementById('trx-send-transactions')

    queueButton.addEventListener('click', () => {
        event.preventDefault();
        event.stopPropagation();

        const recipient = $('#to-address').val();
        const senderAddress = $('#from-address').val();
        const senderWIF = $('#from-secret').val();
        const satoshis = 100000000 * $('#satoshis').val();

        const senderPrivateKey = PrivateKey.fromWIF(senderWIF)
        // const senderAddress = senderPrivateKey.toAddress(Networks.testnet)

        console.log("Recipient: " + recipient + "\n" + "Sender Key: " + senderPrivateKey + "\n" + "Sender Address: " + senderAddress + "Amount: " + satoshis);

        addPendingTransaction({
            address: senderAddress,
            key: senderWIF
        }, recipient, satoshis)
    });

    sendMasterButton.addEventListener('click', () => {
        if (trxPendingTransactions.length > 0) {
            try {
                trxPendingTransactions.forEach( (pendingTrx) => {
                    const xhr = xhrFetchRequest(urls.sendTransaction, {
                        address: pendingTrx.sender.address,
                        key: pendingTrx.sender.key
                    }, pendingTrx.recipient, pendingTrx.satoshis);
                })
                // TODO Find a better way to verify transactions were sent before replacing trxPending with empty array
                clearPendingTransactions()
            } catch (err) {
                console.error(err)
            }
        }
    })
});

function clearPendingTransactions() {
    trxPendingTransactions = []
    const pendingContainer = document.getElementById('trx-pending')
    while (pendingContainer.hasChildNodes()) {
        pendingContainer.removeChild(pendingContainer.lastChild)
    }
}
function addPendingTransaction (address, recipient, satoshis) {
    trxPendingTransactions.push({
        sender: {
            address: address.address,
            key: address.key
        },
        recipient: recipient,
        satoshis: satoshis
    })
    const pendingWrap = document.getElementById('trx-pending')
    const trxHeader = document.createElement('h3')
    const wrap = document.createElement('div')
    const senderArea = document.createElement('textarea')
    const senderLabel = document.createElement('label')
    const recipientArea = document.createElement('textarea')
    const recipientLabel = document.createElement('label')
    const amountArea = document.createElement('textarea')
    const amountLabel = document.createElement('label')

    senderArea.className = 'trx-pending-sender'
    senderArea.textContent = JSON.stringify(address)
    senderLabel.className = 'trx-pending-sender-label'
    senderLabel.textContent = 'Sender'
    recipientArea.className = 'trx-pending-recipient'
    recipientArea.textContent = JSON.stringify(recipient)
    recipientLabel.className = 'trx-pending-recipient-label'
    recipientLabel.textContent = 'Recipient'
    amountArea.className = 'trx-pending-amount'
    amountArea.textContent = satoshis
    amountLabel.className = 'trx-pending-amount-label'
    amountLabel.textContent = 'Amount (Satoshis)'

    trxHeader.textContent = 'TX: ' + trxPendingCounter

    wrap.appendChild(trxHeader)
    wrap.appendChild(senderLabel)
    wrap.appendChild(senderArea)
    wrap.appendChild(recipientLabel)
    wrap.appendChild(recipientArea)
    wrap.appendChild(amountLabel)
    wrap.appendChild(amountArea)

    pendingWrap.appendChild(wrap)

    trxPendingCounter++;
}

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
