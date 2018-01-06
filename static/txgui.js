import { PrivateKey, Networks } from 'bitcore-lib'

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

        const xhr = xhrRequest({address: senderAddress, key: senderWIF}, recipient, satoshis)

    })
})

const xhrRequest = (senderData, recipient, amount) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
        console.dir(arguments)
    }
    xhr.addEventListener('progress', updateProgress)
    xhr.addEventListener('abort', transferCanceled)
    xhr.addEventListener('error', transferFailed)

    xhr.open("POST", "http://localhost:6969/transaction/request");


    xhr.setRequestHeader('Content-Type', 'application/json');
// TODO change sender parameter to object with keyed properties for address and private key
    xhr.send(JSON.stringify({
        sender: senderData,
        recipient: recipient,
        amount: amount
    }));


    return xhr
}


// ...

// progress on transfers from the server to the client (downloads)
function updateProgress (oEvent) {
    if (oEvent.lengthComputable) {
        var percentComplete = oEvent.loaded / oEvent.total;
        console.log(percentComplete)
        // ...
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
    console.log("The transfer has been canceled by the user.");
}