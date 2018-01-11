from subprocess import *

import binascii
import codecs
import hashlib
from tornado.escape import json_decode
from blockcypher import *
from pycoin.key import Key
from config import services

b58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'


def send_tx(txid: str, network: str):
    rpc_interface = 'bitcoin-cli'
    command = 'sendrawtransaction'

    send_tx_result = run([rpc_interface, '-' + network, command, txid], stdout=PIPE)
    extraneous_thing = 'thing of extraneity'

    return send_tx_result.stdout if send_tx_result is not None else 'Unable to send transaction'


def parse_tx_history(stdout, address):
    if stdout is not None and isinstance(stdout, str):
        decoded = json_decode(stdout)
        if decoded is not None:
            print(str(decoded))
            tx_history = [{'txid': x['txid'], 'value': int(x['amount'] * 100000000), 'idx': x['vout']} for x in decoded if x['address'] == address and x['amount'] > 0]
            return tx_history


class RegTest:
    @staticmethod
    def get_new_address():
        interface = 'bitcoin-cli'
        command = 'getnewaddress'

        new_address_result = RegTest.make_command(interface, command)

        return str(new_address_result.stdout, 'utf-8')[
               :-1] if new_address_result is not None else 'Error creating address'

    @staticmethod
    async def get_tx_history(address):
        interface = 'bitcoin-cli'
        command = 'listtransactions'

        new_address_result = RegTest.make_command(interface, command)

        result_for_tx = parse_tx_history(str(new_address_result.stdout, 'utf-8'), address)
        return result_for_tx if new_address_result is not None else 'Error retrieving TX History'

    @staticmethod
    def address_to_wif(address):
        interface = 'bitcoin-cli'
        command = 'dumpprivkey'

        priv_key_result = RegTest.make_command(interface, command, address)

        return str(priv_key_result.stdout, 'utf-8')[
               :-1] if priv_key_result is not None else 'Error retrieving Private Key'

    @staticmethod
    def make_command(interface, command, option1=None):

        if option1 is not None:
            return run([interface, '-regtest', command, option1], stdout=PIPE)
        else:
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


def priv_to_wif(priv_key: str):
    wif = 'jigga'

    return wif


def b58encode(n):
    result = ''
    while n > 0:
        result = b58[n % 58] + result
        n /= 58
    return result


def b256decode(s):
    result = 0
    for c in s:
        result = result * 256 + ord(c)
    return result


def count_leading_chars(s, ch):
    count = 0
    for c in s:
        if c == ch:
            count += 1
        else:
            break
    return count


def b58_check_encode(version, payload):
    s = chr(version) + payload
    checksum = hashlib.sha256(hashlib.sha256(s).digest()).digest()[0:4]
    result = s + checksum
    leadingZeros = count_leading_chars(result, '\0')
    return '1' * leadingZeros + b58encode(b256decode(result))


def priv_key_to_wif(key_hex):
    return b58_check_encode(0x80, binascii.unhexlify(key_hex))


class BCypher:
    @staticmethod
    def bcypher_chain_info():
        return get_blockchain_overview()

    @staticmethod
    def bcypher_generate_address():
        return generate_new_address('bcy', services.BLOCKCYPHER['api_key'])
