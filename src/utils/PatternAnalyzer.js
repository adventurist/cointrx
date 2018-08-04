"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PatternAnalyzer {
    /**
     * Constructor for the PatternAnalyzer class
     *
     * Must be provided with a dataset
     * @param {Array} dataset An Array of patterns (which, at the time of this writing, is limited to the `Cup` pattern type)
     */
    constructor(dataset) {
        this.dataset = dataset;
    }
    /**
     * analyze
     *
     * Performs an analysis of this.dataset and makes a simple determination
     * @returns Boolean
     * @override
     */
    analyze() {
        if (this.dataset && Array.isArray(this.dataset) && this.dataset.length > 0 && isCup(this.dataset[0])) {
            return true;
        }
        return false;
    }
    /**
     * isReady
     *
     * Reports ready status
     * @returns Boolean
     * @override
     */
    isReady() {
        if (this.dataset && Array.isArray(this.dataset)) {
            return true;
        }
        return false;
    }
}
exports.default = PatternAnalyzer;
/**
 * Helper function to check if a given argument has implemented the Cup interface
 * @param arg
 */
function isCup(arg) {
    return arg.firstPeak !== void 0;
}
