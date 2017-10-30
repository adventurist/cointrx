import struct
import time
import random
import sys

import sys, hashlib, socket
from utils import websocket
from bitcoin import SelectParams, wallet
from bitcoin.core import b2x, lx, COIN, COutPoint, CMutableTxOut, CMutableTxIn, CMutableTransaction, Hash160, b2lx
from bitcoin.core.script import CScript, OP_DUP, OP_HASH160, OP_EQUALVERIFY, OP_CHECKSIG, SignatureHash, SIGHASH_ALL
from bitcoin.core.scripteval import VerifyScript, SCRIPT_VERIFY_P2SH
from bitcoin.wallet import CBitcoinAddress, CBitcoinSecret
from bitcoin.rpc import Proxy
from tornado import websocket as ws

from utils.btc_codeutils import TrxUtils

# choose network (testnet for development purposes)
SelectParams('testnet')

# transaction_input = 'f997fdcea10bbe7e50087c3bb0e960d2fd6e70f8bf7100d51eab56572e4673f2'
# transaction_input = 'eca213168d3683c86591890e766c76ab618e0c245925ebcaddc855aecb2643a1'
transaction_input = '1645ebf5d89f89708ae84ee44a4abc42c8e6bdcb8419fcac4a801290601858ac'
sender_address = 'mguJenq4Jf2yXE41KAxDDacjpAveP4RQDY'
recipient_address = 'mkafwbwyu3N4ZhyfY5ovvy6s7ZqBcnRhDg'

# input_tx_size = 5.79975191 * COIN
input_tx_size = 1.3 * COIN

magic = 0xd9b4bef9


def makeMessage(magic, command, payload):
    checksum = hashlib.sha256(hashlib.sha256(payload).digest()).digest()[0:4]
    return struct.pack('L12sL4s', magic, command, len(payload), checksum) + payload


def getTxMsg(payload):
    return makeMessage(magic, 'tx', payload)


class transaction:

    def start(self):

        rpc = Proxy(service_port=18332)
        addr = wallet.CBitcoinAddress(recipient_address)
        txid = rpc.sendtoaddress(addr, 0.001 * COIN)
        print(b2lx(txid))

    def run(self):
        # Send this amount

        send_amnt = 0.001 * COIN
        remain_amnt = input_tx_size - send_amnt

        rpc = Proxy(service_port=18332)
        txin_raw = rpc.getrawtransaction(lx(transaction_input))

        vout_tx = [txin_raw.vout.index(x) for x in txin_raw.vout if x.nValue == input_tx_size]

        if send_amnt + remain_amnt == input_tx_size:
            print('Amounts are equal')
        else:
            raise ArithmeticError('Unequal amounts for transaction. Will likely raise OP_EQUALVERIFY failure')

        # Create brainwallet secret key
        h = hashlib.sha256(b'jay zilla is da rizzla of mai nizzla').digest()
        seckey = CBitcoinSecret.from_secret_bytes(h)

        # Create a transaction ID with the lx function
        txid = lx(transaction_input)
        vout = vout_tx[0]

        # Create the txin structure
        txin = CMutableTxIn(COutPoint(txid, vout))

        # Create scriptPubKey
        txin_scriptPubKey = CScript([OP_DUP, OP_HASH160, Hash160(seckey.pub), OP_EQUALVERIFY, OP_CHECKSIG])

        # Create txout while creating the scriptPubKey from a Bitcoin
        # Address

        # Send desired amount to recipient(s) and also be sure to send the remainder back to the sender

        tx_fee = 100 * 160
        # tx_fee = 0
        txout = CMutableTxOut(send_amnt, CBitcoinAddress(recipient_address))
        txout_remainder = CMutableTxOut(remain_amnt - tx_fee, CBitcoinAddress(sender_address))

        print(input_tx_size)
        print(send_amnt + remain_amnt)
        print(send_amnt + remain_amnt - tx_fee)


# Create unsigned transaction
        tx = CMutableTransaction([txin], [txout, txout_remainder])

        # Calcuate signature hash
        sighash = SignatureHash(txin_scriptPubKey, tx, 0, SIGHASH_ALL)

        # Sign it
        sig = seckey.sign(sighash) + bytes([SIGHASH_ALL])

        # Set the scriptSig of our transaction appropriately
        txin.scriptSig = CScript([sig, seckey.pub])

        # Verify signing worked
        VerifyScript(txin.scriptSig, txin_scriptPubKey, tx, 0, (SCRIPT_VERIFY_P2SH,))

        # Convert transaction to stdout compatible hex
        transaction_final_out = b2x(tx.serialize())

        transaction_bytesize = sys.getsizeof(tx)

        # proxy = Proxy(btc_conf_file='/data/bitcoin/data/testnet3/bitcoin.conf', service_url='http://127.0.0.1')
        # proxy = Proxy(service_port=18332) <-- Instantiating this earlier in the method

        proxy_info = rpc.getinfo()
        r = rpc.sendrawtransaction(tx, allowhighfees=True)

        print(r)

        # peers = list(
        #     map(
        #         lambda x: x[4][0],
        #         socket.getaddrinfo('bitseed.xf2.org.', 22,
        #                            type=socket.SOCK_STREAM)
        #     )
        # )
        #
        # for peer in peers:
        #     print(peer)
        #     try:
        #
        #         # sock = websocket.WebSocketClient()
        #         #
        #         # sock.connect(peer)
        #
        #
        #         sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        #         # sock.bind((peer, 8333))
        #         sock.connect((peer, 8333))
        #         sock.send(getVersionMsg())
        #         sock.recv(1000)  # receive version
        #         sock.recv(1000)  # receive verack
        #         sock.send(getTxMsg(transaction_final_out.decode('hex')))
        #     except socket.error as e:
        #
        #         print(e.strerror)
        #         print(e.errno)
        #         sock.close()
        #
        #         return transaction_final_out
        #     except sys.exc_info() as e:
        #         print(e)

    def run_alt(self):
        # Create brainwallet secret key

        h = hashlib.sha256(b'correct horse battery staple').digest()
        seckey = CBitcoinSecret.from_secret_bytes(h)

        # Get ID of input transaction

        txid = lx(transaction_input)
        vout = 26

        # Create INPUT transaction structure (with empty scriptSig to be replaced later)
        txin = CMutableTxIn(COutPoint(txid, vout))

        # Get scriptPubKey from output of what we are spending
        txin_scriptPubKey = CScript([OP_DUP, OP_HASH160, Hash160(seckey.pub), OP_EQUALVERIFY, OP_CHECKSIG])

        # Create the OUTPUT transaction structure (with scriptPubKey from btc address
        txout = CMutableTxOut(0.001*COIN, CBitcoinAddress(recipient_address))

        # Create unsigned transaction
        tx = CMutableTransaction([txin], [txout])

        # Calculate hash
        sighash = SignatureHash(txin_scriptPubKey, tx, 0, SIGHASH_ALL)

        # Sign transaction
        sig = seckey.sign(sighash) + bytes([SIGHASH_ALL])

        # set scriptSig of our INPUT transaction
        txin.scriptSig = CScript([sig, seckey.pub])

        # Verify signature worked
        VerifyScript(txin.scriptSig, txin_scriptPubKey, tx, 0, (SCRIPT_VERIFY_P2SH, ))

        # Print transaction for record

        transaction_final_out = b2x(tx.serialize())

        proxy = Proxy(service_port=18332)
        proxy_info = proxy.getinfo()
        r = proxy.sendrawtransaction(tx, allowhighfees=True)

        print(r)




def getVersionMsg():
    version = 60002
    services = 1
    timestamp = int(time.time())
    addr_me = TrxUtils.netaddr(socket.inet_aton("127.0.0.1"), 8333)
    addr_you = TrxUtils.netaddr(socket.inet_aton("127.0.0.1"), 8333)
    nonce = random.getrandbits(64)
    sub_version_num = TrxUtils.varstr('')
    start_height = 0
