import struct
import sys
import hashlib

# from tornado import websocket
from bitcoin import main as btc_tools, transaction as tx_func
from bitcoin.core import b2x, lx, COIN, COutPoint, CMutableTxOut, CMutableTxIn, CMutableTransaction, Hash160, b2lx
from bitcoin.core.script import CScript, OP_DUP, OP_HASH160, OP_EQUALVERIFY, OP_CHECKSIG, SignatureHash, SIGHASH_ALL
from bitcoin.core.scripteval import VerifyScript, SCRIPT_VERIFY_P2SH
# from bitcoin.wallet import CBitcoinAddress, CBitcoinSecret
from bitcoin.rpc import Proxy

from pycoin.services import spendables_for_address

from utils import btcd_utils


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


def makeMessage(magic, command, payload):
    checksum = hashlib.sha256(hashlib.sha256(payload).digest()).digest()[0:4]
    return struct.pack('L12sL4s', magic, command, len(payload), checksum) + payload


def getTxMsg(payload):
    return makeMessage(magic, 'tx', payload)


class transaction:
    def start(self):

        rpc = Proxy(service_port=18332)
        addr = wallet.CBitcoinAddress(TestnetData)
        addr.maketrans()
        txid = rpc.sendtoaddress(addr, 0.001 * COIN)
        print(b2lx(txid))

    def run(self):
        # Send this amount
        scriptPubKey = None
        send_amnt = TestnetData.send_amount
        remain_amnt = TestnetData.tx_amount - send_amnt
        tx_amount = TestnetData.tx_amount

        rpc = Proxy(service_port=18332)
        txin_raw = rpc.getrawtransaction(lx(TestnetData.txid1))

        vout_tx = [txin_raw.vout.index(x) for x in txin_raw.vout if x.nValue == tx_amount]
        if len(vout_tx) > 0:
            vout = vout_tx[0]
            scriptPubKey = txin_raw.vout[vout].scriptPubKey
        # if send_amnt + remain_amnt == input_tx_size:
        #     print('Amounts are equal')
        # else:
        #     raise ArithmeticError('Unequal amounts for transaction. Will likely raise OP_EQUALVERIFY failure')

        # Create brainwallet secret key
        seckey = CBitcoinSecret.from_secret_bytes(TestnetData.priv1.encode())

        # Create a transaction ID with the lx function
        txid = lx(TestnetData.txid1)
        # TODO Check count on next line

        # vout = 0
        # prev_scriptPubKey = txin_raw.vout[vout].scriptPubKey

        # Create the txin structure
        txin = CMutableTxIn(COutPoint(txid, vout))

        # noinspection PyPep8Naming and create scriptPubKey
        txin_scriptPubKey = CScript([OP_DUP, OP_HASH160, Hash160(seckey.pub), OP_EQUALVERIFY, OP_CHECKSIG])

        txout = CMutableTxOut(send_amnt, CBitcoinAddress(TestnetData.address2))

        # Create unsigned transaction
        tx = CMutableTransaction([txin], [txout])

        # Calculate signature hash
        sighash = SignatureHash(txin_scriptPubKey, tx, 0, SIGHASH_ALL)

        # hexhash = "".join(map(lambda b: format(b, "02x"), sighash))
        # hexhscriptPubKey = "".join(map(lambda b: format(b, "02x"), txin_scriptPubKey))
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
        r = rpc.sendrawtransaction(tx)

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

    def regtest_run(self):
        amount_to_send = RegtestData.send_amount
        satoshis_to_send = RegtestData.send_amount * COIN

        addr = CBitcoinAddress(RegtestData.address1)

        rpc = Proxy(service_port=18444, btc_conf_file='/data/bitcoin/.bitcoin2/bitcoin.conf')

        current_info = rpc.getinfo()
        verify_attempt1 = rpc.validateaddress(RegtestData.address1)
        verify_attempt2 = rpc.validateaddress(RegtestData.address2)

        txid = rpc.sendtoaddress(addr, satoshis_to_send)

        little_endian_hex = b2lx(txid)

    def testnet_run(self):
        if TestnetData.address1:
            tx_history = btcd_utils.get_tx_history(TestnetData.address1)
            for item in tx_history:
                tempitem = item.keys()
                item_output = item.keys()

            tx_input_orig = [{'output': TestnetData.txid1, 'value': TestnetData.tx_amount, 'address': TestnetData.address1}]
            tx_input = [{'output': str((next(iter(v.keys())) + ':0')), 'value': next(iter(v.values())), 'address': TestnetData.address1} for v in tx_history]

            tx_input_total = sum(x['value'] for x in tx_input)
            tx_remain_amount = tx_input_total - TestnetData.send_amount
            # tx = tx_func.mktx(tx_input, [{'value': TestnetData.send_amount, 'address': TestnetData.address2}, {'value': tx_remain_amount, 'address': TestnetData.address1}])
            tx = tx_func.mktx(tx_input_orig, [{'value': TestnetData.send_amount, 'address': TestnetData.address2}])
            signed_tx = tx_func.sign(tx, 0, TestnetData.priv1, SIGHASH_ALL)

            # btcd_utils.send_tx(signed_tx, 'testnet')

    def pytool_run(self):
        add1 = 'miPtyvZgdXidDug4msfFyBpMy2z8VrkR1C'
        add2 = 'migrBFM4Xd4LNBui6XwEkU74Zehh7ZkR4M'
        priv1 = btc_tools.random_key()
        priv2 = btc_tools.random_key()
        priv3 = btc_tools.random_key()

        pub1 = btc_tools.privtopub(priv1)  # Public key
        pub2 = btc_tools.privtopub(priv2)  # Public key
        pub3 = btc_tools.privtopub(priv3)  # Public key

        multi = tx_func.mk_multisig_script(pub1, pub2, pub3, 2, 3)
        script_addr = tx_func.scriptaddr(multi)
        if script_addr is not None and len(script_addr) > 0:
            print(script_addr)



            # priv = PyBtcTest.priv
            # print(priv)
            # pub = btc_tools.privtopub(priv)
            # print(pub)
            # addr = btc_tools.pubtoaddr(pub)
            # print(addr)
            # history = bci.history(add1)
            # for k, v in history:
            #     print(k)

    def run_alt(self):

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


class TestnetData:
    address2 = 'miPtyvZgdXidDug4msfFyBpMy2z8VrkR1C'
    address1 = 'migrBFM4Xd4LNBui6XwEkU74Zehh7ZkR4M'
    priv2 = 'cTbUQ5gLKwt1PEXJiuhkgFE3pxij6TMRseuiEK8oFdvSKpSgDn7o'
    priv1 = 'cSfUQtuJ1sYPtbahUPDB8ZvL3cG7Dkd7m5VVAPGVJCebHxV7zmzh'
    # txid1 = '5381cd7bdee5629b2621dbbb8347f071a8db5a2733404edd7f55caf827e50602'
    # txid1 = u'f160bd9bb06c4f6fb38d1edae178393cabd99df658a08907bf1a138ce407daa2:0'
    # txid1 = u'a0b993b0f3ea76545669b0bc80b1293ababe9304a41a9b16473284b56dae1801:0'
    # txid1 = u'20bbefbd839f50d89720a868c161e25765641cb74dfaadbf056e7ffd5e07945c:0'
    txid1 = u'43d9ac22dc3fa21b8ca91326b4c294a52d753279e132c44d378ea4ed70007dc2:0'
    # tx_amount = int(0.65 * COIN)
    tx_amount = int(1.07900739 * COIN)
    # tx_amount = int(1.72899739 * COIN)

    send_amount = int(tx_amount - 1000)


class PyBtcTest:
    priv = btc_tools.random_key()


class PycoinScript:

    def send_all(self):
        parser = argparse.ArgumentParser()
        parser.add_argument('--privkey-bytes', help='provide hexlified raw privkey bytes', default='', type=str)
        parser.add_argument('--send-all-to', help='where to send all the money at this address',
                            default='1MaxKayeQg4YhFkzFz4x6NDeeNv1bwKKVA', type=str)
        args = parser.parse_args()

        key_bytes = unhexlify(args.privkey_bytes.encode()) if args.privkey_bytes != '' else os.urandom(32)
        private_key = Key(secret_exponent=int.from_bytes(key_bytes, 'big'))
        address = private_key.address()

        print('Your Bitcoin address is...', address)
        print('Your --privkey-bytes', hexlify(key_bytes).decode())

        try:
            spendables = spendables_for_address(address)
            print('Spending', spendables)
        except HTTPError as e:
            print('Blockchain throws a 500 error if there are no spendables. Try sending some coins to', address,
                  'and try again. Remeber to copy privkey-bytes.')
            sys.exit()

        tx = create_tx(spendables, [args.send_all_to])
        print('TX created:', repr(tx))

        sign_tx(tx, [private_key.wif(False), private_key.wif(True)])
        print('Final TX:', tx)

        print('TX Send Attempt:', pycoin.services.blockchain_info.send_tx(tx))
