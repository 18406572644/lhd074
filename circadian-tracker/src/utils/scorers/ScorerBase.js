export class ScorerBase {
  get name() {
    throw new Error('ScorerBase.name must be overridden')
  }

  score(record) {
    throw new Error('ScorerBase.score() must be overridden')
  }

  setWeights(weights) {
    throw new Error('ScorerBase.setWeights() must be overridden')
  }

  getWeights() {
    throw new Error('ScorerBase.getWeights() must be overridden')
  }
}
