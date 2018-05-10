from decimal import Decimal
from random import uniform
import json
from utils.btcd_utils import get_env_variables
from subprocess import call, PIPE

TWO_PLACES = Decimal(10) ** -2


def create_mock_price(price_min, price_max):
    return Decimal((price_min + price_max) / 2 * Decimal(uniform(0.16, 1.334))).quantize(TWO_PLACES)


def expose_analysis_files():
    env = get_env_variables()['TRX_ENV']
    command = 'mv /var/www/cointrx/bot/analysis/*.html /var/www/cointrx/analysis/' if env == 'SNOWFLAKE' else 'mv /var/www/coinx/bot/*.html /var/www/coinx/analysis/'
    move_result = call(command, shell=True, stdout=PIPE)
    if move_result is not None and hasattr(move_result, 'stdout'):
        return move_result.stdout
    else:
        return None


def valid_json(data):
    try:
        parsed = json.loads(data)
        return True
    except:
        return False