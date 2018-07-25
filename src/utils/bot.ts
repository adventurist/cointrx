import PatternAnalyzer from './PatternAnalyzer'

export default class Bot {
  ws: WebSocket
  findings: any
  analyzer: PatternAnalyzer

  constructor (ws: WebSocket, findings: any) {
    this.ws = ws
    this.findings = findings
    this.analyzer = new PatternAnalyzer(this.findings)
  }

  /**
   * decide
   */
  public decide() {
    return this.analyzer.analyze()
  }

}
