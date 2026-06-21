import dayjs from 'dayjs'

const TIMEZONE_DB = {
  '北京': { tz: 'Asia/Shanghai', utc: 8 },
  '上海': { tz: 'Asia/Shanghai', utc: 8 },
  '广州': { tz: 'Asia/Shanghai', utc: 8 },
  '深圳': { tz: 'Asia/Shanghai', utc: 8 },
  '成都': { tz: 'Asia/Shanghai', utc: 8 },
  '杭州': { tz: 'Asia/Shanghai', utc: 8 },
  '重庆': { tz: 'Asia/Chongqing', utc: 8 },
  '武汉': { tz: 'Asia/Shanghai', utc: 8 },
  '南京': { tz: 'Asia/Shanghai', utc: 8 },
  '西安': { tz: 'Asia/Shanghai', utc: 8 },
  '长沙': { tz: 'Asia/Shanghai', utc: 8 },
  '青岛': { tz: 'Asia/Shanghai', utc: 8 },
  '大连': { tz: 'Asia/Shanghai', utc: 8 },
  '厦门': { tz: 'Asia/Shanghai', utc: 8 },
  '昆明': { tz: 'Asia/Shanghai', utc: 8 },
  '哈尔滨': { tz: 'Asia/Harbin', utc: 8 },
  '乌鲁木齐': { tz: 'Asia/Urumqi', utc: 6 },
  '拉萨': { tz: 'Asia/Urumqi', utc: 6 },
  '香港': { tz: 'Asia/Hong_Kong', utc: 8 },
  '澳门': { tz: 'Asia/Macau', utc: 8 },
  '台北': { tz: 'Asia/Taipei', utc: 8 },
  '东京': { tz: 'Asia/Tokyo', utc: 9 },
  '大阪': { tz: 'Asia/Tokyo', utc: 9 },
  '首尔': { tz: 'Asia/Seoul', utc: 9 },
  '新加坡': { tz: 'Asia/Singapore', utc: 8 },
  '曼谷': { tz: 'Asia/Bangkok', utc: 7 },
  '吉隆坡': { tz: 'Asia/Kuala_Lumpur', utc: 8 },
  '雅加达': { tz: 'Asia/Jakarta', utc: 7 },
  '马尼拉': { tz: 'Asia/Manila', utc: 8 },
  '河内': { tz: 'Asia/Ho_Chi_Minh', utc: 7 },
  '胡志明': { tz: 'Asia/Ho_Chi_Minh', utc: 7 },
  '新德里': { tz: 'Asia/Kolkata', utc: 5.5 },
  '孟买': { tz: 'Asia/Kolkata', utc: 5.5 },
  '迪拜': { tz: 'Asia/Dubai', utc: 4 },
  '阿布扎比': { tz: 'Asia/Dubai', utc: 4 },
  '伊斯坦布尔': { tz: 'Europe/Istanbul', utc: 3 },
  '莫斯科': { tz: 'Europe/Moscow', utc: 3 },
  '圣彼得堡': { tz: 'Europe/Moscow', utc: 3 },
  '开罗': { tz: 'Africa/Cairo', utc: 2 },
  '约翰内斯堡': { tz: 'Africa/Johannesburg', utc: 2 },
  '内罗毕': { tz: 'Africa/Nairobi', utc: 3 },
  '伦敦': { tz: 'Europe/London', utc: 0 },
  '巴黎': { tz: 'Europe/Paris', utc: 1 },
  '柏林': { tz: 'Europe/Berlin', utc: 1 },
  '罗马': { tz: 'Europe/Rome', utc: 1 },
  '马德里': { tz: 'Europe/Madrid', utc: 1 },
  '阿姆斯特丹': { tz: 'Europe/Amsterdam', utc: 1 },
  '布鲁塞尔': { tz: 'Europe/Brussels', utc: 1 },
  '维也纳': { tz: 'Europe/Vienna', utc: 1 },
  '苏黎世': { tz: 'Europe/Zurich', utc: 1 },
  '日内瓦': { tz: 'Europe/Zurich', utc: 1 },
  '慕尼黑': { tz: 'Europe/Berlin', utc: 1 },
  '法兰克福': { tz: 'Europe/Berlin', utc: 1 },
  '斯德哥尔摩': { tz: 'Europe/Stockholm', utc: 1 },
  '赫尔辛基': { tz: 'Europe/Helsinki', utc: 2 },
  '华沙': { tz: 'Europe/Warsaw', utc: 1 },
  '布拉格': { tz: 'Europe/Prague', utc: 1 },
  '布达佩斯': { tz: 'Europe/Budapest', utc: 1 },
  '哥本哈根': { tz: 'Europe/Copenhagen', utc: 1 },
  '奥斯陆': { tz: 'Europe/Oslo', utc: 1 },
  '雅典': { tz: 'Europe/Athens', utc: 2 },
  '里斯本': { tz: 'Europe/Lisbon', utc: 0 },
  '都柏林': { tz: 'Europe/Dublin', utc: 0 },
  '爱丁堡': { tz: 'Europe/London', utc: 0 },
  '纽约': { tz: 'America/New_York', utc: -5 },
  '华盛顿': { tz: 'America/New_York', utc: -5 },
  '波士顿': { tz: 'America/New_York', utc: -5 },
  '芝加哥': { tz: 'America/Chicago', utc: -6 },
  '休斯顿': { tz: 'America/Chicago', utc: -6 },
  '达拉斯': { tz: 'America/Chicago', utc: -6 },
  '丹佛': { tz: 'America/Denver', utc: -7 },
  '洛杉矶': { tz: 'America/Los_Angeles', utc: -8 },
  '旧金山': { tz: 'America/Los_Angeles', utc: -8 },
  '西雅图': { tz: 'America/Los_Angeles', utc: -8 },
  '圣地亚哥': { tz: 'America/Los_Angeles', utc: -8 },
  '拉斯维加斯': { tz: 'America/Los_Angeles', utc: -8 },
  '凤凰城': { tz: 'America/Phoenix', utc: -7 },
  '檀香山': { tz: 'Pacific/Honolulu', utc: -10 },
  '安克雷奇': { tz: 'America/Anchorage', utc: -9 },
  '多伦多': { tz: 'America/Toronto', utc: -5 },
  '蒙特利尔': { tz: 'America/Toronto', utc: -5 },
  '温哥华': { tz: 'America/Vancouver', utc: -8 },
  '卡尔加里': { tz: 'America/Edmonton', utc: -7 },
  '墨西哥城': { tz: 'America/Mexico_City', utc: -6 },
  '圣保罗': { tz: 'America/Sao_Paulo', utc: -3 },
  '里约热内卢': { tz: 'America/Sao_Paulo', utc: -3 },
  '布宜诺斯艾利斯': { tz: 'America/Argentina/Buenos_Aires', utc: -3 },
  '利马': { tz: 'America/Lima', utc: -5 },
  '波哥大': { tz: 'America/Bogota', utc: -5 },
  '悉尼': { tz: 'Australia/Sydney', utc: 11 },
  '墨尔本': { tz: 'Australia/Melbourne', utc: 11 },
  '布里斯班': { tz: 'Australia/Brisbane', utc: 10 },
  '珀斯': { tz: 'Australia/Perth', utc: 8 },
  '奥克兰': { tz: 'Pacific/Auckland', utc: 13 },
  '惠灵顿': { tz: 'Pacific/Auckland', utc: 13 }
}

export function searchCities(keyword) {
  if (!keyword || !keyword.trim()) return Object.keys(TIMEZONE_DB).slice(0, 10)
  const kw = keyword.trim().toLowerCase()
  return Object.keys(TIMEZONE_DB).filter(c => c.toLowerCase().includes(kw)).slice(0, 15)
}

export function getCityInfo(cityName) {
  return TIMEZONE_DB[cityName] || null
}

export function getAllCities() {
  return Object.keys(TIMEZONE_DB)
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes) {
  let m = Math.round(minutes) % (24 * 60)
  if (m < 0) m += 24 * 60
  const h = Math.floor(m / 60) % 24
  const min = m % 60
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

export function calculateJetLag(params) {
  const { departureCity, destinationCity, departureDate, arrivalDate, bedtime, wakeTime } = params

  const depInfo = TIMEZONE_DB[departureCity]
  const destInfo = TIMEZONE_DB[destinationCity]

  if (!depInfo || !destInfo) {
    return { error: '城市信息未找到，请从列表中选择城市' }
  }

  const tzDiff = destInfo.utc - depInfo.utc
  const absTzDiff = Math.abs(tzDiff)
  const direction = tzDiff > 0 ? 'east' : tzDiff < 0 ? 'west' : 'none'

  if (direction === 'none') {
    return {
      tzDiff: 0,
      direction: 'none',
      days: [],
      summary: '出发地与目的地无时差，无需调整作息。'
    }
  }

  const bedtimeMin = timeToMinutes(bedtime)
  const wakeTimeMin = timeToMinutes(wakeTime)

  let sleepDurationMin = wakeTimeMin - bedtimeMin
  if (sleepDurationMin <= 0) sleepDurationMin += 24 * 60

  const depDate = dayjs(departureDate)
  const arrDate = dayjs(arrivalDate)
  const preAdjustDays = Math.max(0, arrDate.diff(depDate, 'day') > 0 ? Math.min(3, Math.ceil(absTzDiff / 2)) : 0)

  const preStartDate = depDate.subtract(preAdjustDays, 'day')
  const totalDays = preAdjustDays + Math.max(1, Math.ceil(absTzDiff / getPhaseRate(direction)))

  let phaseRate = getPhaseRate(direction)
  let totalPhaseNeeded = absTzDiff * 60

  const prePhaseRate = phaseRate * 0.5
  let prePhaseTotal = 0

  const days = []

  for (let i = 0; i < totalDays; i++) {
    const currentDate = preStartDate.add(i, 'day')
    const isPreAdjust = i < preAdjustDays
    const dayIndex = i - preAdjustDays

    let cumulativeShiftMin, dailyShiftMin
    let phaseLeft, daysLeft

    if (isPreAdjust) {
      dailyShiftMin = prePhaseRate * 60
      prePhaseTotal += dailyShiftMin
      cumulativeShiftMin = prePhaseTotal
    } else {
      const postDay = dayIndex
      phaseLeft = totalPhaseNeeded - prePhaseTotal
      daysLeft = totalDays - preAdjustDays - postDay
      if (daysLeft <= 0) {
        dailyShiftMin = phaseLeft
      } else {
        dailyShiftMin = Math.min(phaseRate * 60, phaseLeft / daysLeft)
      }
      cumulativeShiftMin = prePhaseTotal + dailyShiftMin * (postDay + 1)
    }

    cumulativeShiftMin = Math.min(cumulativeShiftMin, totalPhaseNeeded)

    let adjustedBedtimeMin, adjustedWakeTimeMin
    if (direction === 'east') {
      adjustedBedtimeMin = bedtimeMin - cumulativeShiftMin
      adjustedWakeTimeMin = wakeTimeMin - cumulativeShiftMin
    } else {
      adjustedBedtimeMin = bedtimeMin + cumulativeShiftMin
      adjustedWakeTimeMin = wakeTimeMin + cumulativeShiftMin
    }

    const adjustedBedtime = minutesToTime(adjustedBedtimeMin)
    const adjustedWakeTime = minutesToTime(adjustedWakeTimeMin)

    const bedtimeOffset = direction === 'east'
      ? -(cumulativeShiftMin / 60)
      : (cumulativeShiftMin / 60)

    const lightGuidance = getLightGuidance(direction, adjustedWakeTimeMin, adjustedBedtimeMin, cumulativeShiftMin, totalPhaseNeeded)
    const caffeineGuidance = getCaffeineGuidance(direction, adjustedWakeTimeMin, cumulativeShiftMin, totalPhaseNeeded)

    const destLocalBedtime = minutesToTime(adjustedBedtimeMin + tzDiff * 60)
    const destLocalWakeTime = minutesToTime(adjustedWakeTimeMin + tzDiff * 60)

    let phaseLabel = ''
    const phasePercent = Math.round((cumulativeShiftMin / totalPhaseNeeded) * 100)
    if (isPreAdjust) {
      phaseLabel = '预调整'
    } else if (phasePercent >= 100) {
      phaseLabel = '已适应'
    } else if (phasePercent >= 70) {
      phaseLabel = '快速适应'
    } else if (phasePercent >= 40) {
      phaseLabel = '适应中'
    } else {
      phaseLabel = '初期调整'
    }

    const isArrivalDay = currentDate.isSame(arrDate, 'day')
    const isDepartureDay = currentDate.isSame(depDate, 'day')

    days.push({
      date: currentDate.format('YYYY-MM-DD'),
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][currentDate.day()],
      phaseLabel,
      phasePercent: Math.min(100, phasePercent),
      isPreAdjust,
      isArrivalDay,
      isDepartureDay,
      bedtimeOffset: Number(bedtimeOffset.toFixed(1)),
      adjustedBedtime,
      adjustedWakeTime,
      destLocalBedtime,
      destLocalWakeTime,
      sleepDuration: sleepDurationMin / 60,
      lightSeek: lightGuidance.seek,
      lightAvoid: lightGuidance.avoid,
      caffeineWindow: caffeineGuidance.window,
      caffeineCutOff: caffeineGuidance.cutOff,
      tips: generateDayTips(direction, phasePercent, isPreAdjust, isArrivalDay, adjustedBedtimeMin)
    })
  }

  const summary = generateSummary(direction, tzDiff, absTzDiff, totalDays, preAdjustDays)

  return {
    tzDiff,
    absTzDiff,
    direction,
    directionLabel: direction === 'east' ? '向东飞行（相位提前）' : '向西飞行（相位推迟）',
    departureTz: depInfo.utc,
    destinationTz: destInfo.utc,
    originalBedtime: bedtime,
    originalWakeTime: wakeTime,
    preAdjustDays,
    totalDays,
    days,
    summary
  }
}

function getPhaseRate(direction) {
  if (direction === 'east') return 1.0
  return 1.5
}

function getLightGuidance(direction, wakeTimeMin, bedtimeMin, cumulativeShift, totalShift) {
  const progress = cumulativeShift / totalShift
  if (direction === 'east') {
    const seekEnd = Math.min(wakeTimeMin + 180, wakeTimeMin + 120 + progress * 120)
    return {
      seek: {
        start: minutesToTime(wakeTimeMin),
        end: minutesToTime(seekEnd),
        description: '晨间光照可提前生物钟相位，尽量在户外活动'
      },
      avoid: {
        start: minutesToTime(bedtimeMin - 120),
        end: minutesToTime(bedtimeMin - 30),
        description: '傍晚避免强光，使用遮光窗帘或佩戴防蓝光眼镜'
      }
    }
  } else {
    const seekStart = Math.max(bedtimeMin - 240, bedtimeMin - 300 + progress * 120)
    return {
      seek: {
        start: minutesToTime(seekStart),
        end: minutesToTime(bedtimeMin - 60),
        description: '傍晚光照可推迟生物钟相位，延长日照暴露时间'
      },
      avoid: {
        start: minutesToTime(wakeTimeMin),
        end: minutesToTime(wakeTimeMin + 60),
        description: '清晨避免强光，戴墨镜或保持昏暗环境'
      }
    }
  }
}

function getCaffeineGuidance(direction, wakeTimeMin, cumulativeShift, totalShift) {
  if (direction === 'east') {
    return {
      window: {
        start: minutesToTime(wakeTimeMin),
        end: minutesToTime(wakeTimeMin + 240),
        description: '上午摄入咖啡因辅助相位提前，促进日间清醒'
      },
      cutOff: minutesToTime(wakeTimeMin + 240),
      description: '截止时间后禁止摄入咖啡因，避免影响提前入睡'
    }
  } else {
    return {
      window: {
        start: minutesToTime(wakeTimeMin + 60),
        end: minutesToTime(wakeTimeMin + 360),
        description: '延迟首次咖啡因摄入，帮助推迟清醒时段'
      },
      cutOff: minutesToTime(wakeTimeMin + 360),
      description: '午后2-3点后停止咖啡因，避免影响后续入睡'
    }
  }
}

function generateDayTips(direction, phasePercent, isPreAdjust, isArrivalDay, adjustedBedtimeMin) {
  const tips = []
  if (isPreAdjust) {
    tips.push('出发前预调整阶段，渐进式改变作息时间')
    if (direction === 'east') {
      tips.push('每晚提前15-30分钟上床，早晨按闹钟早起')
    } else {
      tips.push('每晚推迟15-30分钟入睡，早晨适当赖床')
    }
  }
  if (isArrivalDay) {
    tips.push('抵达日是关键适应期，严格遵守光照与避光时段')
    tips.push('即使困倦也尽量坚持到当地就寝时间')
    if (direction === 'east') {
      tips.push('抵达后立即获取晨间阳光照射')
    } else {
      tips.push('抵达后尽量保持活动到傍晚')
    }
  }
  if (phasePercent < 40) {
    if (direction === 'east') {
      tips.push('可考虑在目标就寝前1小时服用0.5-3mg褪黑素')
    }
    tips.push('午间小憩不超过20分钟，避免影响夜间睡眠')
  }
  if (phasePercent >= 70 && phasePercent < 100) {
    tips.push('已进入快速适应期，继续保持规律作息')
  }
  if (phasePercent >= 100) {
    tips.push('已完成时差适应！维持当前作息节律即可')
  }
  tips.push('保持充足饮水，避免酒精干扰睡眠结构')
  return tips
}

function generateSummary(direction, tzDiff, absTzDiff, totalDays, preAdjustDays) {
  const dirText = direction === 'east' ? '向东' : '向西'
  const phaseText = direction === 'east' ? '提前相位（早睡早起）' : '推迟相位（晚睡晚起）'
  const rateText = direction === 'east' ? '约1小时/天' : '约1.5小时/天'

  let summary = `${dirText}飞行，时差${absTzDiff}小时，采用${phaseText}策略，调整速率${rateText}。`
  if (preAdjustDays > 0) {
    summary += `出发前${preAdjustDays}天开始预调整，`
  }
  summary += `预计${totalDays}天完成适应。`
  summary += direction === 'east'
    ? '核心原则：晨间充分光照、傍晚避光、上午咖啡因、晚间褪黑素辅助。'
    : '核心原则：傍晚充分光照、清晨避光、延迟咖啡因、午间小憩辅助。'
  return summary
}

export function generateICS(result) {
  if (!result || !result.days || result.days.length === 0) return ''

  const pad = (n) => n.toString().padStart(2, '0')
  const formatDT = (dateStr, timeStr) => {
    const [y, m, d] = dateStr.split('-')
    const [h, min] = timeStr.split(':')
    return `${y}${m}${d}T${pad(parseInt(h))}${min}00`
  }

  let ics = 'BEGIN:VCALENDAR\r\n'
  ics += 'VERSION:2.0\r\n'
  ics += 'PRODID:-//CircadianTracker//JetLagPlan//CN\r\n'
  ics += 'CALSCALE:GREGORIAN\r\n'
  ics += 'METHOD:PUBLISH\r\n'

  result.days.forEach((day) => {
    const uid = `jetlag-${day.date}@circadian-tracker`

    ics += 'BEGIN:VEVENT\r\n'
    ics += `UID:${uid}\r\n`
    ics += `DTSTART;TZID=UTC:${formatDT(day.date, day.adjustedBedtime)}\r\n`
    ics += `DTEND;TZID=UTC:${formatDT(day.date, day.adjustedWakeTime)}\r\n`
    ics += `SUMMARY:时差调整 - ${day.phaseLabel} (${day.phasePercent}%)\r\n`
    ics += `DESCRIPTION:就寝:${day.adjustedBedtime} 起床:${day.adjustedWakeTime}\\n光照:${day.lightSeek.start}-${day.lightSeek.end}\\n避光:${day.lightAvoid.start}-${day.lightAvoid.end}\\n咖啡因:${day.caffeineWindow.start}-${day.caffeineWindow.end}\\n偏移:${day.bedtimeOffset > 0 ? '+' : ''}${day.bedtimeOffset}h\\n${day.tips.join('\\\\n')}\r\n`
    ics += `LOCATION:时差调整日 Day${result.days.indexOf(day) + 1}\r\n`
    ics += 'BEGIN:VALARM\r\n'
    ics += 'TRIGGER:-PT30M\r\n'
    ics += 'ACTION:DISPLAY\r\n'
    ics += `DESCRIPTION:30分钟后就寝 (${day.adjustedBedtime})\r\n`
    ics += 'END:VALARM\r\n'
    ics += 'END:VEVENT\r\n'

    ics += 'BEGIN:VEVENT\r\n'
    ics += `UID:${uid}-light\r\n`
    ics += `DTSTART;TZID=UTC:${formatDT(day.date, day.lightSeek.start)}\r\n`
    ics += `DTEND;TZID=UTC:${formatDT(day.date, day.lightSeek.end)}\r\n`
    ics += `SUMMARY:☀️ 光照时段 - ${day.lightSeek.description}\r\n`
    ics += 'END:VEVENT\r\n'

    ics += 'BEGIN:VEVENT\r\n'
    ics += `UID:${uid}-avoid\r\n`
    ics += `DTSTART;TZID=UTC:${formatDT(day.date, day.lightAvoid.start)}\r\n`
    ics += `DTEND;TZID=UTC:${formatDT(day.date, day.lightAvoid.end)}\r\n`
    ics += `SUMMARY:🕶️ 避光时段 - ${day.lightAvoid.description}\r\n`
    ics += 'END:VEVENT\r\n'
  })

  ics += 'END:VCALENDAR\r\n'
  return ics
}

export function downloadICS(result, filename) {
  const icsContent = generateICS(result)
  if (!icsContent) return
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename || `时差调整方案_${dayjs().format('YYYYMMDD')}.ics`
  link.click()
  URL.revokeObjectURL(link.href)
}
