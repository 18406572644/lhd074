import dayjs from 'dayjs'

export async function generateMonthlyReport(store) {
  const end = dayjs().format('YYYY-MM-DD')
  const start = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
  const records = store.getRecordsByRange(start, end)

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

  const avgSleep = (totalSleep / records.length).toFixed(1)
  const avgDeep = Math.round(totalDeep / records.length)
  const avgLight = Math.round(totalLight / records.length)
  const avgCaffeine = Math.round(totalCaffeine / records.length)
  const avgScreen = Math.round(totalScreen / records.length)
  const avgNap = Math.round(totalNap / records.length)

  const goodDays = scores.filter(s => s >= 80).length
  const warnDays = scores.filter(s => s >= 60 && s < 80).length
  const badDays = scores.filter(s => s < 60).length

  const advices = generateAdvices(avgScore, avgSleep, avgCaffeine, avgScreen, store.goals)

  return {
    period: `${start} ~ ${end}`,
    totalDays: records.length,
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
    records,
    scores,
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
