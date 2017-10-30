import sys

import hashlib

from bitcoin import SelectParams
from bitcoin.core import b2x, lx, COIN, COutPoint, CMutableTxOut, CMutableTxIn, CMutableTransaction, Hash160
from bitcoin.core.script import CScript, OP_DUP, OP_HASH160, OP_EQUALVERIFY, OP_CHECKSIG, SignatureHash, SIGHASH_ALL
from bitcoin.core.scripteval import VerifyScript, SCRIPT_VERIFY_P2SH
from bitcoin.wallet import CBitcoinAddress, CBitcoinSecret

SelectParams('testnet')

transaction_input = 'eca213168d3683c86591890e766c76ab618e0c245925ebcaddc855aecb2643a1'
sender_address = 'mguJenq4Jf2yXE41KAxDDacjpAveP4RQDY'
recipient_address = 'mkafwbwyu3N4ZhyfY5ovvy6s7ZqBcnRhDg'

magic = 0xd9b4bef9

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
VerifyScript(txin.scriptSig, txin_scriptPubKey, tx, 0, (SCRIPT_VERIFY_P2SH))

# Print transaction for record

transaction_final_out = b2x(tx.serialize())
