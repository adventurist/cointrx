import struct
import sys
import hashlib
import ecdsa

import codecs
# from tornado import websocket
from bitcoin import main as btc_tools, transaction as tx_func, mksend, multisign, sendmultitx, mk_multisig_script, \
    scriptaddr, apply_multisignatures
from bitcoin.core import x, b2x, lx, COIN, COutPoint, CMutableTxOut, CMutableTxIn, CMutableTransaction, Hash160, b2lx
from bitcoin.core.script import CScript, OP_DUP, OP_HASH160, OP_EQUALVERIFY, OP_CHECKSIG, SignatureHash, SIGHASH_ALL
from bitcoin.core.scripteval import VerifyScript, SCRIPT_VERIFY_P2SH
from bitcoin.wallet import CBitcoinAddress, CBitcoinSecret, P2PKHBitcoinAddress,P2SHBitcoinAddress
from bitcoin.rpc import Proxy

# from pycoin.services import spendables_for_address

from utils.cointrx_client import Client
from utils import btcd_utils
from tornado.escape import json_encode, json_decode
from db import db



transaction_input = 'eca213168d3683c86591890e766c76ab618e0c245925ebcaddc855aecb2643a1'
#
sender_address = 'miPtyvZgdXidDug4msfFyBpMy2z8VrkR1C'
sender_address = 'mguJenq4Jf2yXE41KAxDDacjpAveP4RQDY'
recipient_address = 'migrBFM4Xd4LNBui6XwEkU74Zehh7ZkR4M'
#
# # input_tx_size = 5.79975191 * COIN
input_tx_size = 5.10131318 * COIN
# input_tx_size = 1.3 * COIN

magic = 0xd9b4bef9

b58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

def countLeadingChars(s, ch):
    count = 0
    for c in s:
        if c == ch:
            count += 1
        else:
            break
    return count

def base58encode(n):
    result = ''
    while n > 0:
        result = b58[n%58] + result
        n /= 58
    return result

def base256decode(s):
    result = 0
    for c in s:
        result = result * 256 + ord(c)
    return result

def base58CheckEncode(version, payload):
    s = chr(version) + payload
    checksum = hashlib.sha256(hashlib.sha256(s).digest()).digest()[0:4]
    result = s + checksum
    leadingZeros = countLeadingChars(result, '\0')
    return '1' * leadingZeros + base58encode(base256decode(result))

def privateKeyToPubKey(s):
    sk = ecdsa.SigningKey.from_string(s, curve=ecdsa.SECP256k1)
    return codecs.hex('\04' + str(sk.verifying_key))

def pubKeyToAddr(s,p):
    ripemd160 = hashlib.new('ripemd160')
    ripemd160.update(hashlib.sha256(s.decode('hex')).digest())
    return base58CheckEncode(p, ripemd160.digest())

def keyToAddr(s,testnet=False):
    # see https://en.bitcoin.it/wiki/List_of_address_prefixes
    # ie: mainnet --> 0 and testnet --> 111
    prefix = 111 if testnet else 0
    return pubKeyToAddr(privateKeyToPubKey(s),prefix)

class TestnetData:
    start_fee = 2000
    address2 = 'miPtyvZgdXidDug4msfFyBpMy2z8VrkR1C'
    address1 = 'migrBFM4Xd4LNBui6XwEkU74Zehh7ZkR4M'
    priv2 = 'cTbUQ5gLKwt1PEXJiuhkgFE3pxij6TMRseuiEK8oFdvSKpSgDn7o'
    priv1 = 'cSfUQtuJ1sYPtbahUPDB8ZvL3cG7Dkd7m5VVAPGVJCebHxV7zmzh'
    txid1 = u'f34c411aed0e707854f39f603835bd8575504950c781a1bf13598c2806f61327:0'
    tx_amount = int(1.69 * COIN)

    send_amount = int(tx_amount - 2000)


class TestTx:

    def __init__(self, r, v, k):
        self.recipient = r
        self.amount = v
        self.private_key = k


class Transaction:

    def __init__(self, session):
        self.session = session

    async def testnet_run(self):
        if TestnetData.address1:
            if not await db.findKey(TestnetData.priv1):
                result = await db.addSingleKey(TestnetData.priv1, self.session.user['id'])

            tx_history = btcd_utils.get_tx_history(TestnetData.address1)
            tx_input = []
            tx_input_amount = 0

            for v in tx_history:
                if tx_input_amount < TestnetData.send_amount:
                    tx_input.append({'output': str((next(iter(v.keys())) + ':0')), 'value': next(iter(v.values())),
                                    'address': TestnetData.address1, 'wif': TestnetData.priv1})
                    tx_input_amount += next(iter(v.values()))
                else:
                    break

            tx_input_total = sum(x['value'] for x in tx_input)
            tx_remain_amount = tx_input_total - TestnetData.send_amount
            tx_output = [{'value': TestnetData.send_amount - 1000, 'address': TestnetData.address2},
                         {'value': tx_remain_amount, 'address': TestnetData.address1}]

            client = Client()
            response = await client.connect('http://localhost:3000/transaction', json_encode({'txIn': tx_input, 'txOut': tx_output, 'network': 'testnet'}))

            if response:
                print(response)
                data = json_decode(response.body.decode())
                result = data.get('result', 'error')
                if result != 'error':
                    btcd_utils.send_tx(result, 'testnet')

            #
            # # locals()["_[1]"]
            # tx_input = [{'output': str((next(iter(v.keys())) + ':0')), 'value': next(iter(v.values())),
            #              'address': TestnetData.address1, 'wif': TestnetData.priv1} for v in tx_history]

            # tx_input_total = sum(x['value'] for x in tx_input)


    @staticmethod
    async def send_text_tx(to, amount, key):
        new_tx = TestTx(r=to, v=amount, k=key)
        if new_tx:

            tx_history = btcd_utils.get_tx_history(TestnetData.address1)
            tx_input = []
            tx_input_amount = 0

            for v in tx_history:
                if tx_input_amount < TestnetData.send_amount:
                    tx_input.append({'output': str((next(iter(v.keys())) + ':0')), 'value': next(iter(v.values())),
                                     'address': TestnetData.address1, 'wif': TestnetData.priv1})
                    tx_input_amount += next(iter(v.values()))
                else:
                    break

            tx_input_total = sum(x['value'] for x in tx_input)
            tx_remain_amount = tx_input_total - TestnetData.send_amount
            tx_output = [{'value': TestnetData.send_amount - 1000, 'address': TestnetData.address2},
                         {'value': tx_remain_amount, 'address': TestnetData.address1}]

            client = Client()
            response = await client.connect('http://localhost:3000/transaction', json_encode({'txIn': tx_input, 'txOut': tx_output, 'network': 'testnet'}))

            if response:
                print(response)
                data = json_decode(response.body.decode())
                result = data.get('result', 'error')
                if result != 'error':
                    btcd_utils.send_tx(result, 'testnet')

    @staticmethod
    async def request_transaction(*kwargs):

        if kwargs[0] is not None:
            new_tx = TestTx(r=kwargs[0]['recipient'], v=kwargs[0]['amount'], k=kwargs[0]['private_key'])
            if new_tx:
                h = hashlib.sha256(str(new_tx.private_key).encode()).digest()
                sender_addr = keyToAddr(h, testnet=True)
                # sender_priv_decoded = btc_tools.sha256(new_tx.private_key)
                # sender_pub = btc_tools.privtopub(sender_priv_decoded)
                # sender_addr = btc_tools.pubtoaddr(sender_pub)
                tx_history = btcd_utils.get_tx_history(sender_addr)
                tx_input = []
                tx_input_amount = 0

                for v in tx_history:
                    if tx_input_amount < new_tx.amount:
                        tx_input.append({'output': str((next(iter(v.keys())) + ':0')), 'value': next(iter(v.values())),
                                         'address': sender_addr, 'wif': new_tx.private_key})
                        tx_input_amount += next(iter(v.values()))
                    else:
                        break

                tx_input_total = sum(x['value'] for x in tx_input)
                tx_remain_amount = tx_input_total - new_tx.amount
                tx_output = [{'value': new_tx.amount - 1000, 'address': new_tx.recipient},
                             {'value': tx_remain_amount, 'address': sender_addr}]

                client = Client()
                response = await client.connect('http://localhost:3000/transaction', json_encode({'txIn': tx_input, 'txOut': tx_output, 'network': 'testnet'}))

                if response:
                    print(response)
                    data = json_decode(response.body.decode())
                    result = data.get('result', 'error')
                    if result != 'error':
                        btcd_utils.send_tx(result, 'testnet')


    @staticmethod
    def run_alt():

        send_amnt = 0.001 * COIN
        remain_amnt = input_tx_size - send_amnt

        rpc = Proxy(service_port=18332)
        txin_raw = rpc.getrawtransaction(lx(transaction_input))

        vout_tx = [txin_raw.vout.index(x) for x in txin_raw.vout if x.nValue == input_tx_size]

        if send_amnt + remain_amnt == input_tx_size:
            print('Amounts are equal')
        else:
            raise ArithmeticError('Unequal amounts for transaction. Will likely raise OP_EQUALVERIFY failure')

        tx_fee = 100 * 160

        # Get ID of input transaction

        txid = lx(transaction_input)
        vout = vout_tx[0]

        txout_remainder = CMutableTxOut(remain_amnt - tx_fee, CBitcoinAddress(sender_address))

        txin = CMutableTxIn(COutPoint(txid, vout))
        tx_fee = 100 * 160
        # tx_fee = 0
        txout = CMutableTxOut(send_amnt, CBitcoinAddress(recipient_address))
        tx = CMutableTransaction([txin], [txout, txout_remainder])

        txout_remainder = CMutableTxOut(remain_amnt - tx_fee, CBitcoinAddress(sender_address))

        # Create brainwallet secret key

        h = hashlib.sha256(b'correct horse battery staple').digest()
        seckey = CBitcoinSecret.from_secret_bytes(h)

        # Create INPUT transaction structure (with empty scriptSig to be replaced later)
        txin = CMutableTxIn(COutPoint(txid, vout))

        # Get scriptPubKey from output of what we are spending
        txin_scriptPubKey = CScript([OP_DUP, OP_HASH160, Hash160(seckey.pub), OP_EQUALVERIFY, OP_CHECKSIG])

        # Create the OUTPUT transaction structure (with scriptPubKey from btc address
        txout = CMutableTxOut(0.001 * COIN, CBitcoinAddress(recipient_address))

        # Create unsigned transaction
        tx = CMutableTransaction([txin], [txout, txout_remainder])

        # Calculate hash
        sighash = SignatureHash(txin_scriptPubKey, tx, 0, SIGHASH_ALL)

        # Sign transaction
        sig = seckey.sign(sighash) + bytes([SIGHASH_ALL])

        # set scriptSig of our INPUT transaction
        txin.scriptSig = CScript([sig, seckey.pub])

        # Verify signature worked
        VerifyScript(txin.scriptSig, txin_scriptPubKey, tx, 0, (SCRIPT_VERIFY_P2SH,))

        # Print transaction for record

        transaction_final_out = b2x(tx.serialize())

        proxy = Proxy(service_port=18332)
        proxy_info = proxy.getinfo()
        r = proxy.sendrawtransaction(tx, allowhighfees=True)

        print(r)


# def getVersionMsg():
#     version = 60002
#     services = 1
#     timestamp = int(time.time())
#     addr_me = TrxUtils.netaddr(socket.inet_aton("127.0.0.1"), 8333)
#     addr_you = TrxUtils.netaddr(socket.inet_aton("127.0.0.1"), 8333)
#     nonce = random.getrandbits(64)
#     sub_version_num = TrxUtils.varstr('')
#     start_height = 0

class RegtestData:
    address1 = 'mpDYCdUn23TTbyyWtfYScfkggAkbgSLjHR'
    balance1 = 39.99896160
    txid1 = '27c9f60c7c292ffdeb256c70d11e1cbb4f92729ae6eda21d0869e3efe98d121b'
    vout1 = 0
    address2 = 'mv8p8mR4cWmteUfpz6gcz5ndH3QiKLSYTy'
    send_amount = balance1 - 0.001


