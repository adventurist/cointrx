from subprocess import *

import binascii
import hashlib
from blockcypher import get_address_details
from os import environ
from tornado.escape import json_decode
from pycoin.key import Key

b58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'


def make_command(interface, command, option1=None):
    if option1 is not None:
        return run([interface, command, option1], stdout=PIPE)
    else:
        return run([interface, command], stdout=PIPE)


def get_env_variables():
    return {
        'NODE_ENV': environ.get('NODE_ENV'),
        'NODE_PORT': environ.get('NODE_PORT'),
        'TRX_ENV': environ.get('TRX_ENV')
    }

    # interface = 'echo'
    # variables = [
    #     '$NODE_ENV',
    #     '$NODE_PORT',
    #     '$TRX_ENV'
    # ]
    # result = {}
    # for v in variables:
    #     get_env_result = make_command(interface, v)
    #     if get_env_result is not None:
    #         result[v] = get_env_result.stdout
    #
    # return result


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
            tx_history = [{'txid': x['txid'], 'value': int(x['amount'] * 100000000), 'idx': x['vout']} for x in decoded
                          if x['address'] == address and x['amount'] > 0]
            return tx_history


class RegTest:
    @staticmethod
    def make_command(interface, command, option1=None, option2=None):
        if option1 and option2 is not None:
            return run([interface, '-regtest', command, option1, option2], stdout=PIPE)
        elif option1 is not None:
            return run([interface, '-regtest', command, option1], stdout=PIPE)
        else:
            return run([interface, '-regtest', command], stdout=PIPE)

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
        command = 'listunspent'

        new_address_result = RegTest.make_command(interface, command)
        if len(new_address_result.stdout) > 0:
            result_for_tx = parse_tx_history(str(new_address_result.stdout, 'utf-8'), address)

            return result_for_tx if result_for_tx is not None else 'Error retrieving TX History'

        return None

    @staticmethod
    def address_to_wif(address):
        interface = 'bitcoin-cli'
        command = 'dumpprivkey'

        priv_key_result = RegTest.make_command(interface, command, address)

        return str(priv_key_result.stdout, 'utf-8')[
               :-1] if priv_key_result is not None else 'Error retrieving Private Key'

    @staticmethod
    def create_new_block():
        interface = 'bitcoin-cli'
        command = 'generate'
        param = '1'

        block_generate_result = RegTest.make_command(interface, command, param)

        return str(block_generate_result.stdout, 'utf-8')[
               :-1] if block_generate_result is not None else 'Error generating block'

    @staticmethod
    async def get_user_balance(keys: list):
        balance_array = []
        if keys is not None and len(keys) > 0:
            for key in keys:
                if key.status is True:
                    balance_for_key = await RegTest.get_tx_history(wif_to_address(key.value))
                    if balance_for_key is not None:
                        balance_for_key = sum(k['value'] for k in balance_for_key)
                        balance_array.append(balance_for_key)

            return sum(balance_array)
        else:
            return 0

    @staticmethod
    async def get_key_balance(key):
        if key['status'] is True:
            unspent_tx = await RegTest.get_tx_history(wif_to_address(key['value']))
            if unspent_tx is not None and len(unspent_tx) > 0:
                return sum(x['value'] for x in unspent_tx)
            return 0


    @staticmethod
    async def get_info():
        interface = 'bitcoin-cli'
        command = 'getinfo'

        get_info_result = RegTest.make_command(interface, command)

        return str(get_info_result.stdout, 'utf-8') if get_info_result is not None else 'Error retrieving block info'

    @staticmethod
    async def list_unspent():
        interface = 'bitcoin-cli'
        command = 'listunspent'

        list_unspent_result = RegTest.make_command(interface, command)

        return str(list_unspent_result.stdout,
                   'utf-8') if list_unspent_result is not None else 'Error retrieving unspent transactions'

    @staticmethod
    async def give_user_balance(address: str, satoshis: int):
        interface = 'bitcoin-cli'
        command = 'sendtoaddress'

        send_to_address_result = RegTest.make_command(interface, command, address, str(satoshis))

        return str(send_to_address_result.stdout,
                   'utf-8') if send_to_address_result is not None else 'Error retrieving unspent transactions'


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

def wif_to_private_key(wif):
    private_key = Key.from_text(wif, is_compressed=False)
    secret = private_key.sec_as_hex()
    text = private_key.as_text
    address = private_key.bitcoin_address
    ser = private_key.serialize()
    return private_key