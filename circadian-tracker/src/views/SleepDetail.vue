<template>
  <div class="sleep-detail">
    <h2 class="page-title">
      <el-icon><Moon /></el-icon>
      睡眠详情面板
    </h2>

    <div class="sleep-top">
      <div class="ct-card score-card">
        <div class="score-ring-large">
          <svg viewBox="0 0 120 120">
            <circle class="ring-bg" cx="60" cy="60" r="52" />
            <circle class="ring-fill" cx="60" cy="60" r="52"
                    :stroke-dasharray="`${avgScore * 3.27} 327`"
                    :class="avgScoreClass" />
          </svg>
          <div class="ring-label">
            <div class="ring-value" :class="avgScoreClass">{{ avgScore }}</div>
            <div class="ring-text">平均评分</div>
          </div>
        </div>
        <div class="score-meta">
          <div class="meta-item">
            <span class="meta-label">近7天最高</span>
            <span class="meta-val good">{{ weekMaxScore }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">近7天最低</span>
            <span class="meta-val bad">{{ weekMinScore }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">记录天数</span>
            <span class="meta-val">{{ last7.length }}</span>
          </div>
        </div>
      </div>

      <div class="ct-card phase-card">
        <div class="ct-title">
          <el-icon><Sunrise /></el-icon>
          睡眠时相分析
          <el-select
            v-model="filterTag"
            placeholder="标签筛选"
            clearable
            size="small"
            style="margin-left:auto; width: 140px"
          >
            <el-option
              v-for="tag in store.tags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </div>
        <div class="phase-bars">
          <div class="phase-bar" v-for="record in last7" :key="record.date">
            <span class="phase-date">{{ record.date.slice(5) }}</span>
            <div class="phase-track">
              <div class="phase-deep" :style="{ width: deepPercent(record) + '%' }"></div>
              <div class="phase-light" :style="{ width: lightPercent(record) + '%' }"></div>
              <div class="phase-awake" :style="{ width: awakePercent(record) + '%' }"></div>
            </div>
            <div class="phase-tags" v-if="record.tags && record.tags.length > 0">
              <el-tag
                v-for="t in record.tags.slice(0, 1)"
                :key="t"
                size="small"
                type="primary"
                effect="light"
                round
                class="phase-tag"
                :title="record.tags.join(', ')"
              >{{ t }}{{ record.tags.length > 1 ? '+' + (record.tags.length - 1) : '' }}</el-tag>
            </div>
            <span class="phase-score" :class="getScoreClass(store.calcSleepScore(record))">
              {{ store.calcSleepScore(record) }}
            </span>
          </div>
        </div>
        <div class="phase-legend">
          <span class="legend-item"><i class="dot deep"></i>深睡</span>
          <span class="legend-item"><i class="dot light"></i>浅睡</span>
          <span class="legend-item"><i class="dot awake"></i>清醒</span>
        </div>
      </div>
    </div>

    <div class="sleep-charts">
      <div class="ct-card">
        <div class="ct-title">
          <el-icon><TrendCharts /></el-icon>
          作息时间波动
        </div>
        <div class="chart-box" ref="sleepChartRef"></div>
      </div>
      <div class="ct-card">
        <div class="ct-title">
          <el-icon><Histogram /></el-icon>
          影响因素分析
        </div>
        <div class="chart-box" ref="factorChartRef"></div>
      </div>
    </div>

    <div class="mood-analysis-section">
      <div class="ct-card">
        <div class="ct-title">
          <el-icon><TrendCharts /></el-icon>
          心情与睡眠评分相关性
        </div>
        <div class="chart-box" ref="moodScatterRef"></div>
      </div>
      <div class="ct-card">
        <div class="ct-title">
          <el-icon><Histogram /></el-icon>
          睡前活动与次日评分
        </div>
        <div class="chart-box" ref="activityBoxplotRef"></div>
      </div>
    </div>

    <div class="ct-card goal-setting">
      <div class="ct-title">
        <el-icon><Setting /></el-icon>
        自定义作息目标
      </div>
      <div class="goal-form">
        <div class="goal-field">
          <label>目标就寝时间</label>
          <el-time-picker v-model="goals.targetBedtime" format="HH:mm" value-format="HH:mm" :clearable="false" />
        </div>
        <div class="goal-field">
          <label>目标起床时间</label>
          <el-time-picker v-model="goals.targetWakeTime" format="HH:mm" value-format="HH:mm" :clearable="false" />
        </div>
        <div class="goal-field">
          <label>目标睡眠时长</label>
          <el-input-number v-model="goals.targetSleepHours" :min="4" :max="12" :step="0.5" />
          <span class="unit">小时</span>
        </div>
        <div class="goal-field">
          <label>目标深睡比例</label>
          <el-input-number v-model="goals.targetDeepRatio" :min="0.1" :max="0.6" :step="0.05" :precision="2" />
        </div>
        <div class="goal-field">
          <label>咖啡因上限</label>
          <el-input-number v-model="goals.maxCaffeineMg" :min="0" :max="500" :step="25" />
          <span class="unit">mg</span>
        </div>
        <div class="goal-field">
          <label>用眼时长上限</label>
          <el-input-number v-model="goals.maxScreenMin" :min="0" :max="960" :step="30" />
          <span class="unit">分钟</span>
        </div>
      </div>
      <div class="goal-actions">
        <el-button type="primary" @click="saveGoals" round>保存目标</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { useScheduleStore } from '@/store'

const store = useScheduleStore()
const sleepChartRef = ref(null)
const factorChartRef = ref(null)
const moodScatterRef = ref(null)
const activityBoxplotRef = ref(null)
let sleepChart = null
let factorChart = null
let moodScatterChart = null
let activityBoxplotChart = null

const filterTag = ref(null)

const moodEmojiMap = {
  happy: { label: '愉快', emoji: '😊', value: 6 },
  calm: { label: '平静', emoji: '😌', value: 5 },
  excited: { label: '兴奋', emoji: '🤩', value: 4 },
  anxious: { label: '焦虑', emoji: '😰', value: 2 },
  sad: { label: '低落', emoji: '😔', value: 1 },
  angry: { label: '烦躁', emoji: '😤', value: 3 }
}

const activityLabelMap = {
  phone: '刷手机',
  reading: '看书',
  exercise: '运动',
  shower: '洗澡',
  meditation: '冥想',
  other: '其他'
}

const goals = reactive({
    targetBedtime: store.goals?.targetBedtime || '23:00',
    targetWakeTime: store.goals?.targetWakeTime || '07:00',
    targetSleepHours: store.goals?.targetSleepHours || 8,
    targetDeepRatio: store.goals?.targetDeepRatio || 0.25,
    maxCaffeineMg: store.goals?.maxCaffeineMg || 200,
    maxScreenMin: store.goals?.maxScreenMin || 480
  })

const last7 = computed(() => store.getLast7Days(filterTag.value))
const last30 = computed(() => store.getLast30Days(filterTag.value))

const avgScore = computed(() => {
  const days = last7.value
  if (days.length === 0) return 0
  return Math.round(days.reduce((sum, r) => sum + store.calcSleepScore(r), 0) / days.length)
})

const avgScoreClass = computed(() => {
  const s = avgScore.value
  if (s >= 80) return 'good'
  if (s >= 60) return 'warn'
  return 'bad'
})

const weekMaxScore = computed(() => {
  const days = last7.value
  if (days.length === 0) return 0
  return Math.max(...days.map(r => store.calcSleepScore(r)))
})

const weekMinScore = computed(() => {
  const days = last7.value
  if (days.length === 0) return 0
  return Math.min(...days.map(r => store.calcSleepScore(r)))
})

function calcTotalMin(r) {
    if (!r || !r.date || !r.bedtime || !r.wakeTime) return 1
    try {
      const bedtime = dayjs(`${r.date} ${r.bedtime}`)
      const wakeTime = dayjs(`${r.date} ${r.wakeTime}`)
      let total = wakeTime.diff(bedtime, 'minute')
      if (total < 0) total += 1440
      return total || 1
    } catch (e) {
      return 1
    }
  }

  function deepPercent(r) {
    if (!r || typeof r.deepSleep !== 'number') return 0
    const total = calcTotalMin(r)
    return ((r.deepSleep || 0) / total) * 100
  }

  function lightPercent(r) {
    if (!r || typeof r.lightSleep !== 'number') return 0
    const total = calcTotalMin(r)
    return ((r.lightSleep || 0) / total) * 100
  }

  function awakePercent(r) {
    if (!r) return 0
    const total = calcTotalMin(r)
    const deep = r.deepSleep || 0
    const light = r.lightSleep || 0
    const awake = Math.max(0, total - deep - light)
    return (awake / total) * 100
  }

function getScoreClass(score) {
  if (score >= 80) return 'good'
  if (score >= 60) return 'warn'
  return 'bad'
}

async function saveGoals() {
  await store.saveGoals({ ...goals })
  ElMessage.success('作息目标已保存')
}

function renderSleepChart() {
    if (!sleepChartRef.value) return
    if (!sleepChart) sleepChart = echarts.init(sleepChartRef.value)

    const days = last7.value || []
    if (days.length === 0) {
      sleepChart.clear()
      return
    }

    const dates = days.map(r => r.date ? r.date.slice(5) : '')
    const bedtimes = days.map(r => {
      try {
        if (!r.bedtime) return 0
        const [h, m] = r.bedtime.split(':').map(Number)
        return h + m / 60
      } catch (e) { return 0 }
    })
    const wakeTimes = days.map(r => {
      try {
        if (!r.wakeTime) return 0
        const [h, m] = r.wakeTime.split(':').map(Number)
        return h + m / 60
      } catch (e) { return 0 }
    })

  sleepChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['入睡', '起床'], textStyle: { color: '#7f8c9b' } },
    grid: { left: 40, right: 20, bottom: 30, top: 30 },
    xAxis: { type: 'category', data: dates, axisLabel: { color: '#7f8c9b' } },
    yAxis: {
      type: 'value', min: 0, max: 24, name: '时刻',
      axisLabel: {
        color: '#7f8c9b',
        formatter: (v) => `${Math.floor(v)}:00`
      }
    },
    series: [
      {
        name: '入睡', type: 'line', data: bedtimes, smooth: true,
        areaStyle: { color: 'rgba(126,184,216,0.15)' },
        lineStyle: { color: '#7eb8d8', width: 2 },
        itemStyle: { color: '#7eb8d8' }
      },
      {
        name: '起床', type: 'line', data: wakeTimes, smooth: true,
        areaStyle: { color: 'rgba(103,194,138,0.15)' },
        lineStyle: { color: '#67c28a', width: 2 },
        itemStyle: { color: '#67c28a' }
      }
    ]
  })
}

function renderFactorChart() {
    if (!factorChartRef.value) return
    if (!factorChart) factorChart = echarts.init(factorChartRef.value)

    const days = last7.value || []
    if (days.length === 0) {
      factorChart.clear()
      return
    }

    const dates = days.map(r => r.date ? r.date.slice(5) : '')

  factorChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['咖啡因(mg)', '用眼(min)', '小憩(min)'], textStyle: { color: '#7f8c9b' } },
    grid: { left: 40, right: 20, bottom: 30, top: 30 },
    xAxis: { type: 'category', data: dates, axisLabel: { color: '#7f8c9b' } },
    yAxis: { type: 'value', axisLabel: { color: '#7f8c9b' } },
    series: [
      { name: '咖啡因(mg)', type: 'bar', data: days.map(r => r.caffeineMg || 0), itemStyle: { color: '#b88265', borderRadius: [4, 4, 0, 0] } },
      { name: '用眼(min)', type: 'bar', data: days.map(r => r.screenMin || 0), itemStyle: { color: '#f56c6c', borderRadius: [4, 4, 0, 0] } },
      { name: '小憩(min)', type: 'bar', data: days.map(r => r.napMin || 0), itemStyle: { color: '#7eb8d8', borderRadius: [4, 4, 0, 0] } }
    ]
  })
}

function renderMoodScatterChart() {
    if (!moodScatterRef.value) return
    if (!moodScatterChart) moodScatterChart = echarts.init(moodScatterRef.value)

    const days = (last30.value || []).filter(r => r && r.preSleepMood && moodEmojiMap[r.preSleepMood])
    if (days.length === 0) {
      moodScatterChart.clear()
      return
    }

    const scatterData = days.map(r => {
      try {
        return [
          moodEmojiMap[r.preSleepMood].value,
          store.calcSleepScore(r),
          r.date
        ]
      } catch (e) { return [0, 0, r.date || ''] }
    })

  const moodCategories = Object.entries(moodEmojiMap).map(([key, val]) => ({
    value: val.value,
    label: val.emoji + ' ' + val.label
  })).sort((a, b) => a.value - b.value)

  moodScatterChart.setOption({
    tooltip: {
      formatter: (params) => {
        const data = params.data
        const moodEntry = Object.entries(moodEmojiMap).find(([_, v]) => v.value === data[0])
        const moodLabel = moodEntry ? moodEntry[1].emoji + ' ' + moodEntry[1].label : ''
        return `日期：${data[2]}<br/>心情：${moodLabel}<br/>睡眠评分：${data[1]}`
      }
    },
    grid: { left: 60, right: 30, bottom: 60, top: 30 },
    xAxis: {
      type: 'value',
      min: 0,
      max: 7,
      name: '睡前心情',
      nameTextStyle: { color: '#7f8c9b' },
      axisLabel: {
        color: '#7f8c9b',
        formatter: (value) => {
          const mood = moodCategories.find(m => m.value === value)
          return mood ? mood.label : ''
        },
        interval: 1
      },
      splitLine: { lineStyle: { color: 'rgba(127,140,155,0.15)' } }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '睡眠评分',
      nameTextStyle: { color: '#7f8c9b' },
      axisLabel: { color: '#7f8c9b' },
      splitLine: { lineStyle: { color: 'rgba(127,140,155,0.15)' } }
    },
    series: [{
      type: 'scatter',
      data: scatterData,
      symbolSize: 16,
      itemStyle: {
        color: new echarts.graphic.RadialGradient(0.4, 0.3, 1, [
          { offset: 0, color: 'rgba(126,184,216,0.8)' },
          { offset: 1, color: 'rgba(126,184,216,0.4)' }
        ]),
        shadowBlur: 10,
        shadowColor: 'rgba(126,184,216,0.3)'
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.RadialGradient(0.4, 0.3, 1, [
            { offset: 0, color: 'rgba(103,194,138,0.9)' },
            { offset: 1, color: 'rgba(103,194,138,0.5)' }
          ])
        }
      }
    }]
  })
}

function renderActivityBoxplotChart() {
    if (!activityBoxplotRef.value) return
    if (!activityBoxplotChart) activityBoxplotChart = echarts.init(activityBoxplotRef.value)

    const days = last30.value || []
    if (days.length === 0) {
      activityBoxplotChart.clear()
      return
    }

    const activityScoresMap = {}

    days.forEach((r, idx) => {
      if (!r || !r.preSleepActivities || r.preSleepActivities.length === 0) return
      const nextDay = days[idx + 1]
      let score = 0
      try {
        score = nextDay ? store.calcSleepScore(nextDay) : store.calcSleepScore(r)
      } catch (e) { score = 0 }
      r.preSleepActivities.forEach(activity => {
        if (!activityScoresMap[activity]) {
          activityScoresMap[activity] = []
        }
        activityScoresMap[activity].push(score)
      })
    })

  const activityList = Object.keys(activityScoresMap).filter(a => activityScoresMap[a].length >= 2)
  const boxData = activityList.map(activity => {
    const scores = activityScoresMap[activity].sort((a, b) => a - b)
    const n = scores.length
    const q1 = scores[Math.floor(n * 0.25)]
    const q2 = scores[Math.floor(n * 0.5)]
    const q3 = scores[Math.floor(n * 0.75)]
    const min = scores[0]
    const max = scores[n - 1]
    return [min, q1, q2, q3, max]
  })

  const xAxisData = activityList.map(a => activityLabelMap[a] || a)

  activityBoxplotChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const data = params.data
        return `${params.name}<br/>最小值：${data[0]}<br/>下四分位数：${data[1]}<br/>中位数：${data[2]}<br/>上四分位数：${data[3]}<br/>最大值：${data[4]}`
      }
    },
    grid: { left: 60, right: 30, bottom: 50, top: 30 },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: { color: '#7f8c9b', rotate: 0 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '次日睡眠评分',
      nameTextStyle: { color: '#7f8c9b' },
      axisLabel: { color: '#7f8c9b' },
      splitLine: { lineStyle: { color: 'rgba(127,140,155,0.15)' } }
    },
    series: [{
      type: 'boxplot',
      data: boxData,
      itemStyle: {
        color: 'rgba(126,184,216,0.7)',
        borderColor: '#5a9ab8',
        borderWidth: 2
      },
      emphasis: {
        itemStyle: {
          color: 'rgba(103,194,138,0.8)',
          borderColor: '#67c28a'
        }
      }
    }]
  })
}

watch([filterTag, () => store.records], () => {
  nextTick(() => {
    renderSleepChart()
    renderFactorChart()
    renderMoodScatterChart()
    renderActivityBoxplotChart()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    renderSleepChart()
    renderFactorChart()
    renderMoodScatterChart()
    renderActivityBoxplotChart()
  })
  window.addEventListener('resize', () => {
    sleepChart?.resize()
    factorChart?.resize()
    moodScatterChart?.resize()
    activityBoxplotChart?.resize()
  })
})
</script>

<style lang="scss" scoped>
.sleep-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .page-title {
    font-size: 20px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ct-text);
    .el-icon { color: var(--ct-primary); }
  }
}

.sleep-top {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;

  .score-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;

    .score-ring-large {
      position: relative;
      width: 140px;
      height: 140px;

      svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .ring-bg {
        fill: none;
        stroke: var(--ct-border);
        stroke-width: 8;
      }

      .ring-fill {
        fill: none;
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dasharray 0.8s ease;
        &.good { stroke: #67c28a; }
        &.warn { stroke: #e6a23c; }
        &.bad { stroke: #f56c6c; }
      }

      .ring-label {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;

        .ring-value {
          font-size: 32px;
          font-weight: 800;
          &.good { color: #67c28a; }
          &.warn { color: #e6a23c; }
          &.bad { color: #f56c6c; }
        }
        .ring-text {
          font-size: 11px;
          color: var(--ct-text-secondary);
        }
      }
    }

    .score-meta {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .meta-item {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        .meta-label { color: var(--ct-text-secondary); }
        .meta-val { font-weight: 600; color: var(--ct-text); }
        .meta-val.good { color: #67c28a; }
        .meta-val.bad { color: #f56c6c; }
      }
    }
  }

  .phase-card {
    .phase-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .phase-bar {
        display: flex;
        align-items: center;
        gap: 12px;

        .phase-date {
          font-size: 12px;
          color: var(--ct-text-secondary);
          width: 40px;
          flex-shrink: 0;
        }

        .phase-track {
          flex: 1;
          height: 20px;
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          background: var(--ct-bg);

          .phase-deep {
            background: #5a9ab8;
            transition: width 0.3s;
          }
          .phase-light {
            background: #7eb8d8;
            transition: width 0.3s;
          }
          .phase-awake {
            background: #d0e9f6;
            transition: width 0.3s;
          }
        }

        .phase-tags {
          width: 58px;
          flex-shrink: 0;
          display: flex;
          justify-content: center;

          .phase-tag {
            transform: scale(0.82);
          }
        }

        .phase-score {
          font-size: 13px;
          font-weight: 700;
          width: 28px;
          text-align: right;
          &.good { color: #67c28a; }
          &.warn { color: #e6a23c; }
          &.bad { color: #f56c6c; }
        }
      }
    }

    .phase-legend {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      font-size: 12px;
      color: var(--ct-text-secondary);

      .legend-item {
        display: flex;
        align-items: center;
        gap: 4px;

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          &.deep { background: #5a9ab8; }
          &.light { background: #7eb8d8; }
          &.awake { background: #d0e9f6; }
        }
      }
    }
  }
}

.sleep-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  .chart-box {
    height: 240px;
  }
}

.mood-analysis-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  .chart-box {
    height: 260px;
  }
}

.goal-setting {
  .goal-form {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;

    .goal-field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 12px;
        color: var(--ct-text-secondary);
      }

      .unit {
        font-size: 12px;
        color: var(--ct-text-secondary);
        margin-top: 4px;
      }
    }
  }

  .goal-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
