from tornado.ioloop import IOLoop
from tornado.web import Application, RequestHandler
from tornado import escape
from tornado.httputil import HTTPHeaders
from tornado.options import define, options, parse_command_line

import db
import json

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

    def post(self) -> object:
        if self.request.headers.get("Content-Type") == 'application/json':
            request_data = {k: ''.join(v) for k, v in escape.json_decode(self.request.body).items()}
            email = request_data.get('email')
            password = request_data.get('password')
            name = request_data.get('name')

            if email is None or password is None or name is None:
                self.write("You must supply more arguments")
                self.write_error(401)
            else:
                hashed_pw = db.User.generate_hash(password)
                new_user = db.check_authentication(name, hashed_pw, email)
                print(str(new_user))


if __name__ == "__main__":
    muhConnection = db.db_connect()
    print(muhConnection)

    application = Application([
        (r"/", MainHandler),
        (r"/jigga", WunderHandler),
        (r"/login", LoginHandler)
    ])
    application.listen(6969)
    db.Base.metadata.create_all(bind=db.engine)

    IOLoop.instance().start()
