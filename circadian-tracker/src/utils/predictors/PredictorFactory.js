import { PredictorBase } from './PredictorBase'
import { LinearRegressionPredictor } from './LinearRegressionPredictor'
import { MovingAveragePredictor } from './MovingAveragePredictor'
import { HoltWintersPredictor } from './HoltWintersPredictor'

const STRATEGY_REGISTRY = new Map()

export function registerPredictor(name, PredictorClass) {
  STRATEGY_REGISTRY.set(name, PredictorClass)
}

registerPredictor('linear-regression', LinearRegressionPredictor)
registerPredictor('moving-average', MovingAveragePredictor)
registerPredictor('holt-winters', HoltWintersPredictor)

const AUTO_SELECT_RULES = [
  { minRecords: 14, strategy: 'holt-winters' },
  { minRecords: 5, strategy: 'moving-average' },
  { minRecords: 2, strategy: 'linear-regression' }
]

export class PredictorFactory {
  constructor(config = {}) {
    this._instances = new Map()
    this._config = config
  }

  static create(name, config = {}) {
    const Cls = STRATEGY_REGISTRY.get(name)
    if (!Cls) throw new Error(`Unknown predictor strategy: ${name}`)
    return new Cls(config)
  }

  static autoSelect(dataLength, config = {}) {
    const preferred = config.preferredStrategy
    if (preferred) {
      const Cls = STRATEGY_REGISTRY.get(preferred)
      if (Cls) {
        const instance = new Cls(config)
        if (instance.canHandle(dataLength)) return instance
      }
    }

    for (const rule of AUTO_SELECT_RULES) {
      if (dataLength >= rule.minRecords) {
        return PredictorFactory.create(rule.strategy, config)
      }
    }

    return PredictorFactory.create('linear-regression', config)
  }

  get(name, config = {}) {
    if (!this._instances.has(name)) {
      this._instances.set(name, PredictorFactory.create(name, config))
    }
    return this._instances.get(name)
  }
}

export { STRATEGY_REGISTRY }
