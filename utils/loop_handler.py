from db import db
import json


class IOHandler:

    @staticmethod
    def handle_response(response):
        print(response.body.decode("utf-8"))

    # @staticmethod
    # async def handle_price(response):
    #     # return response.body.decode("utf-8")
    #     await db.update_prices(json.loads(response.body.decode("utf-8")))
        # print(data)
        # for k, v in data.items():
        #     print('My thing is')
        #     print(k)
        #     print('My value is')
        #     print(json.dumps(v))

    @staticmethod
    async def handle_price(response):
        # return response.body.decode("utf-8")
        update_price_result = await db.update_prices(json.loads(response.body.decode("utf-8")))
        return update_price_result

    @staticmethod
    def handle_db_data(response):
        print(response.body.decode("utf8"))
