from subprocess import *
from blockcypher import *
from pycoin.key import Key
from config import services
from tornado.escape import json_encode


def send_tx(txid: str, network: str):
    rpc_interface = 'bitcoin-cli'
    command = 'sendrawtransaction'

    send_tx_result = run([rpc_interface, '-' + network, command, txid], stdout=PIPE)
    extraneous_thing = 'thing of extraneity'

    return send_tx_result.stdout if send_tx_result is not None else 'Unable to send transaction'


def make_dir_in_home():
    result = run(['ls', '/home/logicp/Downloads/'], stdout=PIPE)
    if result:
        return result
    else:
        return json_encode({'error': True})


class RegTest:
    @staticmethod
    def get_new_address():
        interface = 'bitcoin-cli'
        command = 'getnewaddress'

        new_address_result = RegTest.make_command(interface, command)

        return new_address_result.stdout if new_address_result is not None else 'Unable to send transaction'

    @staticmethod
    def make_command(interface, command):
        return run([interface, '-regtest', command], stdout=PIPE)


def get_tx_history(addr: str):
    if not isinstance(addr, str):
        addr = str(addr)
    tx_history = get_address_details(address=addr, coin_symbol='btc-testnet', unspent_only=True)
    transactions = []
    tx_hashes = []
    if tx_history is not None and len(tx_history['txrefs']) > 0:
        for x in tx_history['txrefs']:
            if x['confirmations'] > 25 and x['tx_hash'] not in tx_hashes:
                tx_hashes.append(x['tx_hash'])
                transactions.append({'txid': x['tx_hash'], 'idx': x['tx_output_n'], 'value': x['value']})
        return transactions
    else:
        return [{'NOHASH', 'NOVALUE'}]


def wif_to_address(wif: str):
    private_key = Key.from_text(wif)
    address = private_key.address()
    return address


class BCypher:
    @staticmethod
    def bcypher_chain_info():
        return get_blockchain_overview()

    @staticmethod
    def bcypher_generate_address():
        return generate_new_address('bcy', services.BLOCKCYPHER['api_key'])
