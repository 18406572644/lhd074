export class PredictorBase {
  get name() {
    throw new Error('PredictorBase.name must be overridden')
  }

  get minDataPoints() {
    return 2
  }

  train(points) {
    throw new Error('PredictorBase.train() must be overridden')
  }

  predict(model, days) {
    throw new Error('PredictorBase.predict() must be overridden')
  }

  canHandle(dataLength) {
    return dataLength >= this.minDataPoints
  }
}
