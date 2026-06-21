<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2 class="page-title">
        <el-icon><DataBoard /></el-icon>
        数据仪表盘
      </h2>
      <div class="header-actions">
        <el-tag :type="todayScoreType" size="large" effect="dark" round>
          今日评分 {{ todayScore }} 分
        </el-tag>
        <el-button type="primary" @click="handleExportPdf" :icon="Download" round>
          导出报告
        </el-button>
      </div>
    </div>

    <PredictionCard
      :records="last30Records"
      :calcSleepScore="store.calcSleepScore"
      :goals="store.goals"
      @takeAction="handlePredictionAction"
    />

    <div v-if="diagnosticResult.hasData && diagnosticResult.diagnoses.length > 0" class="ct-card diagnosis-alert-card">
      <div class="diagnosis-alert-header">
        <div class="alert-title">
          <el-icon :size="24" color="#f56c6c"><Bell /></el-icon>
          <span>智能诊断提示</span>
          <el-tag size="small" type="danger" effect="dark" style="margin-left: 8px">
            {{ diagnosticResult.diagnoses.length }} 项异常
          </el-tag>
        </div>
        <el-button type="primary" plain size="small" @click="goToKnowledge">
          查看详情 <el-icon><ArrowRightBold /></el-icon>
        </el-button>
      </div>
      <div class="diagnosis-alert-list">
        <div
          v-for="d in diagnosticResult.diagnoses.filter(x => x.matchLevel !== 'low').slice(0, 2)"
          :key="d.id"
          class="alert-item"
          :class="d.matchLevel"
        >
          <div class="alert-item-header">
            <span class="alert-name">{{ d.name }}</span>
            <span class="alert-confidence">匹配度 {{ d.confidence }}%</span>
          </div>
          <p class="alert-suggestion">{{ d.suggestion }}</p>
          <div class="alert-matched">
            <span v-for="(c, i) in d.matchingCriteria.slice(0, 2)" :key="i" class="matched-tag">
              {{ c }}
            </span>
          </div>
        </div>
      </div>
      <div class="diagnosis-disclaimer">
        <el-icon><InfoFilled /></el-icon>
        {{ diagnosticResult.disclaimer }}
      </div>
    </div>

    <div class="stats-row">
      <div class="ct-card stat-card" v-for="stat in todayStats" :key="stat.label">
        <div class="stat-icon" :style="{ background: stat.color }">
          <el-icon :size="22"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="ct-card chart-card">
        <div class="ct-title">
          <el-icon><TrendCharts /></el-icon>
          <span>作息波动趋势</span>
          <el-radio-group v-model="chartRange" size="small" style="margin-left:auto">
            <el-radio-button value="7">7天</el-radio-button>
            <el-radio-button value="30">30天</el-radio-button>
          </el-radio-group>
        </div>
        <div class="chart-container" ref="trendChartRef"></div>
      </div>
      <div class="ct-card chart-card">
        <div class="ct-title">
          <el-icon><PieChart /></el-icon>
          睡眠结构分布
        </div>
        <div class="chart-container" ref="pieChartRef"></div>
      </div>
    </div>

    <div class="charts-row">
      <div class="ct-card chart-card">
        <div class="ct-title">
          <el-icon><Coffee /></el-icon>
          <span>咖啡因摄入趋势</span>
          <el-radio-group v-model="chartRange" size="small" style="margin-left:auto">
            <el-radio-button value="7">7天</el-radio-button>
            <el-radio-button value="30">30天</el-radio-button>
          </el-radio-group>
        </div>
        <div class="chart-container" ref="caffeineChartRef"></div>
      </div>
      <div class="ct-card chart-card">
        <div class="ct-title">
          <el-icon><View /></el-icon>
          <span>用眼时长趋势</span>
          <el-radio-group v-model="chartRange" size="small" style="margin-left:auto">
            <el-radio-button value="7">7天</el-radio-button>
            <el-radio-button value="30">30天</el-radio-button>
          </el-radio-group>
        </div>
        <div class="chart-container" ref="screenChartRef"></div>
      </div>
    </div>

    <div class="bottom-row">
      <div class="ct-card advice-card">
        <div class="ct-title">
          <el-icon><ChatDotRound /></el-icon>
          作息健康建议
        </div>
        <div class="advice-list">
          <div class="advice-item" v-for="(advice, i) in healthAdvices" :key="i"
               :class="advice.type">
            <el-icon><component :is="advice.icon" /></el-icon>
            <span>{{ advice.text }}</span>
          </div>
        </div>
      </div>
      <div class="ct-card goal-card">
        <div class="ct-title">
          <el-icon><Flag /></el-icon>
          作息目标达成
        </div>
        <div class="goal-list">
          <div class="goal-item" v-for="goal in goalProgress" :key="goal.label">
            <div class="goal-header">
              <span class="goal-name">{{ goal.label }}</span>
              <span class="goal-percent" :class="goal.status">{{ goal.percent }}%</span>
            </div>
            <el-progress
              :percentage="goal.percent"
              :color="goal.color"
              :stroke-width="8"
              :show-text="false"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="ct-card heatmap-card">
      <div class="ct-title">
        <el-icon><Calendar /></el-icon>
        年度热力日历
        <el-select v-model="heatmapYear" size="small" style="margin-left: auto; width: 100px">
          <el-option
            v-for="y in heatmapYearOptions"
            :key="y"
            :label="y + '年'"
            :value="y"
          />
        </el-select>
      </div>
      <div class="heatmap-chart-container" ref="heatmapChartRef"></div>
      <div class="heatmap-stats">
        <div class="heatmap-stat-item">
          <span class="heatmap-stat-value">{{ yearStats.totalDays }}</span>
          <span class="heatmap-stat-label">总录入天数</span>
        </div>
        <div class="heatmap-stat-item">
          <span class="heatmap-stat-value">{{ yearStats.avgScore }}</span>
          <span class="heatmap-stat-label">平均评分</span>
        </div>
        <div class="heatmap-stat-item">
          <span class="heatmap-stat-value">{{ yearStats.excellentDays }}</span>
          <span class="heatmap-stat-label">优秀天数</span>
        </div>
        <div class="heatmap-stat-item">
          <span class="heatmap-stat-value">{{ yearStats.maxStreak }}</span>
          <span class="heatmap-stat-label">连续打卡最长天数</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { Download, Bell, ArrowRightBold } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { useScheduleStore } from '@/store'
import { useThemeStore } from '@/store'
import PredictionCard from '@/components/PredictionCard.vue'
import { shouldShowNoonReminder, getNoonReminderText } from '@/utils/prediction'

const store = useScheduleStore()
const themeStore = useThemeStore()
const router = useRouter()
const chartRange = ref('7')

const trendChartRef = ref(null)
const pieChartRef = ref(null)
const caffeineChartRef = ref(null)
const screenChartRef = ref(null)
const heatmapChartRef = ref(null)

let trendChart = null
let pieChart = null
let caffeineChart = null
let screenChart = null
let heatmapChart = null

const currentYear = dayjs().year()
const heatmapYear = ref(currentYear)
const heatmapYearOptions = [currentYear, currentYear - 1]

const todayRecord = computed(() => store.todayRecord)

const todayScore = computed(() => store.calcSleepScore(todayRecord.value))

const last30Records = computed(() => store.getLast30Days())
const diagnosticResult = computed(() => store.diagnosticResult)

function handlePredictionAction() {
  router.push('/input')
}

function goToKnowledge() {
  router.push('/knowledge')
}

const todayScoreType = computed(() => {
  const s = todayScore.value
  if (s >= 80) return 'success'
  if (s >= 60) return 'warning'
  return 'danger'
})

const todayStats = computed(() => {
  const r = todayRecord.value
  if (!r) return [
    { label: '入睡时间', value: '未录入', icon: 'Moon', color: 'linear-gradient(135deg,#7eb8d8,#5a9ab8)' },
    { label: '起床时间', value: '未录入', icon: 'Sunny', color: 'linear-gradient(135deg,#67c28a,#4ea06a)' },
    { label: '睡眠时长', value: '--h', icon: 'Clock', color: 'linear-gradient(135deg,#e6a23c,#c88530)' },
    { label: '深睡/浅睡', value: '--/--', icon: 'Timer', color: 'linear-gradient(135deg,#909399,#6b6e74)' },
    { label: '咖啡因', value: '0mg', icon: 'Coffee', color: 'linear-gradient(135deg,#b88265,#8e614a)' },
    { label: '用眼时长', value: '0min', icon: 'View', color: 'linear-gradient(135deg,#f56c6c,#c94e4e)' }
  ]
  const bedtime = dayjs(`${r.date} ${r.bedtime}`)
  const wakeTime = dayjs(`${r.date} ${r.wakeTime}`)
  let sleepH = wakeTime.diff(bedtime, 'minute') / 60
  if (sleepH < 0) sleepH += 24
  return [
    { label: '入睡时间', value: r.bedtime, icon: 'Moon', color: 'linear-gradient(135deg,#7eb8d8,#5a9ab8)' },
    { label: '起床时间', value: r.wakeTime, icon: 'Sunny', color: 'linear-gradient(135deg,#67c28a,#4ea06a)' },
    { label: '睡眠时长', value: sleepH.toFixed(1) + 'h', icon: 'Clock', color: 'linear-gradient(135deg,#e6a23c,#c88530)' },
    { label: '深睡/浅睡', value: `${r.deepSleep}m/${r.lightSleep}m`, icon: 'Timer', color: 'linear-gradient(135deg,#909399,#6b6e74)' },
    { label: '咖啡因', value: (r.caffeineMg || 0) + 'mg', icon: 'Coffee', color: 'linear-gradient(135deg,#b88265,#8e614a)' },
    { label: '用眼时长', value: (r.screenMin || 0) + 'min', icon: 'View', color: 'linear-gradient(135deg,#f56c6c,#c94e4e)' }
  ]
})

const healthAdvices = computed(() => {
  const advices = []
  const r = todayRecord.value
  if (!r) {
    advices.push({ type: 'info', icon: 'InfoFilled', text: '今日尚未录入作息数据，请先完成录入。' })
    return advices
  }
  const bedtime = dayjs(`${r.date} ${r.bedtime}`)
  const targetBedtime = dayjs(`${r.date} ${store.goals.targetBedtime}`)
  if (bedtime.isAfter(targetBedtime.add(30, 'minute'))) {
    advices.push({ type: 'warn', icon: 'WarningFilled', text: `入睡时间晚于目标30分钟以上，建议调整至${store.goals.targetBedtime}前。` })
  } else {
    advices.push({ type: 'good', icon: 'CircleCheckFilled', text: '入睡时间接近目标，继续保持！' })
  }
  const wakeTime = dayjs(`${r.date} ${r.wakeTime}`)
  let sleepH = wakeTime.diff(bedtime, 'minute') / 60
  if (sleepH < 0) sleepH += 24
  if (sleepH < 6) {
    advices.push({ type: 'warn', icon: 'WarningFilled', text: '睡眠时长不足6小时，长期睡眠不足会影响免疫力和认知功能。' })
  } else if (sleepH >= 7 && sleepH <= 9) {
    advices.push({ type: 'good', icon: 'CircleCheckFilled', text: '睡眠时长在健康范围内(7-9小时)，非常棒！' })
  }
  if ((r.caffeineMg || 0) > store.goals.maxCaffeineMg) {
    advices.push({ type: 'warn', icon: 'WarningFilled', text: `咖啡因摄入(${r.caffeineMg}mg)超过目标上限(${store.goals.maxCaffeineMg}mg)，建议减少。` })
  } else if ((r.caffeineMg || 0) > 0) {
    advices.push({ type: 'info', icon: 'InfoFilled', text: `咖啡因摄入${r.caffeineMg}mg，控制合理，避免下午2点后摄入。` })
  }
  if ((r.screenMin || 0) > store.goals.maxScreenMin) {
    advices.push({ type: 'warn', icon: 'WarningFilled', text: `用眼时间(${r.screenMin}min)超过目标上限，建议每40分钟休息5分钟。` })
  } else if ((r.screenMin || 0) > 0) {
    advices.push({ type: 'info', icon: 'InfoFilled', text: `今日用眼${r.screenMin}分钟，注意遵循20-20-20护眼法则。` })
  }
  if (r.napMin > 30) {
    advices.push({ type: 'info', icon: 'InfoFilled', text: '日间小憩超过30分钟可能影响夜间睡眠质量，建议控制在20分钟内。' })
  }
  if (advices.length === 0) {
    advices.push({ type: 'good', icon: 'CircleCheckFilled', text: '今日作息状况良好，请继续保持健康节律！' })
  }
  return advices
})

const goalProgress = computed(() => {
  const r = todayRecord.value
  if (!r) return [
    { label: '目标就寝', percent: 0, color: '#7eb8d8', status: '' },
    { label: '目标起床', percent: 0, color: '#67c28a', status: '' },
    { label: '睡眠时长', percent: 0, color: '#e6a23c', status: '' },
    { label: '深睡比例', percent: 0, color: '#909399', status: '' }
  ]
  const bedtime = dayjs(`${r.date} ${r.bedtime}`)
  const targetBedtime = dayjs(`${r.date} ${store.goals.targetBedtime}`)
  const bedDiff = bedtime.diff(targetBedtime, 'minute')
  const bedPercent = Math.max(0, Math.min(100, 100 - Math.abs(bedDiff) * 0.5))

  const wakeTime = dayjs(`${r.date} ${r.wakeTime}`)
  const targetWake = dayjs(`${r.date} ${store.goals.targetWakeTime}`)
  const wakeDiff = wakeTime.diff(targetWake, 'minute')
  const wakePercent = Math.max(0, Math.min(100, 100 - Math.abs(wakeDiff) * 0.5))

  let sleepH = wakeTime.diff(bedtime, 'minute') / 60
  if (sleepH < 0) sleepH += 24
  const sleepPercent = Math.max(0, Math.min(100, (sleepH / store.goals.targetSleepHours) * 100))

  const deepRatio = r.deepSleep / ((sleepH * 60) || 1)
  const deepPercent = Math.max(0, Math.min(100, (deepRatio / store.goals.targetDeepRatio) * 100))

  const getStatus = (p) => p >= 80 ? 'good' : p >= 50 ? 'warn' : 'bad'
  return [
    { label: '目标就寝', percent: Math.round(bedPercent), color: '#7eb8d8', status: getStatus(bedPercent) },
    { label: '目标起床', percent: Math.round(wakePercent), color: '#67c28a', status: getStatus(wakePercent) },
    { label: '睡眠时长', percent: Math.round(sleepPercent), color: '#e6a23c', status: getStatus(sleepPercent) },
    { label: '深睡比例', percent: Math.round(deepPercent), color: '#909399', status: getStatus(deepPercent) }
  ]
})

const yearStats = computed(() => {
  const yearRecords = store.getRecordsByYear(heatmapYear.value)
  const totalDays = yearRecords.length
  if (totalDays === 0) {
    return { totalDays: 0, avgScore: '--', excellentDays: 0, maxStreak: 0 }
  }
  const scores = yearRecords.map(r => store.calcSleepScore(r))
  const avgScore = (scores.reduce((a, b) => a + b, 0) / totalDays).toFixed(1)
  const excellentDays = scores.filter(s => s >= 80).length

  const sortedDates = yearRecords.map(r => r.date).sort()
  let maxStreak = 1
  let currentStreak = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = dayjs(sortedDates[i]).diff(dayjs(sortedDates[i - 1]), 'day')
    if (diff === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else if (diff > 1) {
      currentStreak = 1
    }
  }
  if (sortedDates.length === 0) maxStreak = 0

  return { totalDays, avgScore, excellentDays, maxStreak }
})

const textColor = computed(() => themeStore.isDark ? '#c0ccd8' : '#7f8c9b')

function getRangeDays() {
  return chartRange.value === '7' ? store.getLast7Days() : store.getLast30Days()
}

function renderTrendChart() {
  if (!trendChartRef.value) return
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  const days = getRangeDays()
  const dates = days.map(r => r.date.slice(5))
  const bedtimes = days.map(r => {
    const [h, m] = r.bedtime.split(':').map(Number)
    let val = h + m / 60
    return val < 12 ? val + 24 : val
  })
  const wakeTimes = days.map(r => {
    const [h, m] = r.wakeTime.split(':').map(Number)
    return h + m / 60
  })
  const scores = days.map(r => store.calcSleepScore(r))

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let html = `<div style="font-size:12px"><b>${params[0]?.axisValue}</b>`
        params.forEach(p => {
          let v = p.value
          if (p.seriesName === '入睡时间' || p.seriesName === '起床时间') {
            const h = Math.floor(v) % 24
            const m = Math.round((v - Math.floor(v)) * 60).toString().padStart(2, '0')
            v = `${h}:${m}`
          }
          html += `<div>${p.marker}${p.seriesName}: ${v}${p.seriesName === '睡眠评分' ? '分' : ''}</div>`
        })
        html += '</div>'
        return html
      }
    },
    legend: { data: ['入睡时间', '起床时间', '睡眠评分'], textStyle: { color: textColor.value } },
    grid: { left: 50, right: 50, bottom: 30, top: 40 },
    xAxis: { type: 'category', data: dates, axisLabel: { color: textColor.value } },
    yAxis: [
      {
        type: 'value',
        name: '时刻',
        min: 0,
        max: 36,
        axisLabel: {
          color: textColor.value,
          formatter: (v) => `${Math.floor(v) % 24}:00`
        }
      },
      {
        type: 'value',
        name: '评分',
        min: 0,
        max: 100,
        axisLabel: { color: textColor.value }
      }
    ],
    series: [
      {
        name: '入睡时间',
        type: 'line',
        data: bedtimes,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#7eb8d8', width: 2 },
        itemStyle: { color: '#7eb8d8' },
        areaStyle: { color: 'rgba(126,184,216,0.12)' }
      },
      {
        name: '起床时间',
        type: 'line',
        data: wakeTimes,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#67c28a', width: 2 },
        itemStyle: { color: '#67c28a' },
        areaStyle: { color: 'rgba(103,194,138,0.12)' }
      },
      {
        name: '睡眠评分',
        type: 'line',
        yAxisIndex: 1,
        data: scores,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#e6a23c', width: 2, type: 'dashed' },
        itemStyle: { color: '#e6a23c' }
      }
    ]
  }, true)
}

function renderPieChart() {
  if (!pieChartRef.value) return
  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value)
  }
  const r = todayRecord.value
  let deepSleep = 0, lightSleep = 0, awake = 0
  if (r) {
    deepSleep = r.deepSleep || 0
    lightSleep = r.lightSleep || 0
    const bedtime = dayjs(`${r.date} ${r.bedtime}`)
    const wakeTime = dayjs(`${r.date} ${r.wakeTime}`)
    let totalMin = wakeTime.diff(bedtime, 'minute')
    if (totalMin < 0) totalMin += 1440
    awake = Math.max(0, totalMin - deepSleep - lightSleep)
  }
  pieChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}分钟 ({d}%)'
    },
    legend: { bottom: 10, textStyle: { color: textColor.value } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%', color: textColor.value },
      data: [
        { value: deepSleep, name: '深睡', itemStyle: { color: '#5a9ab8' } },
        { value: lightSleep, name: '浅睡', itemStyle: { color: '#7eb8d8' } },
        { value: awake, name: '清醒', itemStyle: { color: '#d0e9f6' } }
      ]
    }]
  }, true)
}

function renderCaffeineChart() {
  if (!caffeineChartRef.value) return
  if (!caffeineChart) {
    caffeineChart = echarts.init(caffeineChartRef.value)
  }
  const days = getRangeDays()
  const dates = days.map(r => r.date.slice(5))
  const data = days.map(r => r.caffeineMg || 0)
  const maxVal = Math.max(store.goals.maxCaffeineMg, ...data, 50)

  caffeineChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        return `<div><b>${p.axisValue}</b><br/>咖啡因: ${p.value} mg</div>`
      }
    },
    grid: { left: 45, right: 20, bottom: 30, top: 25 },
    xAxis: { type: 'category', data: dates, axisLabel: { color: textColor.value } },
    yAxis: {
      type: 'value',
      name: 'mg',
      nameTextStyle: { color: textColor.value },
      axisLabel: { color: textColor.value },
      max: maxVal
    },
    series: [{
      type: 'bar',
      data: data,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: (params) => params.value > store.goals.maxCaffeineMg ? '#f56c6c' : '#b88265'
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: '#f56c6c', type: 'dashed', width: 1.5 },
        label: { color: '#f56c6c', position: 'end', formatter: '上限' },
        data: [{ yAxis: store.goals.maxCaffeineMg }]
      }
    }]
  }, true)
}

function renderScreenChart() {
  if (!screenChartRef.value) return
  if (!screenChart) {
    screenChart = echarts.init(screenChartRef.value)
  }
  const days = getRangeDays()
  const dates = days.map(r => r.date.slice(5))
  const data = days.map(r => r.screenMin || 0)
  const maxVal = Math.max(store.goals.maxScreenMin, ...data, 100)

  screenChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        const h = Math.floor(p.value / 60)
        const m = p.value % 60
        return `<div><b>${p.axisValue}</b><br/>用眼: ${h}h ${m}m (${p.value}min)</div>`
      }
    },
    grid: { left: 45, right: 20, bottom: 30, top: 25 },
    xAxis: { type: 'category', data: dates, axisLabel: { color: textColor.value } },
    yAxis: {
      type: 'value',
      name: '分钟',
      nameTextStyle: { color: textColor.value },
      axisLabel: { color: textColor.value },
      max: maxVal
    },
    series: [{
      type: 'bar',
      data: data,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: (params) => params.value > store.goals.maxScreenMin ? '#f56c6c' : '#f59e9e'
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: '#f56c6c', type: 'dashed', width: 1.5 },
        label: { color: '#f56c6c', position: 'end', formatter: '上限' },
        data: [{ yAxis: store.goals.maxScreenMin }]
      }
    }]
  }, true)
}

function getScoreColor(score) {
  if (score >= 80) return '#2b6cb0'
  if (score >= 60) return '#7eb8d8'
  if (score >= 40) return '#e6a23c'
  return '#f56c6c'
}

function renderHeatmapChart() {
  if (!heatmapChartRef.value) return
  if (!heatmapChart) {
    heatmapChart = echarts.init(heatmapChartRef.value)
  }

  const year = heatmapYear.value
  const yearRecords = store.getRecordsByYear(year)
  const recordMap = {}
  yearRecords.forEach(r => { recordMap[r.date] = r })

  const heatmapData = yearRecords.map(r => [r.date, store.calcSleepScore(r)])
  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  heatmapChart.setOption({
    tooltip: {
      formatter(params) {
        const dateStr = params.value[0]
        const score = params.value[1]
        const d = dayjs(dateStr)
        const record = recordMap[dateStr]
        const weekday = weekdayNames[d.day()]
        let html = `<div style="font-size:13px;line-height:1.6">`
        html += `<div style="font-weight:700;margin-bottom:4px">${d.format('YYYY年MM月DD日')} ${weekday}</div>`
        const color = getScoreColor(score)
        html += `<div>睡眠评分：<span style="color:${color};font-weight:700">${score}</span> 分</div>`
        if (record) {
          html += `<div>入睡：${record.bedtime}　起床：${record.wakeTime}</div>`
          html += `<div>深睡：${record.deepSleep}min　浅睡：${record.lightSleep}min</div>`
          html += `<div>咖啡因：${record.caffeineMg || 0}mg　用眼：${record.screenMin || 0}min</div>`
        }
        html += `</div>`
        return html
      }
    },
    visualMap: {
      min: 0,
      max: 100,
      type: 'piecewise',
      show: false,
      pieces: [
        { min: 0, max: 39, color: '#f56c6c' },
        { min: 40, max: 59, color: '#e6a23c' },
        { min: 60, max: 79, color: '#7eb8d8' },
        { min: 80, max: 100, color: '#2b6cb0' }
      ]
    },
    calendar: {
      top: 20,
      left: 45,
      right: 25,
      bottom: 10,
      range: year,
      cellSize: ['auto', 13],
      splitLine: { show: true, lineStyle: { color: themeStore.isDark ? '#2a3040' : '#eef4f8' } },
      itemStyle: {
        borderWidth: 2,
        borderColor: themeStore.isDark ? '#1a1f2e' : '#fff'
      },
      yearLabel: { show: false },
      dayLabel: {
        firstDay: 1,
        color: textColor.value,
        fontSize: 11,
        nameMap: ['日', '一', '二', '三', '四', '五', '六']
      },
      monthLabel: {
        color: textColor.value,
        fontSize: 11,
        nameMap: 'cn'
      }
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: heatmapData,
      itemStyle: {
        borderColor: themeStore.isDark ? '#1a1f2e' : '#fff',
        borderWidth: 2,
        borderRadius: 2
      }
    }]
  }, true)
}

function renderAll() {
  nextTick(() => {
    renderTrendChart()
    renderPieChart()
    renderCaffeineChart()
    renderScreenChart()
    renderHeatmapChart()
  })
}

function handleResize() {
  trendChart?.resize()
  pieChart?.resize()
  caffeineChart?.resize()
  screenChart?.resize()
  heatmapChart?.resize()
}

function handleExportPdf() {
  window.dispatchEvent(new CustomEvent('export-pdf'))
}

watch(chartRange, () => { renderAll() })
watch(heatmapYear, () => { nextTick(renderHeatmapChart) })
watch(() => store.records, () => { renderAll() }, { deep: true })
watch(() => store.goals, () => { renderAll() }, { deep: true })
watch(() => themeStore.isDark, () => {
  setTimeout(() => {
    trendChart?.dispose()
    pieChart?.dispose()
    caffeineChart?.dispose()
    screenChart?.dispose()
    heatmapChart?.dispose()
    trendChart = null
    pieChart = null
    caffeineChart = null
    screenChart = null
    heatmapChart = null
    renderAll()
  }, 50)
})

onMounted(() => {
  renderAll()
  window.addEventListener('resize', handleResize)

  if (shouldShowNoonReminder(store.records)) {
    const text = getNoonReminderText(store.records)
    ElNotification({
      title: '作息趋势提醒',
      message: text,
      type: 'warning',
      duration: 8000,
      position: 'top-right'
    })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  pieChart?.dispose()
  caffeineChart?.dispose()
  screenChart?.dispose()
  heatmapChart?.dispose()
})
</script>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.diagnosis-alert-card {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.05), rgba(230, 162, 60, 0.05));
  border: 1px solid rgba(245, 108, 108, 0.2);

  .diagnosis-alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .alert-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 700;
      color: var(--ct-text);
    }
  }

  .diagnosis-alert-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;

    .alert-item {
      padding: 14px;
      border-radius: 10px;
      background: var(--ct-surface);
      border-left: 4px solid;

      &.high {
        border-left-color: #f56c6c;
        background: rgba(245, 108, 108, 0.05);
      }
      &.medium {
        border-left-color: #e6a23c;
        background: rgba(230, 162, 60, 0.05);
      }

      .alert-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;

        .alert-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--ct-text);
        }

        .alert-confidence {
          font-size: 12px;
          color: var(--ct-text-secondary);
          font-weight: 500;
        }
      }

      .alert-suggestion {
        font-size: 13px;
        color: var(--ct-text-secondary);
        margin: 0 0 8px 0;
        line-height: 1.5;
      }

      .alert-matched {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .matched-tag {
          font-size: 11px;
          padding: 3px 8px;
          background: var(--ct-primary-lighter);
          color: var(--ct-primary-dark);
          border-radius: 4px;
        }
      }
    }
  }

  .diagnosis-disclaimer {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: rgba(144, 147, 153, 0.1);
    border-radius: 8px;
    font-size: 12px;
    color: var(--ct-text-secondary);
    line-height: 1.5;

    .el-icon {
      color: #909399;
      flex-shrink: 0;
    }
  }
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .page-title {
    font-size: 20px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ct-text);

    .el-icon { color: var(--ct-primary); }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;

  .stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;

    .stat-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }

    .stat-info {
      .stat-value {
        font-size: 16px;
        font-weight: 700;
        color: var(--ct-text);
      }
      .stat-label {
        font-size: 11px;
        color: var(--ct-text-secondary);
        margin-top: 2px;
      }
    }
  }
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  .chart-card {
    .chart-container {
      height: 260px;
    }
  }
}

.ct-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  .advice-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .advice-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.5;

      &.good {
        background: rgba(103, 194, 138, 0.1);
        color: #67c28a;
      }
      &.warn {
        background: rgba(230, 162, 60, 0.1);
        color: #e6a23c;
      }
      &.info {
        background: rgba(126, 184, 216, 0.1);
        color: #7eb8d8;
      }
    }
  }

  .goal-list {
    display: flex;
    flex-direction: column;
    gap: 14px;

    .goal-item {
      .goal-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;

        .goal-name { font-size: 13px; color: var(--ct-text-secondary); }
        .goal-percent {
          font-size: 13px;
          font-weight: 600;
          &.good { color: #67c28a; }
          &.warn { color: #e6a23c; }
          &.bad { color: #f56c6c; }
        }
      }
    }
  }
}

.heatmap-card {
  .heatmap-chart-container {
    height: 180px;
  }

  .heatmap-stats {
    display: flex;
    justify-content: space-around;
    padding-top: 14px;
    border-top: 1px solid var(--ct-border);
    margin-top: 8px;

    .heatmap-stat-item {
      text-align: center;

      .heatmap-stat-value {
        display: block;
        font-size: 20px;
        font-weight: 700;
        color: var(--ct-primary);
      }

      .heatmap-stat-label {
        display: block;
        font-size: 11px;
        color: var(--ct-text-secondary);
        margin-top: 4px;
      }
    }
  }
}
</style>
