import dayjs from 'dayjs'

export const PERIOD_OPTIONS = [
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
  { value: 'month', label: '自然月' },
  { value: 'custom', label: '自定义范围' }
]

export function getDateRange(period, customStart, customEnd) {
  const now = dayjs()
  switch (period) {
    case '7d':
      return {
        start: now.subtract(6, 'day').format('YYYY-MM-DD'),
        end: now.format('YYYY-MM-DD')
      }
    case '30d':
      return {
        start: now.subtract(29, 'day').format('YYYY-MM-DD'),
        end: now.format('YYYY-MM-DD')
      }
    case 'month':
      return {
        start: now.startOf('month').format('YYYY-MM-DD'),
        end: now.endOf('month').format('YYYY-MM-DD')
      }
    case 'custom':
      return {
        start: customStart || now.subtract(29, 'day').format('YYYY-MM-DD'),
        end: customEnd || now.format('YYYY-MM-DD')
      }
    default:
      return {
        start: now.subtract(29, 'day').format('YYYY-MM-DD'),
        end: now.format('YYYY-MM-DD')
      }
  }
}

function getPrevDateRange(start, end) {
  const startD = dayjs(start)
  const endD = dayjs(end)
  const days = endD.diff(startD, 'day') + 1
  const prevEnd = startD.subtract(1, 'day')
  const prevStart = prevEnd.subtract(days - 1, 'day')
  return {
    start: prevStart.format('YYYY-MM-DD'),
    end: prevEnd.format('YYYY-MM-DD')
  }
}

function calcSummary(records, store) {
  if (records.length === 0) return null

  const scores = records.map(r => store.calcSleepScore(r))
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

  let totalSleep = 0
  let totalDeep = 0
  let totalLight = 0
  let totalCaffeine = 0
  let totalScreen = 0
  let totalNap = 0

  records.forEach(r => {
    const bedtime = dayjs(`${r.date} ${r.bedtime}`)
    const wakeTime = dayjs(`${r.date} ${r.wakeTime}`)
    let h = wakeTime.diff(bedtime, 'minute') / 60
    if (h < 0) h += 24
    totalSleep += h
    totalDeep += r.deepSleep || 0
    totalLight += r.lightSleep || 0
    totalCaffeine += r.caffeineMg || 0
    totalScreen += r.screenMin || 0
    totalNap += r.napMin || 0
  })

  const avgSleep = parseFloat((totalSleep / records.length).toFixed(1))
  const avgDeep = Math.round(totalDeep / records.length)
  const avgLight = Math.round(totalLight / records.length)
  const avgCaffeine = Math.round(totalCaffeine / records.length)
  const avgScreen = Math.round(totalScreen / records.length)
  const avgNap = Math.round(totalNap / records.length)

  const goodDays = scores.filter(s => s >= 80).length
  const warnDays = scores.filter(s => s >= 60 && s < 80).length
  const badDays = scores.filter(s => s < 60).length

  return {
    avgScore,
    avgSleep,
    avgDeep,
    avgLight,
    avgCaffeine,
    avgScreen,
    avgNap,
    goodDays,
    warnDays,
    badDays,
    scores
  }
}

function calcComparison(curr, prev) {
  if (!curr || !prev) return null

  const pct = (cur, pre) => {
    if (pre === 0) return cur === 0 ? 0 : 100
    return Math.round(((cur - pre) / pre) * 100)
  }

  return {
    avgScore: pct(curr.avgScore, prev.avgScore),
    avgSleep: pct(curr.avgSleep, prev.avgSleep),
    avgDeep: pct(curr.avgDeep, prev.avgDeep),
    avgCaffeine: pct(curr.avgCaffeine, prev.avgCaffeine),
    avgScreen: pct(curr.avgScreen, prev.avgScreen),
    goodDays: pct(curr.goodDays, prev.goodDays),
    badDays: pct(curr.badDays, prev.badDays),
    prevTotalDays: prev.records ? prev.records.length : 0,
    currTotalDays: curr.records ? curr.records.length : 0
  }
}

export async function generateReport(store, period = '30d', customStart, customEnd) {
  const { start, end } = getDateRange(period, customStart, customEnd)
  const records = store.getRecordsByRange(start, end).sort((a, b) => a.date.localeCompare(b.date))

  if (records.length === 0) return null

  const currentSummary = calcSummary(records, store)
  const scores = currentSummary.scores

  const recordsWithScores = records.map((r, i) => ({
    ...r,
    score: scores[i]
  }))

  const bestDays = [...recordsWithScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const worstDays = [...recordsWithScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)

  const prevRange = getPrevDateRange(start, end)
  const prevRecords = store.getRecordsByRange(prevRange.start, prevRange.end)
  const prevSummary = prevRecords.length > 0 ? calcSummary(prevRecords, store) : null

  const comparison = calcComparison(
    { ...currentSummary, records },
    prevSummary ? { ...prevSummary, records: prevRecords } : null
  )

  const scoreDistribution = {
    excellent: scores.filter(s => s >= 90).length,
    good: scores.filter(s => s >= 80 && s < 90).length,
    normal: scores.filter(s => s >= 60 && s < 80).length,
    poor: scores.filter(s => s >= 40 && s < 60).length,
    bad: scores.filter(s => s < 40).length
  }

  const advices = generateAdvices(
    currentSummary.avgScore,
    currentSummary.avgSleep,
    currentSummary.avgCaffeine,
    currentSummary.avgScreen,
    store.goals
  )

  return {
    period: `${start} ~ ${end}`,
    periodType: period,
    start,
    end,
    totalDays: records.length,
    avgScore: currentSummary.avgScore,
    avgSleep: currentSummary.avgSleep,
    avgDeep: currentSummary.avgDeep,
    avgLight: currentSummary.avgLight,
    avgCaffeine: currentSummary.avgCaffeine,
    avgScreen: currentSummary.avgScreen,
    avgNap: currentSummary.avgNap,
    goodDays: currentSummary.goodDays,
    warnDays: currentSummary.warnDays,
    badDays: currentSummary.badDays,
    records,
    scores,
    bestDays,
    worstDays,
    scoreDistribution,
    comparison,
    advices,
    goals: store.goals
  }
}

function generateAdvices(avgScore, avgSleep, avgCaffeine, avgScreen, goals) {
  const advices = []
  if (avgScore >= 80) {
    advices.push('整体睡眠质量优秀，请继续保持当前作息习惯。')
  } else if (avgScore >= 60) {
    advices.push('睡眠质量尚可，建议进一步优化入睡时间和睡眠环境。')
  } else {
    advices.push('睡眠质量欠佳，强烈建议调整作息并关注睡眠健康。')
  }
  if (parseFloat(avgSleep) < 6) {
    advices.push('平均睡眠时长不足6小时，建议目标7-9小时，逐步调整。')
  }
  if (parseFloat(avgSleep) > 9.5) {
    advices.push('平均睡眠时间偏长，可能影响睡眠效率，建议控制在7-9小时。')
  }
  if (avgCaffeine > goals.maxCaffeineMg) {
    advices.push(`咖啡因平均摄入(${avgCaffeine}mg)超出目标上限(${goals.maxCaffeineMg}mg)，建议减少。`)
  }
  if (avgScreen > goals.maxScreenMin) {
    advices.push(`日均用眼(${avgScreen}min)超出上限(${goals.maxScreenMin}min)，建议增加休息频次。`)
  }
  return advices
}

export async function generateMonthlyReport(store) {
  return generateReport(store, '30d')
}
