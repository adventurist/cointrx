from decimal import Decimal
from random import uniform
from utils.btcd_utils import  get_env_variables
from subprocess import run, PIPE

TWO_PLACES = Decimal(10) ** -2


def create_mock_price(price_min, price_max):
    return Decimal((price_min + price_max) / 2 * Decimal(uniform(0.16, 1.334))).quantize(TWO_PLACES)


def expose_analysis_files():
    env = get_env_variables()['TRX_ENV']
    interface = 'mv'
    param1 = '/var/www/cointrx/bot/analysis*.html' if env == 'SNOWFLAKE' else '/var/www/coinx/bot/analysis*.html'
    param2 = '/var/www/cointrx/analysis/' if env == 'SNOWFLAKE' else '/var/www/coinx/analysis/'
    move_result = run([interface, param1, param2], stdout=PIPE)
    if move_result is not None and hasattr(move_result, 'stdout'):
        return move_result.stdout
    else:
        return None
