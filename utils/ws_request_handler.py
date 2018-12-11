from db.db import User


async def handle_ws_request(request_type, data):
    async def login(credentials):
        from db.db import check_authentication_by_name
        from utils import session
        user_verify = check_authentication_by_name(credentials['name'], credentials['password'])
        if user_verify is not None and user_verify is not -1:
            csrf = user_verify.generate_auth_token(3600)
            session = session.Session(user_verify, csrf)
            trx_cookie = session.generate_cookie()
            return {
                'result': 'success',
                'payload': {'csrf': csrf, 'trx_cookie': trx_cookie, 'session': session},
                'error': 'false',
                'action': 'subscription:update'
            }

    async def verify_subscription(token_data):
        if User.verify_auth_token(token_data['csrf-token']):
            result = 'subscription:verified'
            action = 'subscription:continue'
            payload = 'Subscription verified and active'
            error = False
        else:
            result = 'subscription:lost'
            error = True
            action = 'subscription:retry'
            payload = 'Subscription is not active'
        return {
            'result': result,
            'payload': payload,
            'error': error,
            'action': action
        }

    async def resubscribe(token_data):
        user = User.verify_auth_token(token_data['refresh-token'])
        if user is not None:
            new_csrf = user.generate_auth_token(expiration=1200)
            refresh_token = user.generate_refresh_token()
            result = 'subscription:renewed'
            action = 'subscription:refresh'
            payload = {'csrf': new_csrf, 'refresh': refresh_token}
            error = False
        else:
            result = 'subscription:failed'
            error = True
            action = 'subscription:manual_login'
            payload = 'Subscription failed'
        return {
            'result': result,
            'payload': payload,
            'error': error,
            'action': action
        }

    switch = {
        'subscription:verify': verify_subscription,
        'subscription:renew': resubscribe,
        'login': login
    }
    func = switch.get(request_type, lambda: 'Invalid request type')

    return await func(data)
