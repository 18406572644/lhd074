import { PredictorBase } from './PredictorBase'
import { LinearRegressionPredictor } from './LinearRegressionPredictor'

export class MovingAveragePredictor extends PredictorBase {
  constructor(window = 3) {
    super()
    this.window = window
    this._lrFallback = new LinearRegressionPredictor()
  }

  get name() {
    return `moving-average-${this.window}`
  }

  get minDataPoints() {
    return this.window
  }

  train(points) {
    const n = points.length
    if (n < this.window) {
      return this._lrFallback.train(points)
    }

    const values = points.map(p => p.y)
    const maValues = []
    for (let i = this.window - 1; i < n; i++) {
      let sum = 0
      for (let j = i - this.window + 1; j <= i; j++) {
        sum += values[j]
      }
      maValues.push(sum / this.window)
    }

    const lrModel = this._lrFallback.train(points)
    const lastMa = maValues[maValues.length - 1]
    const currentAvg = values.reduce((a, b) => a + b, 0) / n

    return {
      strategy: this.name,
      maValues,
      window: this.window,
      slope: lrModel.slope,
      lastMa,
      lastIdx: n - 1,
      currentAvg,
      dataPoints: n
    }
  }

  predict(model, days) {
    if (model.strategy === 'linear-regression') {
      return this._lrFallback.predict(model, days)
    }

    const { slope, lastMa, lastIdx } = model
    const predictions = []
    for (let d = 1; d <= days; d++) {
      predictions.push({
        dayOffset: d,
        value: lastMa + slope * d
      })
    }
    return {
      strategy: this.name,
      predictions,
      slope,
      trendDirection: slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable'
    }
  }
}
