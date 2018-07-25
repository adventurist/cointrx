import AnalysisTool from './AnalysisTool'
import Cup from './Cup'



export default class PatternAnalyzer implements AnalysisTool {
  dataset: Array<Cup>

  constructor (dataset: Array<Cup>) {
    this.dataset = dataset
  }

  /**
   * name
   */
  public analyze() {
    if (this.dataset && Array.isArray(this.dataset) && this.dataset.length > 0 && isCup(this.dataset[0])) {
      return true
    }
    return false
  }
}

function isCup(arg: any): arg is Cup {
  return arg.firstPeak !== void 0
}