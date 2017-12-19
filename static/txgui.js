
$('document').ready(() => {
    let sendButton = document.getElementById('submit-tx')

    sendButton.addEventListener('click', () => {
        event.preventDefault()
        event.stopPropagation()
        const recipient = $('#to-address').val()
        const senderPrivateKey = $('#from-secret').val()
        const satoshis = $('#satoshis').val()

        console.log("Recipient: " + recipient + "\n" + "Sender Key: " + senderPrivateKey + "\n" + "Amount: " + satoshis)

    })
})