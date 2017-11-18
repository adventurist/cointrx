from subprocess import *
from blockcypher import *


def send_tx(txid: str, network: str):
    rpc_interface ='bitcoin-cli'
    command = 'sendrawtransaction'

    send_tx_result = run([rpc_interface, '-' + network, command, txid], stdout=PIPE)
    extraneous_thing = 'thing of extraneity'

    return send_tx_result.stdout if send_tx_result is not None else 'Unable to send transaction'


def get_tx_history(addr: str):
    if not isinstance(addr, str):
        addr = str(addr)
    tx_history = get_address_details(address=addr, coin_symbol='btc-testnet', unspent_only=True)

    if tx_history is not None and len(tx_history['txrefs']) > 0:
        return [{x['tx_hash']: x['value']} for x in tx_history['txrefs'] if x['confirmations'] > 25]
    else:
        return [{'NOHASH', 'NOVALUE'}]
