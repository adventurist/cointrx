import graphene

from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from db.db import TrxKey, User


class Key(SQLAlchemyObjectType):
    class Meta:
        model = TrxKey
        interfaces = (relay.Node, )


class TrxUser(SQLAlchemyObjectType):
    class Meta:
        model = User
        interfaces = (relay.Node, )


class Query(graphene.ObjectType):
    node = relay.Node.Field()
    all_keys = SQLAlchemyConnectionField(Key)


class GraphTRX:
    def __init__(self):
        self.schema = graphene.Schema(query=Query)

    def retrieve_keys(self):
        return self.schema.execute('{  }')


schema = graphene.Schema(query=Query)
