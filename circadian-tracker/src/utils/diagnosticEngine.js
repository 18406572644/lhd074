import dayjs from 'dayjs'
import { icsd3Categories, assessmentScales, cbtInterventions, chronotypeCalculator, DISCLAIMER } from '@/data/knowledgeGraph'

export class DiagnosticEngine {
  constructor() {
    this.disclaimer = DISCLAIMER
  }

  analyze(records, assessments = {}) {
    if (!records || records.length === 0) {
      return {
        hasData: false,
        disclaimer: this.disclaimer,
        diagnoses: [],
        chronotype: null,
        recommendations: [],
        aggregatedMetrics: null
      }
    }

    const metrics = this.aggregateMetrics(records)
    const chronotype = this.analyzeChronotype(records)
    const diagnoses = this.matchDiagnoses(records, metrics, assessments)
    const recommendations = this.generateRecommendations(diagnoses, chronotype, metrics)

    return {
      hasData: true,
      disclaimer: this.disclaimer,
      diagnoses,
      chronotype,
      recommendations,
      aggregatedMetrics: metrics,
      assessments
    }
  }

  aggregateMetrics(records) {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
    const last30Days = sorted.slice(-30)
    const last7Days = sorted.slice(-7)
    const last14Days = sorted.slice(-14)

    const calculateSleepLatency = (record) => {
      if (record.sleepLatency) return record.sleepLatency
      return null
    }

    const metrics = {
      last7Days: this.calculatePeriodMetrics(last7Days),
      last14Days: this.calculatePeriodMetrics(last14Days),
      last30Days: this.calculatePeriodMetrics(last30Days),
      allRecords: sorted
    }

    metrics.sleepLatency30Days = {
      values: last30Days.map(calculateSleepLatency).filter(v => v !== null),
      avg: null,
      daysOver30min: 0
    }

    const latencies = metrics.sleepLatency30Days.values
    if (latencies.length > 0) {
      metrics.sleepLatency30Days.avg = latencies.reduce((a, b) => a + b, 0) / latencies.length
      metrics.sleepLatency30Days.daysOver30min = latencies.filter(v => v > 30).length
    }

    metrics.epworthScore = assessments.epworth?.totalScore ?? null
    metrics.isiScore = assessments.isi?.totalScore ?? null

    return metrics
  }

  calculatePeriodMetrics(records) {
    if (records.length === 0) return null

    const sleepHours = records.map(r => {
      const bedtime = dayjs(`${r.date} ${r.bedtime}`)
      const wakeTime = dayjs(`${r.date} ${r.wakeTime}`)
      let hours = wakeTime.diff(bedtime, 'minute') / 60
      if (hours < 0) hours += 24
      return hours
    })

    const bedtimes = records.map(r => {
      const [h, m] = r.bedtime.split(':').map(Number)
      return h + m / 60
    })

    const avgSleepHours = sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length
    const avgBedtimeHour = bedtimes.reduce((a, b) => a + b, 0) / bedtimes.length

    const daysWithInsomniaSymptoms = records.filter(r => {
      const [h] = r.bedtime.split(':').map(Number)
      return h >= 2 || r.nightWakeUps === 'frequent' || r.preSleepThoughts >= 4
    }).length

    const weekendRecords = records.filter(r => {
      const d = dayjs(r.date)
      return d.day() === 0 || d.day() === 6
    })

    const weekdayRecords = records.filter(r => {
      const d = dayjs(r.date)
      return d.day() >= 1 && d.day() <= 5
    })

    const weekendAvgSleep = this.calculateAvgSleep(weekendRecords)
    const weekdayAvgSleep = this.calculateAvgSleep(weekdayRecords)

    return {
      recordCount: records.length,
      avgSleepHours,
      avgBedtimeHour,
      avgBedtime: this.formatHour(avgBedtimeHour),
      daysWithInsomniaSymptoms,
      insomniaRate: records.length > 0 ? (daysWithInsomniaSymptoms / records.length) : 0,
      weekendAvgSleep,
      weekdayAvgSleep,
      weekendCatchup: weekendAvgSleep && weekdayAvgSleep ? (weekendAvgSleep - weekdayAvgSleep) : 0
    }
  }

  calculateAvgSleep(records) {
    if (records.length === 0) return null
    const sleepHours = records.map(r => {
      const bedtime = dayjs(`${r.date} ${r.bedtime}`)
      const wakeTime = dayjs(`${r.date} ${r.wakeTime}`)
      let hours = wakeTime.diff(bedtime, 'minute') / 60
      if (hours < 0) hours += 24
      return hours
    })
    return sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length
  }

  formatHour(hour) {
    const h = Math.floor(hour) % 24
    const m = Math.round((hour - Math.floor(hour)) * 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  analyzeChronotype(records) {
    const latest = records[records.length - 1]
    if (!latest) return null

    const d = dayjs(latest.date)
    const isWeekday = d.day() >= 1 && d.day() <= 5

    const msfResult = chronotypeCalculator.calculateMSFsc(
      latest.bedtime,
      latest.wakeTime,
      isWeekday
    )

    const chronotype = chronotypeCalculator.determineChronotype(msfResult.MSFscMinutes)

    return {
      ...chronotype,
      ...msfResult,
      isWeekday
    }
  }

  matchDiagnoses(records, metrics, assessments) {
    const diagnoses = []
    const last30 = metrics.last30Days
    const epworth = metrics.epworthScore
    const isi = metrics.isiScore
    const sleepLatency = metrics.sleepLatency30Days

    if (last30) {
      if (last30.insomniaRate >= 0.43) {
        const matchingCriteria = []
        const missingCriteria = []

        matchingCriteria.push('入睡困难、维持睡眠困难或早醒')
        matchingCriteria.push(`每周≥3天出现症状（${last30.daysWithInsomniaSymptoms}天/30天）`)

        if (isi !== null && isi >= 8) {
          matchingCriteria.push(`ISI评分${isi}分（≥8分提示失眠）`)
        }

        if (sleepLatency.avg !== null && sleepLatency.avg > 30) {
          matchingCriteria.push(`平均入睡潜伏期${sleepLatency.avg.toFixed(0)}分钟（>30分钟）`)
        }

        if (sleepLatency.daysOver30min >= 3) {
          matchingCriteria.push(`每周≥3天入睡潜伏期>30分钟（${sleepLatency.daysOver30min}天/30天）`)
        }

        if (last30.avgSleepHours < 6) {
          matchingCriteria.push(`平均睡眠时长${last30.avgSleepHours.toFixed(1)}小时（<6小时）`)
        }

        missingCriteria.push('症状持续时间需≥3个月（需进一步确认）')
        missingCriteria.push('需排除其他睡眠障碍、精神障碍或物质使用所致')

        const confidence = Math.min(100, matchingCriteria.length * 25)

        diagnoses.push({
          ...icsd3Categories.find(c => c.id === 'insomnia'),
          matchLevel: confidence >= 75 ? 'high' : confidence >= 50 ? 'medium' : 'low',
          confidence,
          matchingCriteria,
          missingCriteria,
          suggestion: '疑似失眠障碍，建议就医进行专业评估。可先尝试 CBT-I 非药物干预。',
          relatedInterventions: ['sleepRestriction', 'stimulusControl', 'cognitiveRestructuring', 'sleepHygiene']
        })
      }

      if (epworth !== null && epworth >= 10) {
        const matchingCriteria = []
        const missingCriteria = []

        matchingCriteria.push(`Epworth嗜睡量表评分${epworth}分（≥10分提示日间过度嗜睡）`)

        if (last30.avgSleepHours < 6) {
          matchingCriteria.push(`平均睡眠时长${last30.avgSleepHours.toFixed(1)}小时（<6小时）`)
        }

        missingCriteria.push('需排除夜间打鼾、呼吸暂停等OSA症状')
        missingCriteria.push('需进行睡眠监测（PSG）确认AHI指数')
        missingCriteria.push('需确认血氧饱和度下降情况')

        const confidence = epworth >= 16 ? 60 : 40

        diagnoses.push({
          ...icsd3Categories.find(c => c.id === 'obstructive_sleep_apnea'),
          matchLevel: confidence >= 60 ? 'medium' : 'low',
          confidence,
          matchingCriteria,
          missingCriteria,
          suggestion: '日间过度嗜睡，建议进行睡眠呼吸监测以排除阻塞性睡眠呼吸暂停。',
          relatedInterventions: ['sleepHygiene']
        })
      }
    }

    const chronotype = this.analyzeChronotype(records)
    if (chronotype) {
      if (chronotype.type === 'delayed') {
        const matchingCriteria = []
        const missingCriteria = []

        matchingCriteria.push(`MSFsc（校正睡眠中点）${chronotype.correctedMSFsc}（≥05:00）`)
        matchingCriteria.push(`入睡时间${records[records.length - 1].bedtime}（通常在凌晨2点后）`)

        if (last30 && last30.weekendCatchup >= 1) {
          matchingCriteria.push(`周末补觉${last30.weekendCatchup.toFixed(1)}小时（≥1小时提示睡眠剥夺）`)
        }

        missingCriteria.push('症状持续时间需≥3个月（需进一步确认）')
        missingCriteria.push('需确认无强制早起情况下睡眠质量正常')

        const confidence = 70

        diagnoses.push({
          ...icsd3Categories.find(c => c.id === 'delayed_sleep_phase'),
          matchLevel: 'medium',
          confidence,
          matchingCriteria,
          missingCriteria,
          suggestion: '晚睡型时型，符合睡眠时相延迟障碍特征。建议尝试晨光疗法调整节律。',
          relatedInterventions: ['lightTherapy', 'sleepHygiene']
        })
      } else if (chronotype.type === 'advanced') {
        const matchingCriteria = []
        const missingCriteria = []

        matchingCriteria.push(`MSFsc（校正睡眠中点）${chronotype.correctedMSFsc}（≤01:00）`)
        matchingCriteria.push(`入睡时间${records[records.length - 1].bedtime}（通常在晚上8点前）`)

        missingCriteria.push('症状持续时间需≥3个月（需进一步确认）')
        missingCriteria.push('需确认凌晨2-4点早醒症状')

        const confidence = 65

        diagnoses.push({
          ...icsd3Categories.find(c => c.id === 'advanced_sleep_phase'),
          matchLevel: 'medium',
          confidence,
          matchingCriteria,
          missingCriteria,
          suggestion: '早睡型时型，符合睡眠时相提前障碍特征。建议尝试傍晚光疗调整节律。',
          relatedInterventions: ['lightTherapy', 'sleepHygiene']
        })
      }
    }

    return diagnoses.sort((a, b) => b.confidence - a.confidence)
  }

  generateRecommendations(diagnoses, chronotype, metrics) {
    const recommendations = []

    if (diagnoses.length === 0) {
      recommendations.push({
        type: 'positive',
        icon: 'CircleCheckFilled',
        title: '作息节律良好',
        content: '当前睡眠数据未显示明显异常，请继续保持健康的作息习惯。'
      })
    }

    diagnoses.forEach(d => {
      if (d.matchLevel === 'high' || d.matchLevel === 'medium') {
        recommendations.push({
          type: 'warning',
          icon: 'WarningFilled',
          title: d.name,
          content: d.suggestion,
          confidence: d.confidence,
          relatedInterventions: d.relatedInterventions
        })
      }
    })

    if (chronotype) {
      if (chronotype.type === 'delayed') {
        recommendations.push({
          type: 'info',
          icon: 'Sunny',
          title: '晚睡型调整建议',
          content: '建议早晨醒后立即接受30-60分钟强光照射（10000 lux），有助于提前生物钟。避免傍晚强光暴露。',
          intervention: 'lightTherapy'
        })
      } else if (chronotype.type === 'advanced') {
        recommendations.push({
          type: 'info',
          icon: 'Moon',
          title: '早睡型调整建议',
          content: '建议傍晚18:00-20:00接受30-60分钟强光照射，有助于延迟生物钟。早晨适当遮光。',
          intervention: 'lightTherapy'
        })
      }
    }

    if (metrics?.last30Days?.avgSleepHours < 7) {
      recommendations.push({
        type: 'warning',
        icon: 'Timer',
        title: '睡眠时长不足',
        content: `近30天平均睡眠时长仅${metrics.last30Days.avgSleepHours.toFixed(1)}小时，建议保证7-9小时健康睡眠。`,
        relatedInterventions: ['sleepHygiene', 'sleepRestriction']
      })
    }

    if (metrics?.epworthScore !== null && metrics.epworthScore >= 10) {
      recommendations.push({
        type: 'danger',
        icon: 'BellFilled',
        title: '日间嗜睡警告',
        content: `Epworth评分${metrics.epworthScore}分，提示中度以上日间嗜睡，建议进行专业睡眠评估。`,
        relatedDiagnosis: 'obstructive_sleep_apnea'
      })
    }

    if (recommendations.length > 0 && !recommendations.some(r => r.type === 'disclaimer')) {
      recommendations.push({
        type: 'disclaimer',
        icon: 'InfoFilled',
        title: '重要声明',
        content: this.disclaimer
      })
    }

    return recommendations
  }

  calculateEpworthScore(answers) {
    const scale = assessmentScales.epworth
    if (!answers || answers.length !== scale.items.length) {
      return { totalScore: null, interpretation: '请完整填写所有项目' }
    }
    const totalScore = answers.reduce((sum, val) => sum + val, 0)
    let interpretation = ''
    for (const [range, text] of Object.entries(scale.interpretation)) {
      const [min, max] = range.split('-').map(Number)
      if (totalScore >= min && totalScore <= max) {
        interpretation = text
        break
      }
    }
    return {
      totalScore,
      interpretation,
      cutoff: scale.cutoff,
      reference: scale.reference
    }
  }

  calculateISIScore(answers) {
    const scale = assessmentScales.isi
    if (!answers || answers.length !== scale.items.length) {
      return { totalScore: null, interpretation: '请完整填写所有项目' }
    }
    const totalScore = answers.reduce((sum, val) => sum + val, 0)
    let interpretation = ''
    for (const [range, text] of Object.entries(scale.interpretation)) {
      const [min, max] = range.split('-').map(Number)
      if (totalScore >= min && totalScore <= max) {
        interpretation = text
        break
      }
    }
    return {
      totalScore,
      interpretation,
      cutoff: scale.cutoff,
      reference: scale.reference
    }
  }

  getInterventionDetails(interventionId) {
    return cbtInterventions[interventionId] || null
  }

  getDiseaseDetails(diseaseId) {
    return icsd3Categories.find(c => c.id === diseaseId) || null
  }

  getAllDiseases() {
    return icsd3Categories
  }

  getAllInterventions() {
    return Object.values(cbtInterventions)
  }

  getAssessmentScale(scaleId) {
    return assessmentScales[scaleId] || null
  }
}

export const diagnosticEngine = new DiagnosticEngine()
