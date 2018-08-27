import AnalysisTool from './AnalysisTool'
import Cup from './Cup'



export default class PatternAnalyzer implements AnalysisTool {
  dataset: Array<Cup>

  /**
   * Constructor for the PatternAnalyzer class
   *
   * Must be provided with a dataset
   * @param {Array} dataset An Array of patterns (which, at the time of this writing, is limited to the `Cup` pattern type)
   */
  constructor (dataset: Array<Cup>) {
    this.dataset = dataset
  }

  /**
   * analyze
   *
   * Performs an analysis of this.dataset and makes a simple determination
   * @returns Boolean
   * @override
   */
  public analyze() : boolean {
    if (this.dataset && Array.isArray(this.dataset) && this.dataset.length > 0 && isCup(this.dataset[0])) {
      return true
    }
    return false
  }

  /**
   * isReady
   *
   * Reports ready status
   * @returns Boolean
   * @override
   */
  public isReady() : boolean {
    if (this.dataset && Array.isArray(this.dataset)) {
      return true
    }
    return false
  }
}

/**
 * Helper function to check if a given argument has implemented the Cup interface
 * @param arg
 */
function isCup(arg: any): arg is Cup {
  return arg.first_peak !== void 0
}
