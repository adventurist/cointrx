export default function TradeManager (user, pending = { bids: [], offers: [] }) {

  const { bids, offers } = pending
  this.matchedBids = []
  this.matchedOffers = []

  this.parseBids = function () {
    bids.forEach(bid => {
      if (parseInt(bid.uid) === parseInt(user.id)) {
        this.matchedOffers = [
          ... this.matchedOffers,
          ... offers.filter(offer => {
            if (offer.rate <= bid.rate && offer.uid !== bid.uid) {
              return offer
            }
          })
        ]
      }
    })
  }

  this.parseOffers = function () {
    offers.forEach(offer => {
      if (parseInt(offer.uid) === parseInt(user.id)) {
        this.matchedBids = [
          ... this.matchedBids,
          ... bids.filter( bid => {
            if (bid.rate >= offer.rate && bid.uid !== offer.uid) {
              return bid
            }
          })
        ]
      }
    })
  }

  this.start = function () {
    this.parseBids()
    this.parseOffers()
  }

  this.getMatchedBids = function () {
    return this.matchedBids
  }

  this.getMatchedOffers = function () {
    return this.matchedOffers
  }
}