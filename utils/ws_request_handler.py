from db.db import User


async def handle_ws_request(request_type, data):
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

    switch = {
        'subscription:verify': verify_subscription
    }
    func = switch.get(request_type, lambda: 'Invalid request type')

    return await func(data)
