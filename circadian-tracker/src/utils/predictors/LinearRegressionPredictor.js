import { PredictorBase } from './PredictorBase'

export class LinearRegressionPredictor extends PredictorBase {
  get name() {
    return 'linear-regression'
  }

  get minDataPoints() {
    return 2
  }

  train(points) {
    const n = points.length
    if (n < 2) {
      const yMean = n === 1 ? points[0].y : 0
      return {
        strategy: this.name,
        slope: 0,
        intercept: yMean,
        lastIdx: n - 1,
        currentAvg: yMean,
        dataPoints: n
      }
    }

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
    for (let i = 0; i < n; i++) {
      sumX += points[i].x
      sumY += points[i].y
      sumXY += points[i].x * points[i].y
      sumXX += points[i].x * points[i].x
    }

    const denom = n * sumXX - sumX * sumX
    const slope = Math.abs(denom) < 1e-10
      ? 0
      : (n * sumXY - sumX * sumY) / denom
    const intercept = (sumY - slope * sumX) / n
    const currentAvg = sumY / n

    return {
      strategy: this.name,
      slope,
      intercept,
      lastIdx: n - 1,
      currentAvg,
      dataPoints: n
    }
  }

  predict(model, days) {
    const { slope, intercept, lastIdx } = model
    const predictions = []
    for (let d = 1; d <= days; d++) {
      const futureIdx = lastIdx + d
      predictions.push({
        dayOffset: d,
        value: slope * futureIdx + intercept
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
