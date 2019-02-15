export default function TradeManager (user, pending = { bids: [], offers: [] }) {

  const { bids, offers } = pending
  this.matchedBids = []
  this.matchedOffers = []

  this.parseBids = function () {
    bids.forEach(bid => {
      if (parseInt(bid.uid) === parseInt(user.id)) {
        this.matchedOffers = [
          ... this.matchedOffers,
          ... offers.filter(offer => offer.rate <= bid.rate && offer.uid !== bid.uid && !this.matchedOffers.some(savedOffer => savedOffer.id === offer.id))
        ]
      }
    })
  }

  this.parseOffers = function () {
    offers.forEach(offer => {
      if (parseInt(offer.uid) === parseInt(user.id)) {
        this.matchedBids = [
          ... this.matchedBids,
          ... bids.filter( bid => bid.rate >= offer.rate && bid.uid !== offer.uid && !this.matchedBids.some(savedBid => savedBid.id === bid.id))
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

  this.getMatched = () => {
    return [... this.matchedBids, ... this.matchedOffers ]
  }

  this.removeTrade = (tradeInfo = {type: undefined, id: undefined}) => {
    switch (tradeInfo.type) {
      case 'bid':
        const remainingBids = this.matchedBids.filter(bid => parseInt(bid.id) !== parseInt(tradeInfo.id))
        delete this.matchedBids
        this.matchedBids = remainingBids
        break
      case 'offer':
        const remainingOffers = this.matchedOffers.filter(offer => parseInt(offer.id) !== parseInt(tradeInfo.id))
        delete this.matchedOffers
        this.matchedOffers = remainingOffers
        break
      default:
        log.error('Unable to remove trade. No recognized trade type defined')
        return false
    }
    return true
  }

  this.numOfAvailableTrades = () => {
    return this.matchedBids.length + this.matchedOffers.length
  }
}