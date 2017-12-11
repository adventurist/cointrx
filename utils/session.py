class Session:
    def __init__(self, csrf, dcsrf, user):
        self.csrf = csrf
        self.dcsrf = dcsrf
        self.user = user

    def drupal_token(self):
        return self.dcsrf

    def trx_token(self):
        return self.csrf

    def drupal_user(self):
        return self.user
