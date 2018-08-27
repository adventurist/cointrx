import base64
import uuid
from tornado import log


class Session:
    def __init__(self, user, csrf=0, dcsrf=0):
        self.csrf = csrf
        self.dcsrf = dcsrf
        self.user = user

    def drupal_token(self):
        return self.dcsrf

    def trx_token(self):
        return self.csrf

    def drupal_user(self):
        return self.user

    def set_cookie(self, cookie):
        self.cookie = cookie

    def get_cookie(self):
        return self.cookie

    @staticmethod
    def generate_cookie():
        return base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)

    @staticmethod
    def end_session(session):
        if isinstance(session, Session):
            session = None
            print('Session destroyed')
