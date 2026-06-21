import dayjs from 'dayjs'

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

function linearRegression(points) {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: 0 }
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  for (let i = 0; i < n; i++) {
    sumX += points[i].x
    sumY += points[i].y
    sumXY += points[i].x * points[i].y
    sumXX += points[i].x * points[i].x
  }
  const denom = n * sumXX - sumX * sumX
  if (Math.abs(denom) < 1e-10) return { slope: 0, intercept: sumY / n }
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

function movingAverage(values, window) {
  if (values.length < window) return values.length > 0 ? [values.reduce((a, b) => a + b, 0) / values.length] : []
  const result = []
  for (let i = window - 1; i < values.length; i++) {
    let sum = 0
    for (let j = i - window + 1; j <= i; j++) sum += values[j]
    result.push(sum / window)
  }
  return result
}

export function predictBedtime(records, targetDayOffset = 7) {
  if (records.length < 3) return null

  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const points = sorted.map((r, i) => ({
    x: i,
    y: timeToMinutes(r.bedtime),
    date: r.date
  }))

  const recent = points.slice(-Math.min(30, points.length))
  const ma3 = movingAverage(recent.map(p => p.y), Math.min(3, recent.length))

  const { slope, intercept } = linearRegression(recent)
  const lastIdx = recent.length - 1
  const predictedMinutes = slope * (lastIdx + targetDayOffset) + intercept

  const maPredicted = ma3.length > 0
    ? ma3[ma3.length - 1] + slope * targetDayOffset
    : predictedMinutes

  const blended = predictedMinutes * 0.6 + maPredicted * 0.4

  const currentAvg = recent.reduce((s, p) => s + p.y, 0) / recent.length
  const trendMinutes = blended - currentAvg

  return {
    predictedTime: minutesToTime(Math.round(blended)),
    trendMinutes: Math.round(trendMinutes),
    trendDirection: trendMinutes > 15 ? 'later' : trendMinutes < -15 ? 'earlier' : 'stable',
    currentAvgTime: minutesToTime(Math.round(currentAvg)),
    slope: slope
  }
}

export function predictScore(records, calcSleepScore, targetDayOffset = 7) {
  if (records.length < 3) return null

  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const points = sorted.map((r, i) => ({
    x: i,
    y: calcSleepScore(r)
  }))

  const recent = points.slice(-Math.min(30, points.length))
  const { slope, intercept } = linearRegression(recent)
  const lastIdx = recent.length - 1
  const predicted = slope * (lastIdx + targetDayOffset) + intercept

  const ma3 = movingAverage(recent.map(p => p.y), Math.min(3, recent.length))
  const maPredicted = ma3.length > 0
    ? ma3[ma3.length - 1] + slope * targetDayOffset
    : predicted

  const blended = predicted * 0.6 + maPredicted * 0.4
  const clamped = Math.round(Math.min(100, Math.max(0, blended)))

  const currentAvg = recent.reduce((s, p) => s + p.y, 0) / recent.length

  return {
    predictedScore: clamped,
    trendDirection: slope < -1 ? 'declining' : slope > 1 ? 'improving' : 'stable',
    currentAvgScore: Math.round(currentAvg),
    slope: slope
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

export function generatePredictionInsights(records, calcSleepScore, goals) {
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

  const bedtimePrediction = predictBedtime(records)
  const scorePrediction = predictScore(records, calcSleepScore)
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

export function getNoonReminderText(records) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const recent3 = sorted.slice(-3)
  if (recent3.length < 3) return '今晚建议提前 30 分钟入睡'

  const avgBedtime = recent3.reduce((s, r) => s + timeToMinutes(r.bedtime), 0) / recent3.length
  const suggested = Math.round(avgBedtime - 30)
  return `检测到连续晚睡趋势，今晚建议 ${minutesToTime(suggested)} 前入睡`
}
