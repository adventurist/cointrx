from typing import Union
from aiopg.sa import create_engine as async_engine
from sqlalchemy import create_engine
from sqlalchemy import exc, event, MetaData, select
from sqlalchemy import desc
from sqlalchemy import func
from sqlalchemy.sql.expression import true, false
from sqlalchemy.engine.url import URL
from sqlalchemy.orm import sessionmaker
from bitcoin.core import COIN
from db import db_config
from types import SimpleNamespace
from decimal import Decimal, ROUND_HALF_UP
from utils import btcd_utils
from config.config import DEFAULT_LANGUAGE

import timeago
import time
import datetime
import json
import logging

from db.models import TrxKey, TRX, SKey, MKey, KeyLabel, Offer, Bid, TRCHistory, User, ETHPrice, ETHPriceRevision, CXPrice, CXPriceRevision, Heartbeat, HeartbeatComment, HeartbeatCommentBase, HeartbeatUser, engine, Base, Session, session

trxapp = SimpleNamespace()
trxapp.config = {'SECRET_KEY': "jigga does as jigga does"}

logger = logging.getLogger('DB')
logger.setLevel(logging.DEBUG)
log_handler = logging.FileHandler('db.log')
logger_formatter = logging.Formatter('%(name)s - %(levelname)s - %(message)s')
log_handler.setFormatter(logger_formatter)
logger.addHandler(log_handler)
# metadata.create_all(bind=engine)

COINMASTER_USER_ID = 16


async def test_db():
    engine = await async_engine(user=db_config.DATABASE['username'], database=db_config.DATABASE['database'],
                                host=db_config.DATABASE['host'], password=db_config.DATABASE['password'])
    async with engine:
        async with engine.acquire() as conn:
            query = select([CXPrice])
            async for row in conn.execute(query):
                print(row)


def db_connect():
    return create_engine(URL(**db_config.DATABASE))


def heartbeat_connect():
    return create_engine(URL(**db_config.SOCIALBASE))


async def trx_db_engine():
    return async_engine(user=db_config.DATABASE['username'], database=db_config.DATABASE['database'],
                        host=db_config.DATABASE['host'], password=db_config.DATABASE['password'])


def create_all():
    Base.metadata.create_all(db_connect())


def rollback_transaction():
    try:
        session.rollback()
        return True
    except exc.SQLAlchemyError as error:
        return error


def create_all_heartbeat():
    HeartbeatCommentBase.metadata.create_all(heartbeat_connect())


def handle_db_data(response):
    for row in response:
        if isinstance(row, CXPriceRevision):
            print(row.serialize())


async def handle_eth_update_data(data):
    distilled_data = await parse_eth_price_data(data)


async def update_prices(data):
    return await parse_price_data(data)


async def update_eth_prices(data):
    await parse_eth_price_data(data)


async def latest_prices():
    try:
        result = await session.query(CXPrice).all()
        data = []
        for r in result:
            if isinstance(r, CXPrice):
                data.append(r.serialize())
        print(data)
        return data
    except exc.SQLAlchemyError as err:
        print(err.args)
        session.rollback()


async def latest_prices_async():
    try:
        result = session.query(CXPriceRevision).order_by(CXPriceRevision.rid.desc()).limit(16).all()
        data = []
        for r in result:
            if isinstance(r, CXPriceRevision):
                data.append(r.serialize())
        return data
    except exc.SQLAlchemyError as err:

        session.rollback()


def latest_price(currency: str) -> str:
    result = session.query(CXPrice).filter(CXPrice.currency == currency).one_or_none()
    if result is not None:
        print(result.serialize())
        return 'jigga'


async def latest_price_data(currency: str) -> CXPrice:
    result = session.query(CXPrice).filter(CXPrice.currency == currency).one_or_none()
    return result if result is not None else False


async def latest_price_async(currency: str) -> str:
    result = await session.query(CXPrice).filter(CXPrice.currency == currency).one_or_none()
    if result is not None:
        print(result.serialize())
        return 'jigga'


def latest_price_history(currency: str):
    result = session.query(CXPriceRevision).filter(CXPriceRevision.currency == currency).order_by(
        CXPriceRevision.rid.desc()).limit(15).all()
    if result is not None:
        for r in result:
            print(r.serialize())
    return result


async def latest_price_history_async(currency: str):
    result = session.query(CXPriceRevision).filter(CXPriceRevision.currency == currency).order_by(
        CXPriceRevision.rid.desc()).limit(15).all()
    data = []
    if result is not None:
        for r in result:
            data.append(r.serialize())
    return data


def get_users():
    return session.query(User).filter(User.id != COINMASTER_USER_ID).all()


async def fetch_users_by_name(match_pattern):
    result = session.query(User).filter(User.name.ilike(match_pattern)).one_or_none()
    if result is not None:
        return result
    else:
        return -1


async def update_user_by_name(match_pattern, data):
    changed = False
    user = session.query(User).filter(User.name.like(match_pattern)).one_or_none()
    if user is not None:
        for k, v in data.items():
            if hasattr(user, k):
                if getattr(user, k) != v:
                    changed = True
                    setattr(user, k, v)
    if changed:
        try:
            session.add(user)
            session.commit()
            return user

        except exc.SQLAlchemyError as error:
            return error
    else:
        return -1


def fetch_label_text(id):
    result = session.query(KeyLabel).filter(KeyLabel.id == id).one_or_none()
    if result is not None:
        text = result.text()
        return text
    return 'no label'


async def parse_price_data(data):
    logger.debug('Parsing data:' + str(data))
    for k, v in data.items():
        logger.debug('Iterating key: ' + str(k))
        result = session.query(CXPrice).filter(CXPrice.currency == k).one()
        cur_time = time.time()
        if result is None:
            result = CXPrice(currency=k, sell=v['sell'], last=v['last'], buy=v['buy'], modified=cur_time)
        else:
            result.currency = k
            result.sell = v['sell']
            result.last = v['last']
            result.buy = v['buy']
            result.modified = cur_time

        try:
            session.add(result)
            session.commit()
            session.flush()

        except exc.SQLAlchemyError as e:
            print(e)
            return False

        result2 = session.query(CXPriceRevision).filter(CXPriceRevision.currency == k).group_by(
            CXPriceRevision.id).order_by(desc(func.max(CXPriceRevision.rid))).first()
        rid = find_rid(result2)
        rid = rid + 1 if rid is not None else 1

        revision_insert = CXPriceRevision(rid=rid, currency=k, sell=v['sell'], last=v['last'], buy=v['buy'],
                                          modified=cur_time, currency_id=result.id)
        try:
            session.add(revision_insert)
            session.commit()
            session.flush()

        except exc.SQLAlchemyError as e:
            print(e)
            return False

    return True


async def parse_eth_price_data(data, currency='cad'):
    result = session.query(ETHPrice).filter(ETHPrice.currency == currency).one()
    cur_time = datetime.datetime.now()
    if result is None:
        result = ETHPrice(currency=currency, last=data[0], modified=cur_time)

    try:
        session.add(result)
        session.commit()
        session.flush()

    except exc.SQLAlchemyError as e:
        print(e)
        return False

    result2 = session.query(ETHPriceRevision).filter(ETHPriceRevision.currency == currency).group_by(
        ETHPriceRevision.id).order_by(desc(func.max(ETHPriceRevision.rid))).first()
    rid = find_rid(result2)
    rid = rid + 1 if rid is not None else 1

    revision_insert = ETHPriceRevision(rid=rid, currency=currency, last=data[0], date=cur_time, currency_id=result.id)
    try:
        session.add(revision_insert)
        session.commit()
        session.flush()

    except exc.SQLAlchemyError as e:
        print(e)
        return False

    return True


def find_rid(data):
    # TODO Normalize this for both ETH and BTC (aka CXPrice)
    if data is not None and hasattr(data, 'rid'):
        return data.rid
    return None


def check_authentication(user, password, email):
    query_user = session.query(User).filter(User.name == user).first()
    if query_user is not None:
        if not User.verify_password(email, password):
            return -1
        return query_user
    else:
        return -2


def check_authentication_by_name(user, password):
    query_user = session.query(User).filter(User.name == user).first()
    if query_user is not None:
        if not User.verify_password_by_name(user, password):
            return -1

        return query_user
    else:
        return -1


def create_user(user, password, email):
    pass_hash = User.generate_hash(password)
    new_user = User(name=user, hash=pass_hash, email=email,
                    created=int(time.mktime(datetime.datetime.now().timetuple())), status=1)
    try:
        session.add(new_user)
        session.commit()
        return new_user

    except exc.SQLAlchemyError as error:
        return error


def check_auth_by_name(user, password):
    query_user = session.query(User).filter(User.name == user).first()
    if query_user is not None:
        if not User.verify_password_by_name(user, password):
            return None
        return query_user
    else:
        pass_hash = User.generate_hash(password)
        new_user = User(name=user, hash=pass_hash, email='temp@jigga.com',
                        created=int(time.mktime(datetime.datetime.now().timetuple())), status=1)

        try:

            session.add(new_user)
            session.commit()
            return new_user

        except exc.SQLAlchemyError as error:
            return error


@event.listens_for(CXPrice, 'before_insert')
def cx_insert_listener(*args):
    for key in args:
        print(key)


@event.listens_for(CXPrice, 'after_update')
def cx_update_listener(*args):
    @event.listens_for(Session, "after_flush")
    def cx_after_flush(prev_session, context):
        for v in prev_session.dirty:
            if isinstance(v, CXPrice):
                last = session.query(CXPriceRevision).filter(CXPriceRevision.currency == v.currency).group_by(
                    CXPriceRevision.id).order_by(desc(func.max(CXPriceRevision.rid))).one_or_none()
                rid = 1 if last is None else last.rid + 1
                new_rev = CXPriceRevision(rid=rid, currency=v.currency, last=v.last, buy=v.buy, sell=v.sell,
                                          modified=v.modified)
                try:
                    session.add(new_rev)
                    session.commit()

                except exc.SQLAlchemyError as error:
                    session.rollback()


def build_sub_comments(comments, now, session):
    if comments is not None:
        return [{
            'cid': x.cid,
            'body': x.body,
            'user': session.query(HeartbeatUser).filter(HeartbeatUser.uid == x.uid).one(),
            'timeago': timeago.format(x.created, now),
        } for x in comments]


def build_comments(comments, now, session):
    if comments is not None:
        return [{
            'cid': x.cid,
            'body': x.body,
            'user': session.query(HeartbeatUser).filter(HeartbeatUser.uid == x.uid).one(),
            'timeago': timeago.format(x.created, now),
            'subcomments': build_sub_comments(
                session.query(HeartbeatComment).filter(HeartbeatComment.entity_id == x.cid,
                                                       HeartbeatComment.entity_type == 'comment').all(), now,
                session)
        } for x in comments]


async def heartbeat_get_all():
    heartbeat_engine = create_engine(URL(**db_config.SOCIALBASE), echo=True)
    now = datetime.datetime.now() + datetime.timedelta(seconds=60 * 3.4)
    media_session = sessionmaker(bind=heartbeat_engine)()
    result = media_session.query(Heartbeat).outerjoin(HeartbeatComment,
                                                      HeartbeatComment.entity_type == 'heartbeat').filter(
        Heartbeat.status == 1).limit(50).all()
    data = []
    if result is not None:
        for r in result:
            data.append(
                {
                    'id': r.id,
                    'message': r.message,
                    'timeago': timeago.format(r.created, now),
                    'user': {
                        'name': r.user.name, 'uid': r.user.uid,
                        'img': r.user.pic[0].image.uri.replace('public://',
                                                               'sites/default/files/styles/thumbnail/public/') if len(
                            r.user.pic) > 0 else None
                    },
                    'comments': build_comments(r.comments, now, media_session),
                    'commentcount': len(r.comments)
                }
            )
    return data


async def addMultiSigAddress(pub_addr: str, keys: list, uid: int):
    if pub_addr is not None and len(keys) > 0:
        for key in keys:
            trx_key = TrxKey(value=key, uid=uid)
            session.add(trx_key)
            session.flush()
            multi_sig_key = MKey(pub=pub_addr, uid=uid, kid=trx_key.id)
            session.add(multi_sig_key)

        try:
            session.commit()
            return multi_sig_key.id

        except exc.SQLAlchemyError as err:
            print(err.args)
            session.rollback()


async def addSingleKey(key: str, uid: int):
    """
    :param key:
    :param uid:
    :return:
    """

    if key is not None and uid is not None:
        new_trx_key = TrxKey(value=key, uid=uid, multi=False, status=True)
        # TODO we should be checking if a key exists with the same hash
        # find_key = await find_key_for_uid(uid)
        session.add(new_trx_key)
        session.flush()
        single_key = SKey(value=key, uid=uid, kid=new_trx_key.id)
        session.add(single_key)

        try:
            session.commit()
            return single_key.id

        except exc.SQLAlchemyError as err:
            print(err.args)
            session.rollback()
            return err


async def findKey(key: str):
    existing_key = session.query(TrxKey).filter(TrxKey.value == key).first()

    if existing_key is None:
        return False
    else:
        return existing_key.id


async def find_single_key(kid: int) -> Union[bool, SKey]:
    existing_key = session.query(SKey).filter(SKey.kid == kid).first()

    if existing_key is None:
        return False
    else:
        return existing_key


async def find_key_for_uid(uid: int) -> Union[bool, TrxKey]:
    key = session.query(TrxKey).filter(TrxKey.uid == uid, TrxKey.status == true()).first()

    if key is None:
        return False
    else:
        return key


async def disable_key(kid: int) -> bool:
    key = session.query(TrxKey).filter(TrxKey.id == kid).one_or_none()
    if key is not None:
        key.status = false()
        session.add(key)

        try:
            session.commit()
            session.flush()
            return True
        except exc.SQLAlchemyError as err:
            print(err)

    return False


async def enable_key(kid: int) -> bool:
    key = session.query(TrxKey).filter(TrxKey.id == kid).one_or_none()
    if key is not None:
        key.status = true()
        return await update_resource(key)


async def update_resource(db_object: Base) -> bool:
    try:
        session.add(db_object)
        session.commit()
        session.flush()
        return True
    except exc.SQLAlchemyError as err:
        logging.log('info', str(err))
        print(err)
        return False


async def update_key(kid: int, label: str) -> dict:
    key = session.query(TrxKey).filter(TrxKey.id == kid).one_or_none()
    if key is not None:
        if key.label is not None:
            key.label.text = label
        else:
            key.label = KeyLabel(text=label, kid=kid)
        session.add(key)
        try:
            session.commit()
            session.flush()
            return True
        except exc.SQLAlchemyError as err:
            print(err)
            return err


async def regtest_make_user_addresses() -> list:
    users = get_users()
    result = []
    for user in users:
        new_address = btcd_utils.RegTest.get_new_address()
        if new_address is not None:
            wif = btcd_utils.RegTest.address_to_wif(new_address)
            add_key_attempt = await addSingleKey(wif, user.id)

            if add_key_attempt is not None:
                result.append({user.id: 1})

    return result


async def regtest_make_user_address(uid):
    user = session.query(User).filter(User.id == uid).order_by(User.created.desc()).one_or_none()
    if user is not None:
        new_address = btcd_utils.RegTest.get_new_address()
        if new_address is not None:
            wif = btcd_utils.RegTest.address_to_wif(new_address)
            add_key_attempt = await addSingleKey(wif, user.id)
            return new_address if add_key_attempt is not None else false


async def regtest_all_user_data():
    user_data = []
    users = session.query(User).all()
    for user in users:
        data = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'level': user.level,
            'balance': (await btcd_utils.RegTest.get_user_balance(user.trxkey)) / 100000000,
            'keys': [{'id': x.id, 'wif': x.value, 'status': x.status, 'label': x.label} for x in user.trxkey if x.status is not False]
        }
        user_data.append(data)

    return user_data


async def regtest_user_data(uid: str):
    user_data = []
    user = session.query(User).filter(User.id == uid).one()
    if user is not None:
        data = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'level': user.level,
            'utc_offset': user.utc_offset if user.utc_offset is not None else 0,
            'balance': (await btcd_utils.RegTest.get_user_balance(user.trxkey)) / 100000000,
            'keys': [{'id': x.id, 'value': x.value, 'status': x.status, 'label': x.label} for x in user.trxkey if x.status]
        }

        for key in data['keys']:
            key['balance'] = await btcd_utils.RegTest.get_key_balance(key)
            key['address'] = btcd_utils.wif_to_address(key.pop('value'))
            key['label'] = key['label'].text if key['label'] is not None else 'Unnamed'

        data['estimated'] = await regtest_user_estimated_value(uid, data['balance'])
        await update_user_balance(user, data['balance'])

        user_data.append(data)
    return user_data


async def regtest_pay_user(uid: str, amount: str):
    """
    :param uid:
    :param amount:
    :return:
    """
    key = session.query(TrxKey).filter(TrxKey.uid == int(uid), TrxKey.status == true()).group_by(TrxKey.id).order_by(
        func.max(TrxKey.id).desc()).limit(1).one_or_none()
    if key is not None:
        address = btcd_utils.wif_to_address(key.value)
    else:
        address = await regtest_make_user_address(int(uid))

    if address is not None:
        user_pay_result = await btcd_utils.RegTest.give_user_balance(address, int(amount))
        if user_pay_result is not None:
            await trx_block_pending()
        return user_pay_result


async def regtest_pay_key(wif: str, amount: str):
    """
    :param wif:
    :param amount:
    :return:
    """
    key = session.query(TrxKey).filter(TrxKey.value == wif, TrxKey.status == true()).one_or_none()
    if key is not None:
        address = btcd_utils.wif_to_address(key.value)
        if address is not None:
            return await btcd_utils.RegTest.give_user_balance(address, int(amount))


async def regtest_pay_keys(amount: str):
    keys = session.query(TrxKey).filter(TrxKey.status == true()).all()
    additions_to_ledger = 0
    for key in keys:
        if await regtest_pay_key(wif=key.value, amount=amount) is not None:
            additions_to_ledger += 1
    if additions_to_ledger > 0:
        await trx_block_pending()
    return additions_to_ledger


async def regtest_pay_users(amount: str):
    additions_to_ledger = 0
    for user in get_users():
        if await regtest_pay_user(user.id, amount) is not None:
            additions_to_ledger += 1

    if additions_to_ledger > 0:
        await trx_block_pending()
    return additions_to_ledger


async def regtest_user_balance(uid: str):
    user = session.query(User).filter(User.id == int(uid), User.status == 1).one_or_none()
    if user is not None:
        balance_data = await btcd_utils.RegTest.get_user_balance(user.trxkey)
        balance = sum(balance_data) if isinstance(balance_data, list) else balance_data
        user.balance = balance
        await update_user_balance(user, balance)
        return balance


async def update_user_balance(user: User, balance: any):
    user.balance = balance
    try:
        session.add(user)
        session.commit()
        session.flush()
        return True
    except exc.SQLAlchemyError as err:
        logger.debug('Error updating user balance for user %s' % user.name + ': \n' + json.dumps(err))
        return False


async def regtest_block_info():
    block_info = json.loads(await btcd_utils.RegTest.get_info())
    unspent_transactions = json.loads(await btcd_utils.RegTest.list_unspent())
    return json.dumps({'info': block_info, 'unspent': unspent_transactions}, indent=4, sort_keys=True)


async def regtest_user_estimated_value(uid: str, balance: any=None):
    user = await get_user(uid)
    if user and user.trxkey is not None:
        price = await latest_price_data(DEFAULT_LANGUAGE)
        if price and price.last is not None:
            btc = Decimal(await btcd_utils.RegTest.get_user_balance(user.trxkey)) if balance is None else Decimal(balance)
            estimated_value = btc * price.last
            logger.info('Price before quantization: %s' % str(estimated_value))
            return str(estimated_value.quantize(Decimal(".01"), rounding=ROUND_HALF_UP))


async def regtest_users_clear_keys():
    for user in get_users():
        for key in user.trxkey:
            skey = session.query(SKey).filter(SKey.kid == key.id).one()
            if skey is not None:
                session.delete(skey)
            session.delete(key)
    try:
        session.commit()
        return {'error': False}
    except exc.SQLAlchemyError as err:
        return {'error': True, 'message': json.dumps(err)}


async def wif_to_address(wif):
    if wif is not None:
        address = btcd_utils.wif_to_address(wif)

        return address if address is not None else -1


async def get_user(uid: str):
    user = session.query(User).filter(User.id == int(uid)).one_or_none()
    return user if user is not None else False


async def get_user_by_name(name: str):
    user = session.query(User).filter(User.name == name).one_or_none()
    return user if user is not None else False


async def update_user(uid: str, data: dict):
    changed = False
    user = await get_user(uid)
    if user is not None:
        for k, v in data.items():
            if hasattr(user, k):
                if getattr(user, k) != v:
                    changed = True
                    setattr(user, k, v)
    if changed:
        try:
            session.add(user)
            session.commit()
            return True

        except exc.SQLAlchemyError as error:
            print(error)
            return False


def sender_recipient_ready(sender: User, recipient: User) -> bool:
    return sender and recipient and hasattr(sender, 'trxkey') and hasattr(recipient, 'trxkey')


async def regtest_graph_data(time, days):
    minmax_dataset = await btc_hour_minmax_price(time, days)
    hourly_minmax = []
    for row in minmax_dataset:
        hourly_minmax.append({'date': row[0].strftime("%Y-%m-%d %H:%M:%S"), 'low': str(row[1]), 'high': str(row[2])})
    return json.dumps(hourly_minmax)


async def btc_hour_minmax_price(time: str, days: str):
    return engine.execute("SELECT date_trunc('minute', to_timestamp(modified)) - "
                          "(EXTRACT('minute' FROM to_timestamp(modified))::integer %% " + time + ") * interval '15 minutes' as date, min(last), max(last) "
                          "FROM cx_price_revision "
                          "WHERE currency='CAD' "
                          "AND to_timestamp(modified) < CURRENT_TIMESTAMP AND to_timestamp(modified) > (CURRENT_TIMESTAMP - INTERVAL '" + days + " days')"
                          "GROUP BY 1 ORDER BY date;")


def min_30_interval():
    engine.execute("SELECT date_trunc('hour', to_timestamp(modified)) - "
                   "(EXTRACT('hour' FROM to_timestamp(modified))::integer % 30) * interval '1 minute' as date, min(last), max(last) "
                   "FROM cx_price_revision "
                   "WHERE currency='CAD' "
                   "GROUP BY 1 ORDER BY date;")


def max_last_hour():
    engine.execute(""

                   "SELECT to_timestamp(modified), buy "
                   "FROM cx_price_revision "
                   "WHERE modified < extract(epoch from now())::int and modified > (extract(epoch from now())::int -3600) "
                   "AND currency = 'CAD' "
                   "GROUP BY buy, to_timestamp(modified) "
                   "ORDER BY buy DESC LIMIT 1;")


def min_last_hour():
    engine.execute(""

                   "SELECT to_timestamp(modified), buy "
                   "FROM cx_price_revision "
                   "WHERE modified < extract(epoch from now())::int and modified > (extract(epoch from now())::int -3600) "
                   "AND currency = 'CAD' "
                   "GROUP BY buy, to_timestamp(modified) "
                   "ORDER BY buy ASC LIMIT 1;")


async def trc_latest_price():
    """
    Retrieves the latest price recorded on the TRC Mockchain (in CAD)
    :return:
    """
    latest_trc_price = session.query(TRCHistory).group_by(TRCHistory.id).order_by(func.max(TRCHistory.id).desc()).limit(
        1).one_or_none()
    return latest_trc_price


def trc_insert_price(date, value):
    new_price = TRCHistory(time=date, value=value)

    try:
        session.add(new_price)
        session.commit()
        session.flush()

        return True

    except exc.SQLAlchemyError as err:
        print('This should be logged: \n' + str(err))
        return False


async def trx_block_pending():
    trx_state = session.query(TRX).one()
    try:
        trx_state.pending = True
        session.add(trx_state)
        session.commit()

        return {'result': True, 'error': False}

    except exc.SQLAlchemyError as err:
        print(err)
        return {'result': err, 'error': True}


def trx_block_not_pending():
    trx_state = session.query(TRX).one()
    try:
        trx_state.pending = False
        session.add(trx_state)
        session.commit()

        return {'result': True, 'error': False}

    except exc.SQLAlchemyError as err:
        print(err)
        return {'result': err, 'error': True}


def trx_block_is_pending():
    try:
        trx_state = session.query(TRX).first()
        if trx_state is None:
            new_state = TRX(pending=false())
            session.add(new_state)
            session.commit()
            return False
        return trx_state.pending
    except exc.SQLAlchemyError as e:
        logger.debug(e)


async def regtest_total_balance():
    key_objects = session.query(TrxKey).filter(TrxKey.status == true()).group_by(TrxKey.id).order_by(
        func.max(TrxKey.id).desc()).all()
    balance = await btcd_utils.RegTest.get_user_balance(key_objects)
    return balance


async def regtest_balance_by_account(active=False):
    account_data = []
    if active:
        keys = session.query(TrxKey).filter(TrxKey.status == true()).group_by(TrxKey.id).order_by(func.max(TrxKey.id).desc()).all()
    else:
        keys = session.query(TrxKey).group_by(TrxKey.id).order_by(func.max(TrxKey.id).desc()).all()
    if keys is not None and len(keys) > 0:
        for key in keys:
            account_data.append({
                'balance': await btcd_utils.RegTest.get_key_balance({'status': key.status, 'value': key.value}),
                'id': key.id,
                'status': key.status,
                'label': str(key.label.text) if key.label is not None else 'No Label',
                'multi': key.multi,
                'user': {
                    'id': key.user.id,
                    'level': key.user.level,
                    'email': key.user.email,
                    'name': key.user.name,
                    'last_balance': str(key.user.balance),
                    'created': datetime.datetime.utcfromtimestamp(key.user.created).strftime('%Y-%m-%d %H:%M:%S')
                }
            })
        return account_data


async def regtest_balance_by_user():
    data = []
    users = session.query(User).group_by(User.id).order_by(func.max(User.id).desc()).all()
    for user in users:
        user_data = {'name': user.name, 'id': user.id, 'keys': []}
        for key in user.trxkey:
            user_data['keys'].append({'id': key.id, 'value': key.value, 'balance': await btcd_utils.RegTest.get_user_balance([key])})
        data.append(user_data)
    return data


async def regtest_active_balance_by_user():
    data = []
    users = session.query(User).group_by(User.id).order_by(func.max(User.id).desc()).all()
    for user in users:
        user_data = {
            'name': user.name,
            'id': user.id,
            'keys': [],
            'created': datetime.datetime.utcfromtimestamp(user.created).strftime('%Y-%m-%d %H:%M:%S'),
            'balance': str(user.balance),
            'level': user.level,
            'email': user.email,
            'status': user.status
        }
        for key in user.trxkey:
            balance = await btcd_utils.RegTest.get_user_balance([key])
            if balance > 0:
                user_data['keys'].append({'id': key.id, 'value': key.value, 'balance': balance})
        if len(user_data['keys']) > 0:
            data.append(user_data)
    return data


async def regtest_user_balance_by_key(name):
    user = session.query(User).filter(User.name == name).group_by(User.id).order_by(func.max(User.id).desc()).one_or_none()
    if user:
        user_data = {'name': user.name, 'id': user.id, 'keys': []}
        for key in user.trxkey:
            user_data['keys'].append({'id': key.id, 'value': key.value, 'balance': await btcd_utils.RegTest.get_user_balance([key])})
        return user_data


async def trx_pay_users(amount_to_send):
    from utils.tx.trx__tx_out import Transaction
    failed_transactions = []
    amount = amount_to_send if not is_dust_amount(amount_to_send) else COIN * int(amount_to_send)
    coinmaster = await get_user(COINMASTER_USER_ID)
    coinmaster_key = [x for x in coinmaster.trxkey if x.status][0]
    coinmaster_address = btcd_utils.wif_to_address(coinmaster_key.value)
    for user in get_users():
        keys = sorted([x for x in user.trxkey if x.status], key=lambda y: y.id, reverse=True)
        if keys is not None and len(keys) > 0:
            key = keys[0]
            address = btcd_utils.wif_to_address(key.value)

            if address is not None:
                pay_object = {
                    'amount': int(round(int(amount))),
                    'sender': {
                        'address': coinmaster_address,
                        'key': coinmaster_key.value
                    },
                    'recipient': address}

                transaction_result = await Transaction.request_transaction(pay_object)
                if transaction_result:
                    await trx_block_pending()
                else:
                    failed_transactions.append(user.id)
    return failed_transactions


async def trx_pay_user(uid, amount_to_send):
    from utils.tx.trx__tx_out import Transaction
    """
    :param uid:
    :param amount:
    :return:
    """
    key = session.query(TrxKey).filter(TrxKey.uid == int(uid), TrxKey.status == true()).group_by(TrxKey.id).order_by(
        func.max(TrxKey.id).desc()).limit(1).one_or_none()
    if key is not None:
        address = btcd_utils.wif_to_address(key.value)
    else:
        address = await regtest_make_user_address(int(uid))

    if address is not None:
        amount = amount_to_send if not is_dust_amount(amount_to_send) else COIN * int(amount_to_send)
        coinmaster = await get_user(16)
        print(str(coinmaster.name))
        coinmaster_key = [x for x in coinmaster.trxkey if x.status][0]
        coinmaster_address = btcd_utils.wif_to_address(coinmaster_key.value)

        pay_object = {
            'amount': int(round(int(amount))),
            'sender': {
                'address': coinmaster_address,
                'key': coinmaster_key.value
            },
            'recipient': address}

        transaction_result = await Transaction.request_transaction(pay_object)
        if transaction_result:
            await trx_block_pending()
            return True
        else:
            return False


def is_dust_amount(amount):
    return len(str(amount)) == 1


async def password_override(uid, password):
    user = session.query(User).filter(User.id == uid).one_or_none()
    if user:
        user.hash_password(password)
        return await update_resource(user)


async def connect_to_db():
    try:
        Base.metadata.create_all(bind=engine)
        return True
    except exc.DatabaseError as e:
        logger.info(e)
        time.sleep(15)
        await connect_to_db()


async def create_offer(uid, rate, amount, date, currency):
    new_offer = Offer(uid=uid, rate=rate, amount=amount, end_date=date, currency=currency)
    try:
        session.add(new_offer)
        session.commit()
        session.flush()
        return True
    except exc.SQLAlchemyError as e:
        logger.info(e)
        return False


async def create_bid(uid, rate, amount, date, currency):
    new_bid = Bid(uid=uid, rate=rate, amount=amount, end_date=date, currency=currency)
    try:
        session.add(new_bid)
        session.commit()
        session.flush()
        return True
    except exc.SQLAlchemyError as e:
        logger.info(e)
        return False


async def get_offers():
    offers = session.query(Offer).filter(Offer.completed == false()).all()
    return [x.serialize() for x in offers]


async def get_bids():
    bids = session.query(Bid).filter(Bid.completed == false()).all()
    return [x.serialize() for x in bids]


async def get_offer(oid):
    offer = session.query(Offer).filter(Offer.id == oid).one_or_none()
    if offer:
        return offer


async def get_bid(bid):
    bid = session.query(Bid).filter(Bid.id == bid).one_or_none()
    if bid:
        return bid


async def trade_finish(trade: Union[Bid, Offer]):
    trade.completed = true()
    try:
        session.add(trade)
        session.commit()
        session.flush()
        return True
    except exc.SQLAlchemyError as e:
        logger.info(e)
        return False
