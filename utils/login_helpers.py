import base64


def retrieve_json_login_headers(headers):
    return headers.get('Authorization'), headers.get("Content-Type")


def retrieve_json_login_credentials(request_data):
    return request_data.get('email'), request_data.get('name'), request_data.get('password')


def retrieve_login_credentials(request_handler):
    return request_handler.get_body_argument('name'), request_handler.get_body_argument('pass')


def retrieve_api_request_headers(headers):
    return headers.get('csrf-token'), headers.get("Content-Type")


def check_basic_auth(auth_header):
    auth_decoded = base64.decodebytes(bytes(auth_header[6:], 'utf-8'))
    name, password = str(auth_decoded).split(':', 2)
    return name, password


def create_user_session_data(name, password, user, csrf):
    return {'name': name, 'pass': password, 'id': user.id, 'csrf': csrf}
