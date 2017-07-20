from tornado.httpclient import AsyncHTTPClient
from tornado.httpclient import HTTPError as Http_Exception

from types import SimpleNamespace

config = SimpleNamespace()
config.blockchain_url = "http://blockchain.info/ticker"

http_client = AsyncHTTPClient()


class Client:
    def handle_response(self, response):
        if response.error:
            print("Error: %s" % response.error)
        else:
            print(response.body)
            return response.body

    def get_prices(self):
        print('test')

        try:
            response = http_client.fetch(config.blockchain_url)
            return self.handle_response(response)

        except Http_Exception as e:
            print(e.message)
