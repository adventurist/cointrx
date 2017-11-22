"""discriminator_on_related.py

Illustrates a mixin which provides a generic association
using a single target table and a single association table,
referred to by all parent tables.  The association table
contains a "discriminator" column which determines what type of
parent object associates to each particular row in the association
table.

SQLAlchemy's single-table-inheritance feature is used
to target different association types.

This configuration attempts to simulate a so-called "generic foreign key"
as closely as possible without actually foregoing the use of real
foreign keys.   Unlike table-per-related and table-per-association,
it uses a fixed number of tables to serve any number of potential parent
objects, but is also slightly more complex.

"""
from sqlalchemy.ext.declarative import as_declarative, declared_attr
from sqlalchemy import create_engine, Integer, Column, \
    String, ForeignKey
from sqlalchemy.orm import Session, relationship, backref
from sqlalchemy.ext.associationproxy import association_proxy

@as_declarative()
class HeartbeatCommentBase(object):
    """Base class which provides automated table name
    and surrogate primary key column.

    """
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()
    cid = Column(Integer, primary_key=True)

class CommentAssociation(HeartbeatCommentBase):
    """Associates a collection of Comment objects
    with a particular parent.

    """
    __tablename__ = "comment_association"

    entity_type = Column(String)
    """Refers to the type of parent."""

    __mapper_args__ = {"polymorphic_on": entity_type}


class HeartbeatComment(HeartbeatCommentBase):
    """The Address class.

    This represents all address records in a
    single table.

    """
    uid = Column(Integer, ForeignKey('users_field_data.uid'))
    body = relationship("HeartbeatCommentBody", backref="comment_field_data", uselist=False)
    entity_id = Column(Integer, foreign_keys=['heartbeat_field_data.id', 'comment_field_data.cid'])
    entity_type = Column(Integer, ForeignKey("comment_association.id"))
    association = relationship("CommentAssociation", backref="comments")

    parent = association_proxy("association", "parent")



class HasComments(object):
    """HasAddresses mixin, creates a relationship to
    the address_association table for each parent.

    """
    @declared_attr
    def comment_association_id(cls):
        return Column(Integer, ForeignKey("comment_association.id"))

    @declared_attr
    def comment_association(cls):
        name = cls.__name__
        entity_type = name.lower()

        assoc_cls = type(
            "%sCommentAssociation" % name,
            (CommentAssociation, ),
            dict(
                __tablename__=None,
                __mapper_args__={
                    "polymorphic_identity": entity_type
                }
            )
        )

        cls.addresses = association_proxy(
            "address_association", "addresses",
            creator=lambda addresses: assoc_cls(addresses=addresses)
        )
        return relationship(assoc_cls,
                            backref=backref("parent", uselist=False))


class Customer(HasAddresses, Base):
    name = Column(String)


class Supplier(HasAddresses, Base):
    company_name = Column(String)

engine = create_engine('sqlite://', echo=True)
Base.metadata.create_all(engine)

session = Session(engine)

session.add_all([
    Customer(
        name='customer 1',
        addresses=[
            Address(
                street='123 anywhere street',
                city="New York",
                zip="10110"),
            Address(
                street='40 main street',
                city="San Francisco",
                zip="95732")
        ]
    ),
    Supplier(
        company_name="Ace Hammers",
        addresses=[
            Address(
                street='2569 west elm',
                city="Detroit",
                zip="56785")
        ]
    ),
])

session.commit()

for customer in session.query(Customer):
    for address in customer.addresses:
        print(address)
        print(address.parent)