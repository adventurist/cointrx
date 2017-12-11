import struct
import sys
import hashlib

# from tornado import websocket
from bitcoin import main as btc_tools, transaction as tx_func, mksend, multisign, sendmultitx, mk_multisig_script, \
    scriptaddr, apply_multisignatures
from bitcoin.core import b2x, lx, COIN, COutPoint, CMutableTxOut, CMutableTxIn, CMutableTransaction, Hash160, b2lx
from bitcoin.core.script import CScript, OP_DUP, OP_HASH160, OP_EQUALVERIFY, OP_CHECKSIG, SignatureHash, SIGHASH_ALL
from bitcoin.core.scripteval import VerifyScript, SCRIPT_VERIFY_P2SH
from bitcoin.wallet import CBitcoinAddress, CBitcoinSecret
from bitcoin.rpc import Proxy

# from pycoin.services import spendables_for_address

from utils.cointrx_client import Client
from utils import btcd_utils
from tornado.escape import json_encode


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

class TestnetData:
    start_fee = 2000
    address2 = 'miPtyvZgdXidDug4msfFyBpMy2z8VrkR1C'
    address1 = 'migrBFM4Xd4LNBui6XwEkU74Zehh7ZkR4M'
    priv2 = 'cTbUQ5gLKwt1PEXJiuhkgFE3pxij6TMRseuiEK8oFdvSKpSgDn7o'
    priv1 = 'cSfUQtuJ1sYPtbahUPDB8ZvL3cG7Dkd7m5VVAPGVJCebHxV7zmzh'
    # txid1 = '5381cd7bdee5629b2621dbbb8347f071a8db5a2733404edd7f55caf827e50602'
    # txid1 = u'f160bd9bb06c4f6fb38d1edae178393cabd99df658a08907bf1a138ce407daa2:0'
    # txid1 = u'a0b993b0f3ea76545669b0bc80b1293ababe9304a41a9b16473284b56dae1801:0'
    # txid1 = u'20bbefbd839f50d89720a868c161e25765641cb74dfaadbf056e7ffd5e07945c:0'
    # txid1 = u'92b5c0df7808a268c33144db28147d2c5cac29ab053a5b7d04d003d77fcd61a4:0'
    txid1 = u'f34c411aed0e707854f39f603835bd8575504950c781a1bf13598c2806f61327:0'
    # tx_amount = int(0.65 * COIN)
    tx_amount = int(1 * COIN)
    # tx_amount = int(1.72899739 * COIN)

    send_amount = int(tx_amount - 3000)

class transaction:
    async def testnet_run(self):
        if TestnetData.address1:
            # tx_input_orig = [{'output': TestnetData.txid1, 'value': TestnetData.tx_amount, 'address':
            # TestnetData.address1}] tx = tx_func.mktx(tx_input_orig, [{'value': tx_input_total - 1000, 'address':
            # TestnetData.address2}]) tx = tx_func.mktx(tx_input, [{'value': TestnetData.send_amount, 'address':
            # TestnetData.address2}])

            item_output = None

            tx_history = btcd_utils.get_tx_history(TestnetData.address1)
            tx_input = [{'output': str((next(iter(v.keys())) + ':0')), 'value': next(iter(v.values())),
                         'address': TestnetData.address1} for v in tx_history]

            tx_input_total = sum(x['value'] for x in tx_input)
            tx_remain_amount = tx_input_total - TestnetData.send_amount
            tx_output = [{'value': TestnetData.send_amount, 'address': TestnetData.address2},
                         {'value': tx_remain_amount, 'address': TestnetData.address1}]
            tx = tx_func.mktx(tx_input, [{'value': TestnetData.send_amount, 'address': TestnetData.address2},
                                         {'value': tx_remain_amount, 'address': TestnetData.address1}])

            client = Client()
            response = await client.connect('http://localhost:3000/transaction', json_encode({'txIn': tx_input, 'txOut': tx_output}))

            if response:
                print(response)

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


