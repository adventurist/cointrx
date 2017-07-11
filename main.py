from tornado.ioloop import IOLoop
from tornado.web import Application, RequestHandler
from tornado.httputil import HTTPHeaders
from tornado.options import define, options, parse_command_line

import db

define("port", default=96969, help="Default port for the WebServer")


class MainHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        self.write("Hi Jigga, Welcome to Tornado Web Framework.")


class WunderHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        response = {'jigga1': 'always jigga'}
        self.write(response)


class LoginHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        if self.request.headers.get("Content-Type") == 'application/json':
            self.write("Attempting login")


if __name__ == "__main__":
    muhConnection = db.db_connect()
    print(muhConnection)

    application = Application([
        (r"/", MainHandler),
        (r"/jigga", WunderHandler),
    ])
    application.listen(8888)
    IOLoop.instance().start()
