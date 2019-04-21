from utils.btcd_utils import get_env_variables


def env_variables():
    return get_env_variables


def get_urls(trx_env):
    return {
        'base_url': 'https://cointrx.com',
        'tx_app': 'http://localhost:3000/transaction',
        'tx_request': 'https://cointrx.com/transaction/request',
        'blockgen_url': 'https://cointrx.com/regtest/generate/block',
        'userbalance_url': 'https://cointrx.com/regtest/user-balance',
        'wif_to_private_url': 'http://localhost:3000/key/from-wif',
        'key_gen_url': 'https://cointrx.com/keys/btc/regtest/generate'
    } if trx_env == 'SNOWFLAKE' else {
        'base_url': 'http://localhost',
        'tx_app': 'http://localhost:3000/transaction',
        'tx_request': 'http://localhost:6969/transaction/request',
        'blockgen_url': 'http://localhost:6969/regtest/generate/block',
        'userbalance_url': 'http://localhost:6969/regtest/user-balance',
        'wif_to_private_url': 'http://localhost:3000/key/from-wif',
        'key_gen_url': 'http://localhost:6969/keys/btc/regtest/generate'
    }


def trx_urls(trx_env):
    return {
        'base_url': 'https://cointrx.com',
        'tx_app': 'http://localhost:3000/transaction',
        'tx_request': 'https://cointrx.com/transaction/request',
        'blockgen_url': 'https://cointrx.com/regtest/generate/block',
        'userbalance_url': 'https://cointrx.com/regtest/user-balance',
        'wif_to_private_url': 'http://localhost:3000/key/from-wif',
        'key_gen_url': 'https://cointrx.com/keys/btc/regtest/generate',
        'bot': {
            'start': 'https://cointrx.com/bot/start',
            'wsStart': 'wss://bot.cointrx.com/ws/start',
            'trc': {
                'prices': 'https://cointrx.com/bot/trc/prices/all',
                'analyze': 'https://bot.cointrx.com/bots/trc/analyze'
            },
            'fetch': 'http://bot.cointrx.com/bots/fetch'
        }
    } if trx_env == 'SNOWFLAKE' else {
        'base_url': 'http://localhost',
        'tx_app': 'http://localhost:3000/transaction',
        'tx_request': 'http://localhost:6969/transaction/request',
        'blockgen_url': 'http://localhost:6969/regtest/generate/block',
        'userbalance_url': 'http://localhost:6969/regtest/user-balance',
        'wif_to_private_url': 'http://localhost:3000/key/from-wif',
        'key_gen_url': 'http://localhost:6969/keys/btc/regtest/generate',
        'bot': {
            'start': 'http://localhost:6969/bot/start',
            'wsStart': 'ws://localhost:9977/ws/start',
            'trc': {
                'prices': 'http://localhost:6969/bot/trc/prices/all',
                'analyze': 'http://localhost:9977/bots/trc/analyze'
            },
            'fetch': 'http://localhost:9977/bots/fetch'
        }
    }


def account_urls(trx_env):
    return {
        'account_list': 'https://cointrx.com/api/account',
        'user_list': 'https://cointrx.com/regtest/balance/user/active',
        'bot_list': 'https://bot.cointrx.com/bots/fetch',
        'activate_key': 'https://cointrx.com/api/key/activate',
        'deactivate_key': 'https://cointrx.com/api/key/deactivate',
        'update_key': 'https://cointrx.com/api/key/0000/update',
        'delete_key': 'https://cointrx.com/api/account',
        'newpassword': 'https://cointrx.com/api/user/trxuser/newpassword',
        'subscription': 'wss://cointrx.com/services/subscribe/ws'

    } if trx_env == 'SNOWFLAKE' else {
        'account_list': 'http://localhost:6969/api/account',
        'user_list': 'http://localhost:6969/regtest/balance/user/active',
        'bot_list': 'http://localhost:9977/bots/fetch',
        'activate_key': 'http://localhost:6969/api/key/activate',
        'deactivate_key': 'http://localhost:6969/api/key/deactivate',
        'update_key': 'http://localhost:6969/api/key/0000/update',
        'delete_key': 'http://localhost:6969/api/account',
        'newpassword': 'http://localhost:6969/api/user/trxuser/newpassword',
        'subscription': 'ws://localhost:6969/services/subscribe/ws'
    }


def eth_by_currency(currency):
    return 'https://api.kraken.com/0/public/Ticker?pair=ETH%s' % currency


currency_index = {
    "AUD": 7,
    "BRL": 4,
    "CAD": 8,
    "CHF": 5,
    "CLP": 22,
    "CNY": 9,
    "DKK": 2,
    "EUR": 3,
    "GBP": 6,
    "HKD": 20,
    "INR": 1,
    "ISK": 12,
    "JPY": 18,
    "KRW": 17,
    "NZD": 10,
    "PLN": 14,
    "RUB": 21,
    "SEK": 13,
    "SGD": 15,
    "THB": 11,
    "TWD": 19,
    "USD": 16
}

currency_symbol_map = {
    7: "$",
    4: "R$",
    8: "$",
    5: "CHF",
    22: "$",
    9: "¥",
    2: "kr",
    3: "€",
    6: "£",
    20: "$",
    1: "₹",
    12: "kr",
    18: "¥",
    17: "₩",
    10: "$",
    14: "zł",
    21: "RUB",
    13: "kr",
    15: "$",
    11: "฿",
    19: "NT$",
    16: "$"
}


class TransactionError:
    INSUFFICIENT_FUNDS = 0
    NO_HISTORY = 1
    NO_RESPONSE = 2
    UNKNOWN = 3


DEFAULT_LANGUAGE = 'CAD'
