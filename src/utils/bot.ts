import PatternAnalyzer from './PatternAnalyzer'
import Cup from './Cup'

export default class Bot {
  id: string
  ws: WebSocket
  findings: Array<Cup>
  analyzer: PatternAnalyzer
  balance: number

  /**
   *
   * @param {Websocket} ws
   * @param {Array} findings
   * @constructor
   */
  constructor (id: string, ws: WebSocket, findings: Array<Cup>) {
    this.id = id
    this.ws = ws
    this.findings = findings
    this.analyzer = new PatternAnalyzer(this.findings)
  }

  /**
   * decide
   *
   * Makes a determination on whether or not to perform a trade
   *
   * @returns {Boolean} Indication of successul completion of analysis
   */
  public decide() : boolean {
    return this.analyzer.analyze()
  }


  /**
   * isReady
   *
   * Reports ready status
   *
   * @returns {Boolean} ready status
   */
  public isReady() : boolean {
    return this.analyzer.isReady()
  }



  /**
   * setFindings
   *
   * @param findings
   */
  public setFindings (findings: any) : void {
    this.findings = findings
  }

  /**
   * trade
   *
   * Perform a trade
   *
   * @param {Object} recipient
   * @param {Boolean} selfDetermine
   *
   * @returns {Object} trade info object
   */
  public trade (recipient, selfDetermine = false) : object {
    return { result: true, error: false }
  }

}
