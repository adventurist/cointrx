import { PrivateKey, Networks } from 'bitcore-lib'

const urls = {
    sendTransaction: "http://localhost:6969/transaction/request"
}

$('document').ready(() => {
    let sendButton = document.getElementById('submit-tx')

    sendButton.addEventListener('click', () => {

        event.preventDefault()
        event.stopPropagation()

        const recipient = $('#to-address').val()
        // const senderAddress = $('#from-address').val()
        const senderWIF = $('#from-secret').val()
        const satoshis = $('#satoshis').val()

        const senderPrivateKey = PrivateKey.fromWIF(senderWIF)
        const senderAddress = senderPrivateKey.toAddress(Networks.testnet)

        console.log("Recipient: " + recipient + "\n" + "Sender Key: " + senderPrivateKey + "\n" + "Sender Address: " + senderAddress + "Amount: " + satoshis)

        const xhr = xhrRequest(
            urls.sendTransaction, {
                address: senderAddress,
                key: senderWIF
            },
            recipient,
            satoshis)
    })
})

const xhrRequest = (url, senderData, recipient, amount) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
        console.dir(arguments)
    }
    xhr.addEventListener('progress', updateProgress)
    xhr.addEventListener('abort', transferCanceled)
    xhr.addEventListener('error', transferFailed)

    xhr.open("POST", url);


    xhr.setRequestHeader('Content-Type', 'application/json');
// TODO change sender parameter to object with keyed properties for address and private key
    xhr.send(JSON.stringify({
        sender: senderData,
        recipient: recipient,
        amount: amount
    }));


    return xhr
}

const wifToAddress = (wif) => {
    const address = (PrivateKey.fromWIF(wif)).toAddress(Networks.testnet)

    return address
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
            }
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
};

const findUserAddress = e => {
    let addresses = [];
    Array.from(e.srcElement.parentElement.querySelectorAll('.user-keys .wif-value')).forEach(key => {
        let add = wifToAddress(key.value);
        addresses.push(add.toString());
    });
    return addresses;
};

const findUserWif = e => {
    return e.srcElement.previousElementSibling.value;
};

buttonListeners();
