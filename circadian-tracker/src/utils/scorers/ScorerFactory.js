import { ScorerBase } from './ScorerBase'
import { SleepScorer } from './SleepScorer'

const SCORER_REGISTRY = new Map()

export function registerScorer(name, ScorerClass) {
  SCORER_REGISTRY.set(name, ScorerClass)
}

registerScorer('sleep-scorer', SleepScorer)

export class ScorerFactory {
  static create(name, weights = {}, goals = {}) {
    const Cls = SCORER_REGISTRY.get(name)
    if (!Cls) throw new Error(`Unknown scorer strategy: ${name}`)
    return new Cls(weights, goals)
  }

  static createSleepScorer(weights = {}, goals = {}) {
    return new SleepScorer(weights, goals)
  }
}

export { SCORER_REGISTRY }
