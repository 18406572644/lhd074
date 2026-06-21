<template>
  <div class="smart-recommend" v-if="recommendation && recommendation.available">
    <div class="ct-card recommend-card">
      <div class="ct-title">
        <el-icon><MagicStick /></el-icon>
        <span>智能目标推荐</span>
        <el-tag size="small" type="primary" effect="plain" round style="margin-left: 8px">
          基于{{ recommendation.stats.sampleDays }}天数据
        </el-tag>
        <el-tag
          v-if="store.goals.smartRecommend?.enabled"
          size="small"
          type="success"
          effect="dark"
          round
          style="margin-left: 4px"
        >
          已启用
        </el-tag>
      </div>

      <div class="recommend-body">
        <div class="percentile-tabs">
          <div
            class="percentile-tab"
            :class="{ active: activePercentile === 'p50' }"
            @click="activePercentile = 'p50'"
          >
            <div class="tab-label">P50 适中</div>
            <div class="tab-desc">50%可达目标</div>
          </div>
          <div
            class="percentile-tab"
            :class="{ active: activePercentile === 'p75' }"
            @click="activePercentile = 'p75'"
          >
            <div class="tab-label">P75 进取</div>
            <div class="tab-desc">75%可达目标</div>
          </div>
        </div>

        <div class="recommend-values">
          <div class="recommend-item">
            <div class="item-icon bedtime-icon">
              <el-icon><Moon /></el-icon>
            </div>
            <div class="item-info">
              <div class="item-label">推荐入睡时间</div>
              <div class="item-value">{{ currentPreset.targetBedtime }}</div>
              <div class="item-hint">
                当前目标 {{ store.goals.targetBedtime }}
                <span v-if="bedtimeDiff !== 0" class="diff" :class="bedtimeDiff > 0 ? 'later' : 'earlier'">
                  {{ bedtimeDiff > 0 ? '+' : '' }}{{ formatDiff(bedtimeDiff) }}
                </span>
              </div>
            </div>
          </div>
          <div class="recommend-item">
            <div class="item-icon wake-icon">
              <el-icon><Sunny /></el-icon>
            </div>
            <div class="item-info">
              <div class="item-label">推荐起床时间</div>
              <div class="item-value">{{ currentPreset.targetWakeTime }}</div>
              <div class="item-hint">
                当前目标 {{ store.goals.targetWakeTime }}
              </div>
            </div>
          </div>
          <div class="recommend-item">
            <div class="item-icon sleep-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="item-info">
              <div class="item-label">推荐睡眠时长</div>
              <div class="item-value">{{ currentPreset.targetSleepHours }}h</div>
              <div class="item-hint">
                当前目标 {{ store.goals.targetSleepHours }}h
              </div>
            </div>
          </div>
        </div>

        <div class="recommend-stats">
          <div class="stat-chip">
            <span class="chip-label">入睡标准差</span>
            <span class="chip-value">{{ recommendation.stats.bedtimeStd }}m</span>
          </div>
          <div class="stat-chip">
            <span class="chip-label">时长标准差</span>
            <span class="chip-value">{{ recommendation.stats.sleepStd }}h</span>
          </div>
        </div>

        <div class="recommend-actions">
          <el-button type="primary" round @click="handleApply" :disabled="applying">
            <el-icon><Check /></el-icon>
            应用为目标
          </el-button>
          <el-button round @click="handleDismiss">
            暂不应用
          </el-button>
        </div>
      </div>
    </div>

    <div class="ct-card curve-card" v-if="achievementCurve">
      <div class="ct-title">
        <el-icon><TrendCharts /></el-icon>
        <span>达成率预测曲线</span>
        <el-tag
          size="small"
          :type="achievementCurve.trendDirection === 'improving' ? 'success' : achievementCurve.trendDirection === 'declining' ? 'danger' : 'info'"
          effect="plain"
          round
          style="margin-left: 8px"
        >
          {{ trendLabel }}
        </el-tag>
      </div>

      <div class="curve-summary">
        <div class="summary-item">
          <span class="summary-value" :class="getAchClass(achievementCurve.avg7)">{{ achievementCurve.avg7 }}%</span>
          <span class="summary-label">近7日均值</span>
        </div>
        <div class="summary-item">
          <span class="summary-value" :class="getAchClass(achievementCurve.avg3)">{{ achievementCurve.avg3 }}%</span>
          <span class="summary-label">近3日均值</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">{{ achievementCurve.predictions[6]?.achievement || '--' }}%</span>
          <span class="summary-label">7日预测</span>
        </div>
      </div>

      <div class="curve-chart" ref="curveChartRef"></div>
    </div>
  </div>

  <div class="ct-card recommend-card recommend-empty" v-else>
    <div class="ct-title">
      <el-icon><MagicStick /></el-icon>
      <span>智能目标推荐</span>
    </div>
    <div class="empty-hint">
      <el-icon :size="32" color="var(--ct-text-secondary)"><WarningFilled /></el-icon>
      <p>{{ recommendation?.reason || '至少需要7天数据才能生成智能推荐' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { useScheduleStore } from '@/store'
import { calcSmartRecommendation, calcAchievementPredictionCurve } from '@/utils/prediction'
import dayjs from 'dayjs'

const props = defineProps({
  records: { type: Array, required: true },
  calcSleepScore: { type: Function, required: true },
  goals: { type: Object, required: true }
})

const emit = defineEmits(['applied'])

const store = useScheduleStore()
const activePercentile = ref('p50')
const applying = ref(false)
const dismissed = ref(false)
const curveChartRef = ref(null)
let curveChart = null

const recommendation = computed(() => {
  if (dismissed.value) return null
  return calcSmartRecommendation(props.records)
})

const achievementCurve = computed(() => {
  return calcAchievementPredictionCurve(props.records, props.calcSleepScore, props.goals)
})

const currentPreset = computed(() => {
  if (!recommendation.value || !recommendation.value.available) {
    return { targetBedtime: '--:--', targetWakeTime: '--:--', targetSleepHours: 0 }
  }
  return recommendation.value[activePercentile.value] || recommendation.value.p50
})

const bedtimeDiff = computed(() => {
  if (!recommendation.value || !recommendation.value.available) return 0
  const recBed = currentPreset.value.targetBedtime
  const curBed = store.goals.targetBedtime
  const [rh, rm] = recBed.split(':').map(Number)
  const [ch, cm] = curBed.split(':').map(Number)
  let recMin = rh * 60 + rm
  let curMin = ch * 60 + cm
  if (recMin < 12 * 60) recMin += 24 * 60
  if (curMin < 12 * 60) curMin += 24 * 60
  return recMin - curMin
})

const trendLabel = computed(() => {
  const d = achievementCurve.value?.trendDirection
  if (d === 'improving') return '趋势向好'
  if (d === 'declining') return '趋势走低'
  return '趋势平稳'
})

function formatDiff(minutes) {
  const abs = Math.abs(minutes)
  if (abs >= 60) {
    const h = Math.floor(abs / 60)
    const m = abs % 60
    return m > 0 ? `${h}h${m}m` : `${h}h`
  }
  return `${abs}m`
}

function getAchClass(val) {
  if (val >= 75) return 'good'
  if (val >= 50) return 'warn'
  return 'bad'
}

async function handleApply() {
  if (!recommendation.value || !recommendation.value.available) return
  try {
    await ElMessageBox.confirm(
      `将应用${activePercentile.value === 'p50' ? 'P50适中' : 'P75进取'}方案：入睡 ${currentPreset.value.targetBedtime}、起床 ${currentPreset.value.targetWakeTime}、时长 ${currentPreset.value.targetSleepHours}h，是否继续？`,
      '应用智能推荐',
      { confirmButtonText: '应用', cancelButtonText: '取消', type: 'info' }
    )
    applying.value = true
    const ok = await store.applySmartRecommendation(recommendation.value, activePercentile.value)
    if (ok) {
      ElMessage.success('智能推荐目标已应用')
      emit('applied', activePercentile.value)
    } else {
      ElMessage.error('应用失败，请重试')
    }
  } catch {
  } finally {
    applying.value = false
  }
}

function handleDismiss() {
  dismissed.value = true
}

function renderCurveChart() {
  if (!curveChartRef.value || !achievementCurve.value) return
  if (!curveChart) {
    curveChart = echarts.init(curveChartRef.value)
  }

  const data = achievementCurve.value
  const historyDates = data.history.map(d => d.date.slice(5))
  const historyValues = data.history.map(d => d.achievement)
  const predictionDates = data.predictions.map((_, i) => `+${i + 1}d`)
  const predictionValues = data.predictions.map(d => d.achievement)

  const allDates = [...historyDates, ...predictionDates]
  const actualSeries = [...historyValues, ...new Array(predictionDates.length).fill(null)]
  const predictedSeries = [
    ...new Array(historyDates.length - 1).fill(null),
    historyValues[historyValues.length - 1],
    ...predictionValues
  ]

  const isDark = document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#8899aa' : '#7f8c9b'

  curveChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        let html = '<div style="font-size:12px">'
        params.forEach(p => {
          if (p.value !== null && p.value !== undefined) {
            html += `<div>${p.marker}${p.seriesName}: ${p.value}%</div>`
          }
        })
        html += '</div>'
        return html
      }
    },
    legend: { data: ['实际达成率', '预测达成率'], textStyle: { color: textColor, fontSize: 11 }, bottom: 0 },
    grid: { left: 40, right: 20, bottom: 35, top: 15 },
    xAxis: {
      type: 'category',
      data: allDates,
      axisLabel: {
        color: textColor,
        fontSize: 10,
        interval: Math.max(0, Math.floor(allDates.length / 8))
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: textColor, fontSize: 10, formatter: '{value}%' }
    },
    series: [
      {
        name: '实际达成率',
        type: 'line',
        data: actualSeries,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: '#7eb8d8', width: 2 },
        itemStyle: { color: '#7eb8d8' },
        areaStyle: { color: 'rgba(126,184,216,0.1)' }
      },
      {
        name: '预测达成率',
        type: 'line',
        data: predictedSeries,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 5,
        lineStyle: { color: '#e6a23c', width: 2, type: 'dashed' },
        itemStyle: { color: '#e6a23c' },
        areaStyle: { color: 'rgba(230,162,60,0.06)' }
      }
    ]
  }, true)
}

function handleResize() {
  curveChart?.resize()
}

watch(achievementCurve, () => { nextTick(renderCurveChart) }, { deep: true })
watch(() => store.goals, () => { nextTick(renderCurveChart) }, { deep: true })

onMounted(() => {
  nextTick(renderCurveChart)
  window.addEventListener('resize', handleResize)

  if (store.shouldAutoCalibrate()) {
    const rec = calcSmartRecommendation(store.getLast30Days())
    if (rec && rec.available) {
      const percentile = store.goals.smartRecommend?.percentile || 'p50'
      store.applySmartRecommendation(rec, percentile)
      ElMessage.success('智能推荐目标已每周自动校准')
      emit('applied', percentile)
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  curveChart?.dispose()
  curveChart = null
})
</script>

<style lang="scss" scoped>
.smart-recommend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.recommend-card {
  .recommend-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
}

.recommend-empty {
  .empty-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px 0;

    p {
      font-size: 13px;
      color: var(--ct-text-secondary);
      text-align: center;
    }
  }
}

.percentile-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  .percentile-tab {
    padding: 12px 16px;
    border: 2px solid var(--ct-border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.25s ease;
    background: var(--ct-bg);

    &:hover {
      border-color: var(--ct-primary-light);
    }

    &.active {
      border-color: var(--ct-primary);
      background: var(--ct-primary-lighter);
      box-shadow: 0 2px 10px rgba(126, 184, 216, 0.2);
    }

    .tab-label {
      font-size: 14px;
      font-weight: 700;
      color: var(--ct-text);
    }

    .tab-desc {
      font-size: 11px;
      color: var(--ct-text-secondary);
      margin-top: 2px;
    }
  }
}

.recommend-values {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .recommend-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--ct-bg);
    border-radius: 8px;
    border: 1px solid var(--ct-border);

    .item-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;

      &.bedtime-icon { background: linear-gradient(135deg, #7eb8d8, #5a9ab8); }
      &.wake-icon { background: linear-gradient(135deg, #67c28a, #4ea06a); }
      &.sleep-icon { background: linear-gradient(135deg, #e6a23c, #c88530); }
    }

    .item-info {
      flex: 1;
      min-width: 0;

      .item-label {
        font-size: 11px;
        color: var(--ct-text-secondary);
      }

      .item-value {
        font-size: 18px;
        font-weight: 700;
        color: var(--ct-text);
      }

      .item-hint {
        font-size: 11px;
        color: var(--ct-text-secondary);
        display: flex;
        align-items: center;
        gap: 6px;

        .diff {
          font-weight: 600;
          font-size: 11px;
          &.later { color: var(--ct-danger); }
          &.earlier { color: var(--ct-success); }
        }
      }
    }
  }
}

.recommend-stats {
  display: flex;
  gap: 8px;

  .stat-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 16px;
    background: var(--ct-bg);
    border: 1px solid var(--ct-border);
    font-size: 11px;

    .chip-label { color: var(--ct-text-secondary); }
    .chip-value { font-weight: 600; color: var(--ct-text); }
  }
}

.recommend-actions {
  display: flex;
  gap: 10px;
  padding-top: 4px;
}

.curve-card {
  .curve-summary {
    display: flex;
    gap: 20px;
    margin-bottom: 12px;

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;

      .summary-value {
        font-size: 20px;
        font-weight: 700;
        color: var(--ct-text);

        &.good { color: var(--ct-success); }
        &.warn { color: var(--ct-warning); }
        &.bad { color: var(--ct-danger); }
      }

      .summary-label {
        font-size: 11px;
        color: var(--ct-text-secondary);
      }
    }
  }

  .curve-chart {
    height: 220px;
  }
}
</style>
