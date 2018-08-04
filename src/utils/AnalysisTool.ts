/**
 * @interface
 */
export default interface AnalysisTool {
  analyze(): boolean
  isReady(): boolean
}