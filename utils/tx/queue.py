from uuid import uuid4
from types import SimpleNamespace

TX_STATUS = SimpleNamespace(NEW=0, NO_FUNDS=1, BLOCK_PENDING=2)


class TRXTransaction:
    def __init__(self, sender, recipient, amount):
        self.sender = sender
        self.recipient = recipient
        self.amount = amount
        self.id = uuid4()
        self.status = TX_STATUS.NEW

    def get_status(self):
        for status in TX_STATUS.__dict__:
            if TX_STATUS.__dict__[status] == self.status:
                return status

    def get_data(self):
        return {'sender': self.sender, 'recipient': self.recipient, 'amount': self.amount, 'id': str(self.id), 'status': str(self.get_status())}

    def set_pending(self):
        self.status = TX_STATUS.BLOCK_PENDING

    def set_no_funds(self):
        self.status = TX_STATUS.NO_FUNDS


class Node:
    def __init__(self, data: TRXTransaction):
        self.data = data
        self.next = None


class Queue:
    def __init__(self):
        self.head = None
        self.tail = None

    def enqueue(self, data: TRXTransaction):
        if self.tail is None:
            self.head = Node(data)
            self.tail = self.head
        else:
            self.tail.next = Node(data)
            self.tail = self.tail.next
            if self.head.next is None:
                self.head.next = self.tail

    def dequeue(self):
        if self.is_empty():
            return None
        elif self.head == self.tail:
            outgoing = self.head.data
            self.head = self.tail = None
            return outgoing
        else:
            outgoing = self.head.data
            self.head = self.head.next
            return outgoing

    def is_empty(self):
        return self.head == self.tail is None

    def size(self):
        count = 0
        if self.head is not None:
            iteratee = self.head
            count = 1
            while iteratee.next is not None and iteratee != iteratee.next:
                count += 1
                iteratee = iteratee.next
        return count

    def get_all_nodes(self):
        if self.head is not None:
            data = []
            iteratee = self.head
            data.append(iteratee.data.get_data())
            while iteratee.next is not None and iteratee != iteratee.next:
                iteratee = iteratee.next
                data.append(iteratee.data.get_data())
            return {
                'count': len(data),
                'nodes': data
            }
