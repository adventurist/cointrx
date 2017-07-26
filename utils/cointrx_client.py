from tornado import gen
from tornado.httpclient import AsyncHTTPClient
from tornado.httpclient import HTTPError as Http_Exception
from iox.loop_handler import IOHandler

from types import SimpleNamespace

config = SimpleNamespace()
config.blockchain_url = "http://blockchain.info/ticker"

http_client = AsyncHTTPClient()
io_handler = IOHandler()


class Client:
    @staticmethod
    def handle_response(response):
        print(response.body)
        if response.error:
            print("Error: %s" % response.error)
        else:
            print(response.body)
            return response.body

    @gen.coroutine
    def get_prices(self):
        print('test')

        try:
            response = yield http_client.fetch(config.blockchain_url)
            io_handler.handle_price(response)

        except Http_Exception as e:
            print(e.message)
