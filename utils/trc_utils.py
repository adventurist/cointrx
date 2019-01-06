from decimal import Decimal
from random import uniform
import json
import os
from utils.btcd_utils import get_env_variables
from subprocess import call, PIPE

TWO_PLACES = Decimal(10) ** -2


def create_mock_price(price_min, price_max):
    return Decimal((price_min + price_max) / 2 * Decimal(uniform(0.16, 1.334))).quantize(TWO_PLACES)


def expose_analysis_files():
    app_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../')
    command = 'mv ' + app_root + 'analysis/*.html ' + app_root + 'static/analysis/'
    move_result = call(command, shell=True, stdout=PIPE)
    if move_result is not None and hasattr(move_result, 'stdout'):
        return move_result.stdout
    else:
        return None


def valid_json(data):
    try:
        json.loads(data)
        return True
    except:
        return False
