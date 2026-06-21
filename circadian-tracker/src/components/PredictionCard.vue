<template>
  <div class="prediction-section" v-if="insights.length > 0">
    <div class="prediction-cards">
      <div
        v-for="(insight, i) in insights"
        :key="i"
        class="prediction-card"
        :class="insight.type"
      >
        <div class="card-indicator"></div>
        <div class="card-body">
          <div class="card-header">
            <div class="card-icon-wrap" :class="insight.type">
              <el-icon :size="16"><component :is="insight.icon" /></el-icon>
            </div>
            <span class="card-title">{{ insight.title }}</span>
          </div>
          <div class="card-text">
            {{ insight.text }}<span v-if="insight.subText" class="card-sub">{{ insight.subText }}</span>
          </div>
          <div v-if="insight.actionable" class="card-action">
            <el-button size="small" :type="insight.type === 'warn' ? 'warning' : 'primary'" round @click="$emit('takeAction', insight)">
              立即调整
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="prediction-detail" v-if="bedtimePrediction || scorePrediction">
      <div class="detail-item" v-if="bedtimePrediction">
        <div class="detail-label">
          <el-icon><TrendCharts /></el-icon>
          入睡趋势
        </div>
        <div class="detail-values">
          <div class="detail-block">
            <span class="detail-value" :class="bedtimePrediction.trendDirection">
              {{ bedtimePrediction.predictedTime }}
            </span>
            <span class="detail-desc">预测{{ targetDayLabel }}入睡</span>
          </div>
          <div class="detail-block">
            <span class="detail-value">{{ bedtimePrediction.currentAvgTime }}</span>
            <span class="detail-desc">近30天均值</span>
          </div>
          <div class="detail-block" v-if="bedtimePrediction.trendDirection !== 'stable'">
            <span class="detail-value trend" :class="bedtimePrediction.trendDirection">
              {{ bedtimePrediction.trendDirection === 'later' ? '↑ 推迟' : '↓ 提前' }}
              {{ formatMinutes(Math.abs(bedtimePrediction.trendMinutes)) }}
            </span>
            <span class="detail-desc">趋势幅度</span>
          </div>
        </div>
      </div>
      <div class="detail-item" v-if="scorePrediction">
        <div class="detail-label">
          <el-icon><DataBoard /></el-icon>
          评分预测
        </div>
        <div class="detail-values">
          <div class="detail-block">
            <span class="detail-value score" :class="getScoreClass(scorePrediction.predictedScore)">
              {{ scorePrediction.predictedScore }}
            </span>
            <span class="detail-desc">预测{{ targetDayLabel }}评分</span>
          </div>
          <div class="detail-block">
            <span class="detail-value">{{ scorePrediction.currentAvgScore }}</span>
            <span class="detail-desc">当前均值</span>
          </div>
          <div class="detail-block" v-if="scorePrediction.trendDirection !== 'stable'">
            <span class="detail-value trend" :class="scorePrediction.trendDirection">
              {{ scorePrediction.trendDirection === 'declining' ? '↓ 走低' : '↑ 好转' }}
            </span>
            <span class="detail-desc">评分趋势</span>
          </div>
        </div>
      </div>
      <div class="detail-item" v-if="weeklyPatterns.length > 0">
        <div class="detail-label">
          <el-icon><Calendar /></el-icon>
          周期规律
        </div>
        <div class="detail-values pattern-values">
          <div
            v-for="p in weeklyPatterns.slice(0, 3)"
            :key="p.weekday"
            class="pattern-chip"
            :class="Math.abs(p.diffMinutes) >= 90 ? 'warn' : 'info'"
          >
            <span class="pattern-day">{{ p.weekdayName }}</span>
            <span class="pattern-avg">{{ p.avgBedtime }}</span>
            <span class="pattern-diff">{{ p.direction }}{{ formatMinutes(Math.abs(p.diffMinutes)) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import { generatePredictionInsights } from '@/utils/prediction'

const props = defineProps({
  records: { type: Array, required: true },
  calcSleepScore: { type: Function, required: true },
  goals: { type: Object, required: true }
})

defineEmits(['takeAction'])

const predictionResult = computed(() => {
  return generatePredictionInsights(props.records, props.calcSleepScore, props.goals)
})

const insights = computed(() => predictionResult.value.insights)
const bedtimePrediction = computed(() => predictionResult.value.bedtimePrediction)
const scorePrediction = computed(() => predictionResult.value.scorePrediction)
const weeklyPatterns = computed(() => predictionResult.value.weeklyPatterns)

const targetDayLabel = computed(() => {
  const today = dayjs().day()
  const daysToSunday = today === 0 ? 7 : 7 - today
  if (daysToSunday <= 1) return '明天'
  if (daysToSunday <= 3) return '本周日'
  return '本周日'
})

function getScoreClass(score) {
  if (score >= 80) return 'good'
  if (score >= 60) return 'warn'
  return 'bad'
}

function formatMinutes(min) {
  if (min >= 60) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h${m}m` : `${h}h`
  }
  return `${min}m`
}
</script>

<style lang="scss" scoped>
.prediction-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prediction-cards {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar {
    height: 4px;
  }
}

.prediction-card {
  min-width: 280px;
  flex: 1;
  display: flex;
  border-radius: 10px;
  overflow: hidden;
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  box-shadow: var(--ct-shadow);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 20px rgba(126, 184, 216, 0.2);
  }

  .card-indicator {
    width: 4px;
    flex-shrink: 0;
  }

  &.warn .card-indicator { background: var(--ct-warning); }
  &.good .card-indicator { background: var(--ct-success); }
  &.info .card-indicator { background: var(--ct-primary); }

  .card-body {
    padding: 14px 16px;
    flex: 1;
    min-width: 0;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .card-icon-wrap {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;

      &.warn { background: var(--ct-warning); }
      &.good { background: var(--ct-success); }
      &.info { background: var(--ct-primary); }
    }

    .card-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--ct-text);
    }
  }

  .card-text {
    font-size: 12px;
    line-height: 1.6;
    color: var(--ct-text-secondary);

    .card-sub {
      color: var(--ct-danger);
      font-weight: 600;
    }
  }

  .card-action {
    margin-top: 10px;
  }
}

.prediction-detail {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.detail-item {
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: 10px;
  padding: 16px;
  box-shadow: var(--ct-shadow);

  .detail-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--ct-text-secondary);
    margin-bottom: 12px;

    .el-icon { color: var(--ct-primary); }
  }

  .detail-values {
    display: flex;
    gap: 16px;
    align-items: flex-end;
  }

  .detail-block {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .detail-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--ct-text);

      &.later { color: var(--ct-danger); }
      &.earlier { color: var(--ct-success); }
      &.declining { color: var(--ct-danger); }
      &.improving { color: var(--ct-success); }
      &.stable { color: var(--ct-primary); }

      &.trend { font-size: 14px; }

      &.score {
        &.good { color: var(--ct-success); }
        &.warn { color: var(--ct-warning); }
        &.bad { color: var(--ct-danger); }
      }
    }

    .detail-desc {
      font-size: 10px;
      color: var(--ct-text-secondary);
    }
  }

  .pattern-values {
    flex-wrap: wrap;
  }

  .pattern-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;

    &.warn {
      background: rgba(230, 162, 60, 0.12);
      color: var(--ct-warning);
    }

    &.info {
      background: rgba(126, 184, 216, 0.12);
      color: var(--ct-primary);
    }

    .pattern-day { font-weight: 700; }
    .pattern-avg { opacity: 0.8; }
    .pattern-diff { font-weight: 600; }
  }
}
</style>
