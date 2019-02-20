import log from 'loglevel'
import Accounting from 'accounting'

/**
 * Enum map representing the parts of a trade
 */
export const TradeType = Object.freeze({
  // 1: 'BID',
  // 2: 'OFFER'
  BID: 1,
  OFFER: 2
})

/**
 * TradeManager
 * @param {Object}} user The TRX user
 * @param {Object} An object of arrays containing pending bids and offers
 */
export default function TradeManager (user, pending = { bids: [], offers: [] }) {
  // set member variables
  const { bids, offers } = pending
  this.matchedBids = []
  this.matchedOffers = []
  this.candidates = []

  /**
   * Configure the accounting settings
   * @returns {Boolean} True or false depending on whether or not the options passed to the function had properties with which to update the settings of the Accounting library
   */
  this.configAccounting = (options = {}) => {
    if (!isEmpty(options)) {
      Accounting.settings = options
      return true
    }
    return false
  }

  /**
   * Parse all added bids and determine which are valid matches to offers of the current user
   */
  this.parseBids = function () {
    bids.forEach(bid => {
      if (parseInt(bid.uid) === parseInt(user.id)) {
        this.candidates = [
          ...this.candidates,
          ...offers.filter(offer =>
            parseFloat(offer.rate) <= parseFloat(bid.rate) &&
            offer.uid !== bid.uid &&
            !this.candidates.some(candidate => candidate.bid.id === bid.id)
          ).map(matchedOffer => {
            return new Trade(matchedOffer, bid, TradeType.BID)
          })
        ]
      }
    })
  }

  /**
   * Parse all added offers and determine which are valid matches to bids of the current user
   */
  this.parseOffers = function () {
    offers.forEach(offer => {
      if (parseInt(offer.uid) === parseInt(user.id)) {
        this.candidates = [
          ...this.candidates,
          ...bids.filter(bid =>
            parseFloat(bid.rate) <= parseFloat(offer.rate) &&
            bid.uid !== offer.uid &&
            !this.candidates.some(candidate => candidate.offer.id === offer.id)
          ).map(matchedBid => {
            return new Trade(offer, matchedBid, TradeType.OFFER)
          })
        ]
      }
    })
  }

  /**
   * Parse all pending trade bids/offers and organize them into Trade objects
   */
  this.start = function () {
    this.parseBids()
    this.parseOffers()
  }

  /**
   * @returns {Array<Trade>} An array of trade objects
   */
  this.getMatchedTrades = () => {
    return [ ... this.candidates ]
  }

  /**
   * @returns {Array<Trade>} An array of trade objects wherein the current user is bidding
   */
  this.getBidMatches = () => {
    return [ ... this.candidates.filter(candidate => candidate.type === TradeType.BID)]
  }

  /**
   * @returns {Array<Trade>} An array of trade objects wherein the current user is offering
   */
  this.getBidMatches = () => {
    return [ ... this.candidates.filter(candidate => candidate.type === TradeType.OFFER)]
  }

  /**
   * @returns {Array} An array of bid objects
   */
  this.getMatchedBids = function () {
    return this.matchedBids
  }

  /**
   * @returns {Array} An array of offer objects
   */
  this.getMatchedOffers = function () {
    return this.matchedOffers
  }

  /**
   * @returns {Trade|Object} An array of Trade objects, representing matches for the current user
   */
  this.getMatched = () => {
    return [... this.matchedBids, ... this.matchedOffers ]
  }

  /**
   * @param {Object} tradeInfo
   * @param {string} tradeInfo.type The type of trade
   * @param {number|string} tradeInfo.id The id of the trade part to be removed from the TradeManager's state
   * @returns {Boolean} True or false, contingent on the successful removal of a trade
   */
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

  /**
   * @returns {number} The number of trade candidates currently in state
   */
  this.numOfAvailableTrades = () => {
    return this.candidates.length
  }
}

export function Trade(offer, bid, type) {
  if (!Object.values(TradeType).find(t => t === type)) {
    return false
  }
  this.offer = offer
  this.bid = bid
  this.type = type

  /**
   * @returns {Boolean} Indicates whether or not the trade has all of the required parts necessary to move forward
   */
  this.ready = () => {
    return this.offer && this.bid
  }

  /**
   * @returns {TradeType} The type of trade this represents based on how the current user's role pertains to it
   */
  this.getType = () => {
    return TradeType[this.type]
  }
}

/**
 * Utility function to check and see if an object has iterable properties
 *
 * @param {Object} obj
 */
function isEmpty (obj) {
  for (let prop in obj) {
    return false
  }
  return true
}
