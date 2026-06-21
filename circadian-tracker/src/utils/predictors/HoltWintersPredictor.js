import { PredictorBase } from './PredictorBase'
import { LinearRegressionPredictor } from './LinearRegressionPredictor'

export class HoltWintersPredictor extends PredictorBase {
  constructor(alpha = 0.3, beta = 0.1) {
    super()
    this.alpha = alpha
    this.beta = beta
    this._lrFallback = new LinearRegressionPredictor()
  }

  get name() {
    return `holt-winters-a${this.alpha}-b${this.beta}`
  }

  get minDataPoints() {
    return 3
  }

  train(points) {
    const n = points.length
    if (n < this.minDataPoints) {
      return this._lrFallback.train(points)
    }

    const values = points.map(p => p.y)

    let level = values[0]
    let trend = n >= 2 ? values[1] - values[0] : 0

    const levels = [level]
    const trends = [trend]

    for (let i = 1; i < n; i++) {
      const newLevel = this.alpha * values[i] + (1 - this.alpha) * (level + trend)
      const newTrend = this.beta * (newLevel - level) + (1 - this.beta) * trend
      level = newLevel
      trend = newTrend
      levels.push(level)
      trends.push(trend)
    }

    const currentAvg = values.reduce((a, b) => a + b, 0) / n

    return {
      strategy: this.name,
      level,
      trend,
      levels,
      trends,
      lastIdx: n - 1,
      currentAvg,
      dataPoints: n,
      alpha: this.alpha,
      beta: this.beta
    }
  }

  predict(model, days) {
    if (model.strategy === 'linear-regression') {
      return this._lrFallback.predict(model, days)
    }

    const { level, trend } = model
    const predictions = []
    for (let d = 1; d <= days; d++) {
      predictions.push({
        dayOffset: d,
        value: level + trend * d
      })
    }
    return {
      strategy: this.name,
      predictions,
      slope: trend,
      trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'
    }
  }
}
