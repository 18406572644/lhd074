<template>
  <div class="calendar-view">
    <h2 class="page-title">
      <el-icon><Calendar /></el-icon>
      日历视图
    </h2>

    <div class="calendar-body">
      <div class="ct-card calendar-card">
        <div class="calendar-nav">
          <el-button :icon="ArrowLeft" circle @click="prevMonth" />
          <span class="month-label">{{ currentYear }}年{{ currentMonth + 1 }}月</span>
          <el-button :icon="ArrowRight" circle @click="nextMonth" />
          <el-button size="small" @click="goToday" style="margin-left: 12px">今天</el-button>
        </div>
        <div class="calendar-grid">
          <div class="week-header">
            <div v-for="d in weekDays" :key="d" class="week-cell">{{ d }}</div>
          </div>
          <div class="days-grid">
            <div
              v-for="(day, idx) in calendarDays"
              :key="idx"
              class="day-cell"
              :class="{
                'other-month': !day.currentMonth,
                'is-today': day.isToday,
                'has-record': day.record,
                'selected': day.date === selectedDate
              }"
              @click="selectDay(day)"
            >
              <div class="day-number">{{ day.day }}</div>
              <div v-if="day.record" class="day-score">
                <span class="score-dot" :class="getScoreClass(day.score)"></span>
                <span class="score-val">{{ day.score }}</span>
              </div>
              <div v-if="day.record" class="day-summary">
                {{ day.record.bedtime }} - {{ day.record.wakeTime }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="ct-card detail-card" v-if="selectedRecord">
        <div class="ct-title">
          <el-icon><Document /></el-icon>
          {{ selectedDate }} 作息详情
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">入睡时间</span>
            <span class="detail-value">{{ selectedRecord.bedtime }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">起床时间</span>
            <span class="detail-value">{{ selectedRecord.wakeTime }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">睡眠时长</span>
            <span class="detail-value">{{ calcDuration(selectedRecord) }}h</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">深睡/浅睡</span>
            <span class="detail-value">{{ selectedRecord.deepSleep }}m / {{ selectedRecord.lightSleep }}m</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">日间小憩</span>
            <span class="detail-value">{{ selectedRecord.napMin || 0 }}min</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">咖啡因</span>
            <span class="detail-value">{{ selectedRecord.caffeineMg || 0 }}mg</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">用眼时长</span>
            <span class="detail-value">{{ selectedRecord.screenMin || 0 }}min</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">睡眠评分</span>
            <span class="detail-value">
              <el-tag :type="selectedScoreType" size="small" effect="dark" round>
                {{ selectedScore }} 分
              </el-tag>
            </span>
          </div>
        </div>
        <div v-if="selectedRecord.note" class="detail-note">
          <el-icon><ChatLineSquare /></el-icon>
          {{ selectedRecord.note }}
        </div>
      </div>
      <div class="ct-card detail-card empty-card" v-else>
        <el-empty description="选择日期查看作息详情" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useScheduleStore } from '@/store'

const store = useScheduleStore()
const currentYear = ref(dayjs().year())
const currentMonth = ref(dayjs().month())
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const calendarDays = computed(() => {
  const firstDay = dayjs(new Date(currentYear.value, currentMonth.value, 1))
  const startDay = firstDay.day()
  const daysInMonth = firstDay.daysInMonth()
  const prevMonthDays = dayjs(new Date(currentYear.value, currentMonth.value, 0)).daysInMonth()
  const today = dayjs().format('YYYY-MM-DD')
  const days = []

  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const date = dayjs(new Date(currentYear.value, currentMonth.value - 1, d)).format('YYYY-MM-DD')
    const record = store.records.find(r => r.date === date)
    days.push({
      day: d, date, currentMonth: false, isToday: date === today,
      record: record || null,
      score: record ? store.calcSleepScore(record) : 0
    })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = dayjs(new Date(currentYear.value, currentMonth.value, i)).format('YYYY-MM-DD')
    const record = store.records.find(r => r.date === date)
    days.push({
      day: i, date, currentMonth: true, isToday: date === today,
      record: record || null,
      score: record ? store.calcSleepScore(record) : 0
    })
  }

  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = dayjs(new Date(currentYear.value, currentMonth.value + 1, i)).format('YYYY-MM-DD')
    const record = store.records.find(r => r.date === date)
    days.push({
      day: i, date, currentMonth: false, isToday: false,
      record: record || null,
      score: record ? store.calcSleepScore(record) : 0
    })
  }

  return days
})

const selectedRecord = computed(() => {
  return store.records.find(r => r.date === selectedDate.value) || null
})

const selectedScore = computed(() => {
  return selectedRecord.value ? store.calcSleepScore(selectedRecord.value) : 0
})

const selectedScoreType = computed(() => {
  const s = selectedScore.value
  if (s >= 80) return 'success'
  if (s >= 60) return 'warning'
  return 'danger'
})

function getScoreClass(score) {
  if (score >= 80) return 'good'
  if (score >= 60) return 'warn'
  return 'bad'
}

function calcDuration(record) {
  const bedtime = dayjs(`${record.date} ${record.bedtime}`)
  const wakeTime = dayjs(`${record.date} ${record.wakeTime}`)
  let h = wakeTime.diff(bedtime, 'minute') / 60
  if (h < 0) h += 24
  return h.toFixed(1)
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function goToday() {
  currentYear.value = dayjs().year()
  currentMonth.value = dayjs().month()
  selectedDate.value = dayjs().format('YYYY-MM-DD')
}

function selectDay(day) {
  selectedDate.value = day.date
}
</script>

<style lang="scss" scoped>
.calendar-view {
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

.calendar-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
}

.calendar-card {
  .calendar-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

    .month-label {
      font-size: 16px;
      font-weight: 600;
      min-width: 120px;
      text-align: center;
    }
  }

  .week-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;

    .week-cell {
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: var(--ct-text-secondary);
      padding: 6px 0;
    }
  }

  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .day-cell {
    min-height: 68px;
    padding: 6px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    border: 2px solid transparent;

    &:hover {
      background: var(--ct-primary-lighter);
    }

    &.other-month {
      opacity: 0.35;
    }

    &.is-today {
      border-color: var(--ct-primary);
    }

    &.has-record {
      background: rgba(126, 184, 216, 0.06);
    }

    &.selected {
      border-color: var(--ct-primary);
      background: rgba(126, 184, 216, 0.15);
    }

    .day-number {
      font-size: 13px;
      font-weight: 600;
      color: var(--ct-text);
    }

    .day-score {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;

      .score-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        &.good { background: #67c28a; }
        &.warn { background: #e6a23c; }
        &.bad { background: #f56c6c; }
      }

      .score-val {
        font-size: 11px;
        font-weight: 600;
        color: var(--ct-text-secondary);
      }
    }

    .day-summary {
      font-size: 9px;
      color: var(--ct-text-secondary);
      margin-top: 2px;
    }
  }
}

.detail-card {
  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .detail-label {
        font-size: 11px;
        color: var(--ct-text-secondary);
      }
      .detail-value {
        font-size: 15px;
        font-weight: 600;
        color: var(--ct-text);
      }
    }
  }

  .detail-note {
    margin-top: 12px;
    padding: 10px;
    background: rgba(126, 184, 216, 0.08);
    border-radius: 8px;
    font-size: 12px;
    color: var(--ct-text-secondary);
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
}

.empty-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
</style>
