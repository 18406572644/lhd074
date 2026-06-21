import dayjs from 'dayjs'
import { ScorerBase } from './ScorerBase'

const DEFAULT_WEIGHTS = {
  duration: 0.30,
  bedtime: 0.20,
  deepSleep: 0.20,
  caffeine: 0.15,
  screen: 0.15
}

const DEFAULT_GOALS = {
  targetSleepHours: 8,
  targetBedtime: '23:00',
  targetDeepRatio: 0.25,
  maxCaffeineMg: 200,
  maxScreenMin: 480
}

export class SleepScorer extends ScorerBase {
  constructor(weights = {}, goals = {}) {
    super()
    this._weights = { ...DEFAULT_WEIGHTS, ...weights }
    this._goals = { ...DEFAULT_GOALS, ...goals }
  }

  get name() {
    return 'sleep-scorer'
  }

  setWeights(weights) {
    this._weights = { ...this._weights, ...weights }
  }

  getWeights() {
    return { ...this._weights }
  }

  setGoals(goals) {
    this._goals = { ...this._goals, ...goals }
  }

  getGoals() {
    return { ...this._goals }
  }

  score(record) {
    if (!record) return 0
    const w = this._weights
    const g = this._goals

    const bedtime = dayjs(`${record.date} ${record.bedtime}`)
    const wakeTime = dayjs(`${record.date} ${record.wakeTime}`)
    let sleepHours = wakeTime.diff(bedtime, 'minute') / 60
    if (sleepHours < 0) sleepHours += 24

    const durationScore = Math.max(0, 30 - Math.abs(sleepHours - g.targetSleepHours) * 6)

    const targetBedtime = dayjs(`${record.date} ${g.targetBedtime}`)
    const bedtimeDiff = Math.abs(bedtime.diff(targetBedtime, 'minute'))
    const bedtimeScore = Math.max(0, 20 - bedtimeDiff * 0.2)

    const deepRatio = record.deepSleep / (sleepHours * 60 || 1)
    const deepScore = Math.max(0, 20 - Math.abs(deepRatio - g.targetDeepRatio) * 80)

    const caffeinePenalty = Math.min(10, (record.caffeineMg || 0) / g.maxCaffeineMg * 10)
    const caffeineScore = 15 - caffeinePenalty

    const screenPenalty = Math.min(10, (record.screenMin || 0) / g.maxScreenMin * 10)
    const screenScore = 15 - screenPenalty

    const rawScore =
      durationScore * (w.duration / 0.30) +
      bedtimeScore * (w.bedtime / 0.20) +
      deepScore * (w.deepSleep / 0.20) +
      caffeineScore * (w.caffeine / 0.15) +
      screenScore * (w.screen / 0.15)

    const weightSum = Object.values(w).reduce((a, b) => a + b, 0)
    const normalized = weightSum > 0 ? rawScore / weightSum * weightSum : rawScore

    return Math.round(Math.min(100, Math.max(0, normalized)))
  }

  scoreDimension(record, dimension) {
    if (!record) return 0
    const g = this._goals

    const bedtime = dayjs(`${record.date} ${record.bedtime}`)
    const wakeTime = dayjs(`${record.date} ${record.wakeTime}`)
    let sleepHours = wakeTime.diff(bedtime, 'minute') / 60
    if (sleepHours < 0) sleepHours += 24

    switch (dimension) {
      case 'duration':
        return Math.max(0, 30 - Math.abs(sleepHours - g.targetSleepHours) * 6)
      case 'bedtime': {
        const targetBedtime = dayjs(`${record.date} ${g.targetBedtime}`)
        const bedtimeDiff = Math.abs(bedtime.diff(targetBedtime, 'minute'))
        return Math.max(0, 20 - bedtimeDiff * 0.2)
      }
      case 'deepSleep': {
        const deepRatio = record.deepSleep / (sleepHours * 60 || 1)
        return Math.max(0, 20 - Math.abs(deepRatio - g.targetDeepRatio) * 80)
      }
      case 'caffeine': {
        const caffeinePenalty = Math.min(10, (record.caffeineMg || 0) / g.maxCaffeineMg * 10)
        return 15 - caffeinePenalty
      }
      case 'screen': {
        const screenPenalty = Math.min(10, (record.screenMin || 0) / g.maxScreenMin * 10)
        return 15 - screenPenalty
      }
      default:
        return 0
    }
  }
}
