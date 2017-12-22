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
