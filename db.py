from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)
from passlib.apps import custom_app_context as pwd_context
from sqlalchemy import ForeignKey
from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, String, DateTime, DECIMAL, Boolean, exc, event, Table, MetaData, DDL, join, \
    select, insert, update
from sqlalchemy import desc
from sqlalchemy import func
from sqlalchemy.engine.url import URL
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.declarative import declarative_base

import asyncio

from aiopg.sa import create_engine as async_engine

from mypy import *

import json
import re
import time
import datetime
import db_config
import random

from types import SimpleNamespace

Base = declarative_base()
metadata = MetaData()
engine = create_engine(URL(**db_config.DATABASE))
Session = sessionmaker(bind=engine)

session = Session()

trxapp = SimpleNamespace()
trxapp.config = {'SECRET_KEY': "jigga does as jigga does"}


# async def count(conn):
#     c1 = (await conn.scalar(jiggas.count()))
#     c2 = (await conn.scalar(emails.count()))
#     print("Population consists of", c1, "people with",
#           c2, "emails in total")
#     add_join = join(emails, jiggas, jiggas.c.id == emails.c.user_id)
#     query = (select([jiggas.c.name])
#              .select_from(add_join)
#              .where(emails.c.private == False)  # noqa
#              .group_by(jiggas.c.name)
#              .having(func.count(emails.c.private) > 0))
#
#     print("Users with public emails:")
#     async for row in conn.execute(query):
#         print(row.name)
#
#     print()


# async def show_julia(conn):
#     print("Lookup for Julia:")
#     add_join = join(emails, jiggas, jiggas.c.id == emails.c.user_id)
#     query = (select([jiggas, emails], use_labels=True)
#              .select_from(add_join).where(jiggas.c.name == 'Julia'))
#     async for row in conn.execute(query):
#         print(row.jiggas_name, row.jiggas_birthday,
#               row.emails_email, row.emails_private)
#     print()


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String(64))
    hash = Column(String(256))
    email = Column(String(64))
    created = Column(Integer)
    status = Column(Integer)

    def hash_password(self, password):
        self.hash = pwd_context.encrypt(password)

    @staticmethod
    def see_hash(password):
        print(str(pwd_context.encrypt(password)))

    def compare_hash(self, password):
        print(str(pwd_context.verify(password, self.hash)))
        User.see_hash(password)
        print(str(self.hash))
        return pwd_context.verify(password, self.hash)

    def generate_auth_token(self, expiration=600):
        s = Serializer(trxapp.config['SECRET_KEY'], expires_in=expiration)
        return s.dumps({'id': self.id})

    def serialize(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created': self.created,
            'status': self.status
        }

    @staticmethod
    def verify_password(email_or_token, password) -> bool:
        user = User.verify_auth_token(email_or_token)
        print('78')
        # print(str(user))
        if not user:
            user = session.query(User).filter(User.email == email_or_token).first()
            print("82 checking " + str(user.serialize()))
            # print(str(user.compare_hash(password)))
            # print(str(User.see_hash(password)))
            if user is None or not user.compare_hash(password):
                print('Returning false on 85')
                return False
        return True

    @staticmethod
    def generate_hash(password):
        return pwd_context.encrypt(password)

    @staticmethod
    def verify_auth_token(token):
        s = Serializer(trxapp.config['SECRET_KEY'])
        try:
            data = s.loads(token)
        except SignatureExpired:
            return None  # valid token, but expired
        except BadSignature:
            return None  # invalid token
        user = session.query(User).get(data['id'])
        # print(str(user))
        if user is None:
            return
        return user


class CXPrice(Base):
    __tablename__ = 'cx_price'
    id = Column(Integer, primary_key=True)
    currency = Column(String(4))
    last = Column(DECIMAL(12, 2))
    buy = Column(DECIMAL(12, 2))
    sell = Column(DECIMAL(12, 2))
    modified = Column(Integer)
    revisions = relationship("CXPriceRevision", back_populates="cx_price", lazy="select")

    def serialize(self) -> dict:
        return {
            'id': self.id,
            'currency': self.currency,
            'last': re.sub("[^0-9^.]", "", str(self.last)),
            'buy': re.sub("[^0-9^.]", "", str(self.buy)),
            'sell': re.sub("[^0-9^.]", "", str(self.sell)),
            'modified': self.modified
        }


class CXPriceRevision(Base):
    __tablename__ = 'cx_price_revision'
    id = Column(Integer, primary_key=True)
    rid = Column(Integer)
    currency = Column(String(4))
    last = Column(DECIMAL(12, 2))
    buy = Column(DECIMAL(12, 2))
    sell = Column(DECIMAL(12, 2))
    modified = Column(Integer)
    currency_id = Column(Integer, ForeignKey('cx_price.id'))
    cx_price = relationship("CXPrice", back_populates="revisions")

    def serialize(self):
        return {
            'id': self.id,
            'rid': self.rid,
            'currency': self.currency,
            'last': re.sub("[^0-9^.]", "", str(self.last)),
            'buy': re.sub("[^0-9^.]", "", str(self.buy)),
            'sell': re.sub("[^0-9^.]", "", str(self.sell)),
            'modified': self.modified,
            'currency_id': self.currency_id
        }


class CADCur(Base):
    __tablename__ = 'cad_cur'
    id = Column(Integer, primary_key=True)
    currency = Column(String(4))
    last = Column(DECIMAL(12, 3))
    buy = Column(DECIMAL(12, 3))
    sell = Column(DECIMAL(12, 3))
    volume = Column(DECIMAL(12, 3))
    modified = Column(Integer)


class CADCurRevision(Base):
    __tablename__ = 'cad_cur_revision'
    id = Column(Integer, primary_key=True)
    rid = Column(Integer)
    currency = Column(String(4))
    last = Column(DECIMAL(12, 3))
    buy = Column(DECIMAL(12, 3))
    sell = Column(DECIMAL(12, 3))
    volume = Column(DECIMAL(12, 3))
    modified = Column(Integer)


async def test_db():
    engine = await async_engine(user=db_config.DATABASE['username'], database=db_config.DATABASE['database'],
                                host=db_config.DATABASE['host'], password=db_config.DATABASE['password'])
    async with engine:
        async with engine.acquire() as conn:
            query = select([CXPrice])
            async for row in conn.execute(query):
                print(row)


                # engine = await async_engine(user='coinxadmin',
                #                             database='coinxdb',
                #                             host='127.0.0.1',
                #                             password='coinxadmin')
                # Session = sessionmaker(bind=engine)
                # session = Session()
                # prices = await session.query(CXPrice).all()
                # async for price in prices:
                #     print(price)


                # @asyncio.coroutine
                # def test_db():
                #     engine_instance = yield from trx_db_engine()
                #     with engine_instance.acquire() as conn:
                #         yield from conn.execute(tbl.insert().values(val='abc'))
                #
                #         for row in conn.execute(tbl.select().where(tbl.c.val=='abc')):
                #             print(row.id, row.val)
                # async_e = yield from trx_db_engine()
                # with (yield from async_e) as conn:
                #     res = yield from conn.execute("SELECT * from cx_price_revision")
                #     handle_db_data(res)
                #
                #     with engine.async_e() as conn:
                #
                #         yield from conn.execute(tbl.insert().values(val='abc'))
                #
                #         for row in conn.execute(tbl.select().where(tbl.c.val=='abc'))
                #             print(row.id, row.val)


def db_connect():
    return create_engine(URL(**db_config.DATABASE))


async def trx_db_engine():
    return async_engine(user=db_config.DATABASE['username'], database=db_config.DATABASE['database'],
                        host=db_config.DATABASE['host'], password=db_config.DATABASE['password'])


def create_all():
    Base.metadata.create_all(db_connect())


def create_user():
    print("Stuff here")


def handle_db_data(response):
    for row in response:
        if isinstance(row, CXPriceRevision):
            print(row.serialize())


def update_prices(data):
    loop = asyncio.get_event_loop()
    loop.run_until_complete(parse_price_data(data))


def latest_prices():
    try:
        result = session.query(CXPrice).all()
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
        result = session.query(CXPrice).all()
        data = []
        for r in result:
            if isinstance(r, CXPrice):
                data.append(r.serialize())
        print(data)
        return data
    except exc.SQLAlchemyError as err:
        print(err.args)
        session.rollback()


def latest_price(currency: str) -> str:
    result = session.query(CXPrice).filter(CXPrice.currency == currency).one_or_none()
    if result is not None:
        print(result.serialize())
        return 'jigga'


async def latest_price_async(currency: str) -> str:
    result = await session.query(CXPrice).filter(CXPrice.currency == currency).one_or_none()
    if result is not None:
        print(result.serialize())
        return 'jigga'


def latest_price_history(currency: str):
    result = session.query(CXPriceRevision).filter(CXPriceRevision.currency == currency).order_by(CXPriceRevision.rid.desc()).limit(15).all()
    if result is not None:
        for r in result:
            print(r.serialize())
    return result


async def latest_price_history_async(currency: str):
    result = session.query(CXPriceRevision).filter(CXPriceRevision.currency == currency).order_by(CXPriceRevision.rid.desc()).limit(15).all()
    data = []
    if result is not None:
        for r in result:
            data.append(r.serialize())
    return data

# async def get_users():
#     engine = await async_engine(user=db_config.DATABASE['username'], database=db_config.DATABASE['database'],
#                                 host=db_config.DATABASE['host'], password=db_config.DATABASE['password'])
#
#     async with engine:
#         async with engine.acquire() as conn:
#             try:
#                 query = select([User])
#                 result = await conn.execute(query)
#                 result = await [r for r, in result]
#                 return result
#             except exc.SQLAlchemyError as error:
#                 print(error)
#

def get_users():
    result = session.query(User).all()
    data = {}
    for r in result:
        if isinstance(r, User):
            data.update(r.serialize())
    print(data)
    return result


async def parse_price_data(data):
    for k, v in data.items():
        # print('My thing is')
        # print(k)
        # print('My value is')
        # print(json.dumps(v['sell']))

        engine = await async_engine(user=db_config.DATABASE['username'], database=db_config.DATABASE['database'],
                                    host=db_config.DATABASE['host'], password=db_config.DATABASE['password'])

        async with engine:
            async with engine.acquire() as conn:
                try:
                    query = select([CXPrice]).where(CXPrice.currency == k)

                    cur_time = time.time()
                    # async for row in conn.execute(query):
                    #     print(row)
                    #     if row is None:
                    #         print('jigga')
                    result = await conn.execute(query)

                    if result.rowcount < 1:
                        async with conn.begin():
                            await conn.execute(
                                CXPrice.__table__.insert().values(currency=k, sell=v['sell'],
                                                                  last=v['last'],
                                                                  buy=v['buy'],
                                                                  modified=cur_time))

                    else:
                        async with conn.begin():
                            await conn.execute(
                                CXPrice.__table__.update().where(CXPrice.currency == k).values(sell=v['sell'],
                                                                                               last=v['last'],
                                                                                               buy=v['buy'],
                                                                                               modified=cur_time))
                            # rev_query = await select([CXPriceRevision])
                            # .where(CXPriceRevision.currency == k).group_by(CXPriceRevision.id).order_by(desc(func.max(CXPriceRevision.rid)))
                            # async for row in conn.execute(rev_query):

                    # rid = rid if row is None else row.rid + 1
                    query2 = select([CXPriceRevision]).where(CXPriceRevision.currency == k).group_by(
                        CXPriceRevision.id).order_by(desc(func.max(CXPriceRevision.rid)))
                    result2 = await conn.execute(query2)
                    rid = find_rid(result2)
                    rid = rid + 1 if rid is not None else 1

                    await conn.execute(
                        CXPriceRevision.__table__.insert().values(rid=rid, currency=k, sell=v['sell'],
                                                                  last=v['last'],
                                                                  buy=v['buy'],
                                                                  modified=cur_time))


                except exc.SQLAlchemyError as error:
                    print(error)

                finally:
                    conn.close()



                    # async with engine:
                    #     async with engine.acquire() as conn:
                    #         query = select([CXPrice])
                    #         async for row in conn.execute(query):
                    #             print(row)


async def fill_data(conn):
    async with conn.begin():
        for name in random.sample(names, len(names)):
            uid = await conn.scalar(
                users.insert().values(name=name, birthday=gen_birthday()))
            emails_count = int(random.paretovariate(2))
            for num in random.sample(range(10000), emails_count):
                is_private = random.uniform(0, 1) < 0.8
                await conn.execute(emails.insert().values(
                    user_id=uid,
                    email='{}+{}@gmail.com'.format(name, num),
                    private=is_private))
                #     query_price = session.query(CXPrice).filter(CXPrice.currency == k).first()
                #     # TODO move revision insert to trigger
                #     if query_price is None:
                #         new_currency = CXPrice(currency=k, last=v['last'], buy=v['buy'], sell=v['sell'], modified=time.time())
                #         # last = session.query(CXPriceRevision).filter(CXPriceRevision.currency == v.currency).group_by(CXPriceRevision.id).order_by(desc(func.max(CXPriceRevision.rid))).one_or_none()
                #         new_rev = CXPriceRevision(rid=1, currency=k, last=v['last'], buy=v['buy'], sell=v['sell'], modified=new_currency.modified)
                #
                #         try:
                #             session.add(new_currency)
                #             session.commit()
                #             new_rev.currency_id = new_currency.id
                #             session.add(new_rev)
                #             session.commit()
                #         except exc.SQLAlchemyError as error:
                #             session.rollback()
                #             print(error)
                #     else:
                #         print(query_price.serialize())
                #
                #         query_price.last = v['last']
                #         query_price.buy = v['buy']
                #         query_price.sell = v['sell']
                #         query_price.modified = time.time()
                #         revisions = query_price.revisions
                #         # last = None
                #         # last = session.query(CXPriceRevision).filter(CXPriceRevision.id == query_price.id).group_by(CXPriceRevision.id).order_by(desc(func.max(CXPriceRevision.rid))).one_or_none()
                #         rid = 1 if revisions is None else revisions[0] + 1
                #         new_rev = CXPriceRevision(rid=rid, currency=k, last=v['last'], buy=v['buy'], sell=v['sell'], modified=query_price.modified)
                #
                #         try:
                #             session.add(query_price)
                #             session.add(new_rev)
                #             session.commit()
                #         except exc.SQLAlchemyError as error:
                #             session.rollback()
                #             print(error)
                #
                #         # query_price(currency=k, last=v['last'], buy=v['buy'], sell=v['sell'])
                #
                #         try:
                #             session.commit()
                #         except exc.SQLAlchemyError as error:
                #             session.rollback()
                #             print(error)


def find_rid(data):
    for d in data:
        if d is not None and d.rid is not None:
            return d.rid
        else:
            return None


def check_authentication(user, password, email):
    query_user = session.query(User).filter(User.name == user).first()
    if query_user is not None:
        if not User.verify_password(email, password):
            return "Login is no good"

        return query_user.serialize()
    else:
        pass_hash = User.generate_hash(password)
        new_user = User(name=user, hash=pass_hash, email=email,
                        created=int(time.mktime(datetime.datetime.now().timetuple())), status=1)

        try:

            session.add(new_user)
            session.commit()
            return new_user.serialize()

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




                    # for v in context.mappers.Mapper:
                    #
