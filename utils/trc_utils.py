from decimal import Decimal
from random import uniform

TWO_PLACES = Decimal(10) ** -2


def create_mock_price(price_min, price_max):
    return Decimal((price_min + price_max) / 2 * Decimal(uniform(0.16, 1.334))).quantize(TWO_PLACES)
