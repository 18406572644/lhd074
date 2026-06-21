import dayjs from 'dayjs'
import { PredictorFactory } from './predictors'
import { LinearRegressionPredictor } from './predictors/LinearRegressionPredictor'
import { MovingAveragePredictor } from './predictors/MovingAveragePredictor'
import { HoltWintersPredictor } from './predictors/HoltWintersPredictor'
import { SleepScorer } from './scorers/SleepScorer'

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  let total = h * 60 + m
  if (total < 12 * 60) total += 24 * 60
  return total
}

function minutesToTime(minutes) {
  let m = minutes % (24 * 60)
  if (m < 0) m += 24 * 60
  const h = Math.floor(m / 60) % 24
  const min = Math.round(m % 60)
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

function toPoints(records, extractY) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((r, i) => ({
    x: i,
    y: extractY(r),
    date: r.date
  }))
}

function blendedPredict(points, targetDayOffset, config = {}) {
  const recentMax = config.recentMax || 30
  const lrWeight = config.lrWeight ?? 0.6
  const maWeight = config.maWeight ?? 0.4
  const maWindow = config.maWindow || 3
  const strategy = config.strategy || 'auto'

  const recent = points.slice(-Math.min(recentMax, points.length))
  if (recent.length < 2) return null

  let lrPredictor, maPredictor, hwPredictor

  if (strategy === 'auto') {
    lrPredictor = new LinearRegressionPredictor()
    maPredictor = new MovingAveragePredictor(maWindow)
    hwPredictor = recent.length >= 14 ? new HoltWintersPredictor() : null
  } else if (strategy === 'linear-regression') {
    lrPredictor = new LinearRegressionPredictor()
  } else if (strategy === 'moving-average') {
    maPredictor = new MovingAveragePredictor(maWindow)
  } else if (strategy === 'holt-winters') {
    hwPredictor = new HoltWintersPredictor()
  } else if (strategy === 'blended') {
    lrPredictor = new LinearRegressionPredictor()
    maPredictor = new MovingAveragePredictor(maWindow)
    hwPredictor = recent.length >= 14 ? new HoltWintersPredictor() : null
  }

  if (hwPredictor && recent.length >= 14) {
    const hwModel = hwPredictor.train(recent)
    const hwResult = hwPredictor.predict(hwModel, targetDayOffset)
    const lrModel = lrPredictor ? lrPredictor.train(recent) : new LinearRegressionPredictor().train(recent)
    const maModel = maPredictor ? maPredictor.train(recent) : new MovingAveragePredictor(maWindow).train(recent)

    const hwPred = hwResult.predictions[0]?.value ?? 0
    const lrResult = lrPredictor
      ? lrPredictor.predict(lrModel, targetDayOffset)
      : new LinearRegressionPredictor().predict(lrModel, targetDayOffset)
    const maResult = maPredictor
      ? maPredictor.predict(maModel, targetDayOffset)
      : new MovingAveragePredictor(maWindow).predict(maModel, targetDayOffset)

    const lrPred = lrResult.predictions[0]?.value ?? 0
    const maPred = maResult.predictions[0]?.value ?? 0

    const blended = hwPred * 0.4 + lrPred * (lrWeight * 0.6) + maPred * (maWeight * 0.6)
    const slope = lrModel.slope

    return { predictedValue: blended, slope, currentAvg: lrModel.currentAvg, strategy: 'holt-winters-blended' }
  }

  if (lrPredictor && maPredictor) {
    const lrModel = lrPredictor.train(recent)
    const lrResult = lrPredictor.predict(lrModel, targetDayOffset)
    const maModel = maPredictor.train(recent)
    const maResult = maPredictor.predict(maModel, targetDayOffset)

    const lrPred = lrResult.predictions[0]?.value ?? 0
    const maPred = maResult.predictions[0]?.value ?? 0

    const blended = lrPred * lrWeight + maPred * maWeight
    const slope = lrModel.slope

    return { predictedValue: blended, slope, currentAvg: lrModel.currentAvg, strategy: 'lr-ma-blended' }
  }

  if (lrPredictor) {
    const lrModel = lrPredictor.train(recent)
    const lrResult = lrPredictor.predict(lrModel, targetDayOffset)
    const lrPred = lrResult.predictions[0]?.value ?? 0

    return { predictedValue: lrPred, slope: lrModel.slope, currentAvg: lrModel.currentAvg, strategy: 'linear-regression' }
  }

  if (maPredictor) {
    const maModel = maPredictor.train(recent)
    const maResult = maPredictor.predict(maModel, targetDayOffset)
    const maPred = maResult.predictions[0]?.value ?? 0

    return { predictedValue: maPred, slope: maModel.slope, currentAvg: maModel.currentAvg, strategy: 'moving-average' }
  }

  return null
}

export function predictBedtime(records, targetDayOffset = 7, config = {}) {
  if (records.length < 3) return null

  const points = toPoints(records, r => timeToMinutes(r.bedtime))
  const result = blendedPredict(points, targetDayOffset, config)
  if (!result) return null

  const trendMinutes = Math.round(result.predictedValue - result.currentAvg)

  return {
    predictedTime: minutesToTime(Math.round(result.predictedValue)),
    trendMinutes,
    trendDirection: trendMinutes > 15 ? 'later' : trendMinutes < -15 ? 'earlier' : 'stable',
    currentAvgTime: minutesToTime(Math.round(result.currentAvg)),
    slope: result.slope
  }
}

export function predictScore(records, calcSleepScore, targetDayOffset = 7, config = {}) {
  if (records.length < 3) return null

  const scoreFn = typeof calcSleepScore === 'function'
    ? calcSleepScore
    : (r) => calcSleepScore.score(r)

  const points = toPoints(records, scoreFn)
  const result = blendedPredict(points, targetDayOffset, config)
  if (!result) return null

  const clamped = Math.round(Math.min(100, Math.max(0, result.predictedValue)))
  const slope = result.slope

  return {
    predictedScore: clamped,
    trendDirection: slope < -1 ? 'declining' : slope > 1 ? 'improving' : 'stable',
    currentAvgScore: Math.round(result.currentAvg),
    slope
  }
}

export function detectWeeklyPatterns(records) {
  if (records.length < 7) return []

  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const byWeekday = [[], [], [], [], [], [], []]
  sorted.forEach(r => {
    const day = dayjs(r.date).day()
    byWeekday[day].push(timeToMinutes(r.bedtime))
  })

  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const overallAvg = sorted.reduce((s, r) => s + timeToMinutes(r.bedtime), 0) / sorted.length

  const patterns = []
  byWeekday.forEach((times, dayIdx) => {
    if (times.length < 2) return
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const diff = avg - overallAvg
    if (Math.abs(diff) >= 30) {
      patterns.push({
        weekday: dayIdx,
        weekdayName: weekdayNames[dayIdx],
        avgBedtime: minutesToTime(Math.round(avg)),
        diffMinutes: Math.round(diff),
        direction: diff > 0 ? '晚' : '早',
        sampleCount: times.length
      })
    }
  })

  return patterns.sort((a, b) => Math.abs(b.diffMinutes) - Math.abs(a.diffMinutes))
}

export function detectConsecutiveLateShift(records, threshold = 3) {
  if (records.length < threshold) return { detected: false, count: 0 }

  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-Math.min(14, sorted.length))

  let consecutiveCount = 0
  for (let i = 1; i < recent.length; i++) {
    const prevBedtime = timeToMinutes(recent[i - 1].bedtime)
    const currBedtime = timeToMinutes(recent[i].bedtime)
    if (currBedtime > prevBedtime + 10) {
      consecutiveCount++
    } else {
      consecutiveCount = 0
    }
  }

  return {
    detected: consecutiveCount >= threshold,
    count: consecutiveCount
  }
}

export function generatePredictionInsights(records, calcSleepScore, goals, predictionConfig = {}) {
  const insights = []
  const hasEnoughData = records.length >= 5

  if (!hasEnoughData) {
    insights.push({
      type: 'info',
      icon: 'InfoFilled',
      title: '数据积累中',
      text: `已录入 ${records.length} 天数据，累计5天后将开启趋势预测与智能建议。`
    })
    return { insights, bedtimePrediction: null, scorePrediction: null, weeklyPatterns: [], lateShift: { detected: false, count: 0 } }
  }

  const bedtimePrediction = predictBedtime(records, 7, predictionConfig)
  const scorePrediction = predictScore(records, calcSleepScore, 7, predictionConfig)
  const weeklyPatterns = detectWeeklyPatterns(records)
  const lateShift = detectConsecutiveLateShift(records)

  if (bedtimePrediction && bedtimePrediction.trendDirection !== 'stable') {
    const direction = bedtimePrediction.trendDirection === 'later' ? '推迟' : '提前'
    const dayLabel = getTargetDayLabel()
    insights.push({
      type: bedtimePrediction.trendDirection === 'later' ? 'warn' : 'good',
      icon: bedtimePrediction.trendDirection === 'later' ? 'WarningFilled' : 'CircleCheckFilled',
      title: '入睡趋势预测',
      text: `如果本周继续当前作息节奏，预计${dayLabel}入睡时间将${direction}到 ${bedtimePrediction.predictedTime}`,
      subText: scorePrediction && scorePrediction.trendDirection === 'declining'
        ? `，评分降至 ${scorePrediction.predictedScore} 分`
        : ''
    })
  }

  if (scorePrediction && scorePrediction.trendDirection === 'declining') {
    const bedtimeAlreadyWarned = bedtimePrediction && bedtimePrediction.trendDirection === 'later'
    if (!bedtimeAlreadyWarned) {
      insights.push({
        type: 'warn',
        icon: 'TrendCharts',
        title: '评分走低预警',
        text: `按当前趋势，本周睡眠评分将降至 ${scorePrediction.predictedScore} 分（当前均值 ${scorePrediction.currentAvgScore} 分），建议调整作息。`
      })
    }
  }

  if (weeklyPatterns.length > 0) {
    const top = weeklyPatterns[0]
    const absDiff = Math.abs(top.diffMinutes)
    const diffLabel = absDiff >= 60
      ? `${Math.floor(absDiff / 60)} 小时 ${absDiff % 60 > 0 ? (absDiff % 60) + ' 分钟' : ''}`
      : `${absDiff} 分钟`
    insights.push({
      type: absDiff >= 90 ? 'warn' : 'info',
      icon: 'Calendar',
      title: '周期规律识别',
      text: `检测到你${top.weekdayName}平均${top.direction} ${diffLabel}入睡，`,
      subText: top.diffMinutes > 60
        ? `建议${top.weekdayName}最晚不超过 ${minutesToTime(Math.round(timeToMinutes(goals.targetBedtime) + 30))} 以减少社交时差`
        : '注意保持规律作息'
    })
  }

  if (lateShift.detected) {
    insights.push({
      type: 'warn',
      icon: 'Bell',
      title: '连续后移提醒',
      text: `已连续 ${lateShift.count} 天入睡时间后移，今晚建议提前 30 分钟入睡，避免作息持续恶化。`,
      actionable: true
    })
  }

  if (insights.length === 0) {
    insights.push({
      type: 'good',
      icon: 'CircleCheckFilled',
      title: '作息节律稳定',
      text: '当前作息趋势平稳，继续保持良好节律！'
    })
  }

  return { insights, bedtimePrediction, scorePrediction, weeklyPatterns, lateShift }
}

function getTargetDayLabel() {
  const today = dayjs().day()
  const daysToSunday = today === 0 ? 7 : 7 - today
  if (daysToSunday <= 1) return '明天'
  if (daysToSunday <= 3) return '本周日'
  return '本周日'
}

export function shouldShowNoonReminder(records) {
  const lateShift = detectConsecutiveLateShift(records)
  if (!lateShift.detected) return false

  const now = dayjs()
  const hour = now.hour()
  if (hour < 11 || hour > 14) return false

  const lastReminderDate = localStorage.getItem('ct_noon_reminder_date')
  const today = now.format('YYYY-MM-DD')
  if (lastReminderDate === today) return false

  localStorage.setItem('ct_noon_reminder_date', today)
  return true
}

<<<<<<< HEAD
function percentile(sorted, p) {
  if (sorted.length === 0) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function calcSleepDuration(record) {
  const bedtime = dayjs(`${record.date} ${record.bedtime}`)
  const wakeTime = dayjs(`${record.date} ${record.wakeTime}`)
  let hours = wakeTime.diff(bedtime, 'minute') / 60
  if (hours < 0) hours += 24
  return hours
}

export function calcSmartRecommendation(records) {
  if (records.length < 7) {
    return {
      available: false,
      reason: `数据不足（需至少7天，当前${records.length}天）`,
      p50: null,
      p75: null
    }
  }

  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-30)

  const bedtimeMinutes = recent.map(r => timeToMinutes(r.bedtime)).sort((a, b) => a - b)
  const wakeTimeMinutes = recent.map(r => {
    const [h, m] = r.wakeTime.split(':').map(Number)
    return h * 60 + m
  }).sort((a, b) => a - b)
  const sleepDurations = recent.map(r => calcSleepDuration(r)).sort((a, b) => a - b)

  const bedtimeP50 = percentile(bedtimeMinutes, 50)
  const bedtimeP75 = percentile(bedtimeMinutes, 75)
  const wakeP50 = percentile(wakeTimeMinutes, 50)
  const wakeP75 = percentile(wakeTimeMinutes, 75)
  const sleepP50 = percentile(sleepDurations, 50)
  const sleepP75 = percentile(sleepDurations, 75)

  const recommendedBedtime = minutesToTime(Math.round(bedtimeP50))
  const ambitiousBedtime = minutesToTime(Math.round(bedtimeP75))
  const recommendedWakeTime = minutesToTime(Math.round(wakeP50))
  const recommendedSleepHours = Math.round(sleepP50 * 10) / 10
  const ambitiousSleepHours = Math.round(sleepP75 * 10) / 10

  return {
    available: true,
    reason: null,
    p50: {
      targetBedtime: recommendedBedtime,
      targetWakeTime: recommendedWakeTime,
      targetSleepHours: recommendedSleepHours
    },
    p75: {
      targetBedtime: ambitiousBedtime,
      targetWakeTime: minutesToTime(Math.round(wakeP75)),
      targetSleepHours: ambitiousSleepHours
    },
    stats: {
      sampleDays: recent.length,
      bedtimeP50: minutesToTime(Math.round(bedtimeP50)),
      bedtimeP75: minutesToTime(Math.round(bedtimeP75)),
      sleepP50: recommendedSleepHours,
      sleepP75: ambitiousSleepHours,
      bedtimeStd: Math.round(Math.sqrt(bedtimeMinutes.reduce((s, v) => s + (v - bedtimeP50) ** 2, 0) / bedtimeMinutes.length)),
      sleepStd: Math.round(Math.sqrt(sleepDurations.reduce((s, v) => s + (v - sleepP50) ** 2, 0) / sleepDurations.length) * 10) / 10
    }
  }
}

export function calcAchievementPredictionCurve(records, calcSleepScore, goals) {
  if (records.length < 7) return null

  const scoreFn = typeof calcSleepScore === 'function'
    ? calcSleepScore
    : (r) => calcSleepScore.score(r)

  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-30)

  const dailyAchievement = recent.map(r => {
    const bedtime = dayjs(`${r.date} ${r.bedtime}`)
    const targetBedtime = dayjs(`${r.date} ${goals.targetBedtime}`)
    const bedDiff = Math.abs(bedtime.diff(targetBedtime, 'minute'))

    const wakeTime = dayjs(`${r.date} ${r.wakeTime}`)
    const targetWake = dayjs(`${r.date} ${goals.targetWakeTime}`)
    const wakeDiff = Math.abs(wakeTime.diff(targetWake, 'minute'))

    let sleepH = wakeTime.diff(bedtime, 'minute') / 60
    if (sleepH < 0) sleepH += 24
    const sleepRatio = Math.min(1, sleepH / goals.targetSleepHours)

    const deepRatio = r.deepSleep / (sleepH * 60 || 1)
    const deepRatioAch = Math.min(1, deepRatio / goals.targetDeepRatio)

    const bedAch = Math.max(0, 1 - bedDiff / 120)
    const wakeAch = Math.max(0, 1 - wakeDiff / 120)

    const totalAch = (bedAch * 0.3 + wakeAch * 0.2 + sleepRatio * 0.3 + deepRatioAch * 0.2) * 100
    return {
      date: r.date,
      achievement: Math.round(totalAch),
      score: scoreFn(r)
    }
  })

  const points = dailyAchievement.map((d, i) => ({ x: i, y: d.achievement }))
  const predictor = PredictorFactory.autoSelect(points.length)
  const model = predictor.train(points)
  const result = predictor.predict(model, 7)

  const predictions = result.predictions.map(p => ({
    dayOffset: p.dayOffset,
    achievement: Math.round(Math.min(100, Math.max(0, p.value)))
  }))

  const recent7 = dailyAchievement.slice(-7)
  const avg7 = recent7.length > 0 ? Math.round(recent7.reduce((s, d) => s + d.achievement, 0) / recent7.length) : 0
  const recent3 = dailyAchievement.slice(-3)
  const avg3 = recent3.length > 0 ? Math.round(recent3.reduce((s, d) => s + d.achievement, 0) / recent3.length) : 0

  const slope = model.slope ?? model.trend ?? 0

  return {
    history: dailyAchievement,
    predictions,
    trendSlope: Math.round(slope * 100) / 100,
    avg7,
    avg3,
    trendDirection: slope > 1 ? 'improving' : slope < -1 ? 'declining' : 'stable'
  }
}

=======
>>>>>>> parent of aee01ed (智能目标动态推荐)
export function getNoonReminderText(records) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const recent3 = sorted.slice(-3)
  if (recent3.length < 3) return '今晚建议提前 30 分钟入睡'

  const avgBedtime = recent3.reduce((s, r) => s + timeToMinutes(r.bedtime), 0) / recent3.length
  const suggested = Math.round(avgBedtime - 30)
  return `检测到连续晚睡趋势，今晚建议 ${minutesToTime(suggested)} 前入睡`
}

export { PredictorFactory, LinearRegressionPredictor, MovingAveragePredictor, HoltWintersPredictor, SleepScorer }
