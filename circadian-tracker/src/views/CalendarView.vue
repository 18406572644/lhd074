<template>
  <div class="calendar-view">
    <h2 class="page-title">
      <el-icon><Calendar /></el-icon>
      日历视图
    </h2>

    <div class="stats-cards">
      <div class="ct-card stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg,#7eb8d8,#5a9ab8)">
          <el-icon :size="20"><TrendCharts /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ weekStats.avgScore }}</div>
          <div class="stat-label">本周平均评分</div>
        </div>
      </div>
      <div class="ct-card stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg,#67c28a,#4ea06a)">
          <el-icon :size="20"><CircleCheckFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ monthStats.complianceRate }}%</div>
          <div class="stat-label">本月达标率</div>
        </div>
      </div>
      <div class="ct-card stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg,#67c28a,#7eb8d8)">
          <el-icon :size="20"><Sunny /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value small">{{ monthStats.bestDay || '—' }}</div>
          <div class="stat-label">本月最佳日 ({{ monthStats.bestScore }}分)</div>
        </div>
      </div>
      <div class="ct-card stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg,#f56c6c,#e6a23c)">
          <el-icon :size="20"><WarningFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value small">{{ monthStats.worstDay || '—' }}</div>
          <div class="stat-label">本月最差日 ({{ monthStats.worstScore }}分)</div>
        </div>
      </div>
    </div>

    <div class="calendar-body">
      <div class="ct-card calendar-card">
        <div class="calendar-nav">
          <div class="nav-left">
            <el-button :icon="ArrowLeft" circle @click="prevMonth" />
            <span class="month-label">{{ currentYear }}年{{ currentMonth + 1 }}月</span>
            <el-button :icon="ArrowRight" circle @click="nextMonth" />
            <el-button size="small" @click="goToday" style="margin-left: 12px">今天</el-button>
            <el-button
              v-if="rangeStart || rangeEnd"
              size="small"
              type="danger"
              plain
              @click="clearRange"
              :icon="Close"
              style="margin-left: 8px"
            >
              清除选择
            </el-button>
          </div>
          <div class="nav-right">
            <el-select
              v-model="filterTag"
              placeholder="标签筛选"
              clearable
              size="small"
              style="width: 140px"
            >
              <el-option
                v-for="tag in store.tags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </div>
        </div>

        <div class="range-hint" v-if="rangeStart && rangeEnd">
          <el-tag type="primary" effect="light">
            已选择 {{ rangeStart }} ~ {{ rangeEnd }}（共 {{ rangeDayCount }} 天）
          </el-tag>
          <span class="range-tip">按住 Shift 点击另一天可扩展选择</span>
        </div>
        <div class="range-hint" v-else>
          <span class="range-tip">提示：按住 Shift 点击两天可框选日期范围；右键日历格子可快速操作</span>
        </div>

        <div class="calendar-grid" ref="calendarGridRef" @click.self="clearContextMenu">
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
                'filtered-out': filterTag && day.record && !day.matchFilter,
                'selected': day.date === selectedDate && !rangeStart,
                'in-range': isInRange(day.date),
                'range-start': day.date === rangeStart,
                'range-end': day.date === rangeEnd
              }"
              @click="handleDayClick(day)"
              @contextmenu.prevent="openContextMenu($event, day)"
            >
              <div class="day-number">{{ day.day }}</div>
              <div v-if="day.record" class="day-score">
                <span class="score-dot" :class="getScoreClass(day.score)"></span>
                <span class="score-val">{{ day.score }}</span>
              </div>
              <div v-if="day.record" class="sleep-band" :title="`${day.record.bedtime} - ${day.record.wakeTime}`">
                <div
                  class="sleep-band-fill"
                  :style="getSleepBandStyle(day.record)"
                ></div>
                <div class="sleep-band-marker bedtime" :style="{ left: getTimePercent(day.record.bedtime, true) + '%' }"></div>
                <div class="sleep-band-marker waketime" :style="{ left: getTimePercent(day.record.wakeTime, false) + '%' }"></div>
              </div>
              <div v-if="day.record && day.record.tags && day.record.tags.length > 0" class="day-tags">
                <el-tag
                  v-for="t in day.record.tags.slice(0, 2)"
                  :key="t"
                  size="small"
                  type="primary"
                  effect="light"
                  round
                  class="day-tag"
                >{{ t }}</el-tag>
                <el-tag
                  v-if="day.record.tags.length > 2"
                  size="small"
                  type="info"
                  effect="plain"
                  round
                  class="day-tag"
                >+{{ day.record.tags.length - 2 }}</el-tag>
              </div>
            </div>
          </div>
        </div>

        <teleport to="body">
          <ul
            v-show="contextMenu.visible"
            class="context-menu"
            :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
            @click.stop
          >
            <li class="ctx-item" @click="handleEdit(contextMenu.day)">
              <el-icon><EditPen /></el-icon>
              <span>{{ contextMenu.day?.record ? '编辑记录' : '补录记录' }}</span>
            </li>
            <li
              v-if="contextMenu.day?.record"
              class="ctx-item danger"
              @click="handleDelete(contextMenu.day)"
            >
              <el-icon><Delete /></el-icon>
              <span>删除记录</span>
            </li>
            <li class="ctx-divider"></li>
            <li class="ctx-item" @click="handleSelectRangeStart(contextMenu.day)">
              <el-icon><Rank /></el-icon>
              <span>从这天开始框选</span>
            </li>
          </ul>
        </teleport>
      </div>

      <div class="right-column">
        <div class="ct-card detail-card" v-if="rangeStart && rangeEnd">
          <div class="ct-title">
            <el-icon><DataAnalysis /></el-icon>
            {{ rangeStart }} ~ {{ rangeEnd }} 趋势分析
          </div>
          <div class="range-stats">
            <div class="range-stat">
              <span class="range-stat-value">{{ rangeStats.avgScore }}</span>
              <span class="range-stat-label">平均评分</span>
            </div>
            <div class="range-stat">
              <span class="range-stat-value">{{ rangeStats.complianceRate }}%</span>
              <span class="range-stat-label">达标率</span>
            </div>
            <div class="range-stat">
              <span class="range-stat-value">{{ rangeStats.recordDays }}/{{ rangeStats.totalDays }}</span>
              <span class="range-stat-label">录入天数</span>
            </div>
          </div>
          <div class="range-chart" ref="rangeChartRef"></div>
        </div>

        <div class="ct-card detail-card" v-else-if="selectedRecord">
          <div class="detail-header">
            <div class="ct-title" style="margin-bottom:0">
              <el-icon><Document /></el-icon>
              {{ selectedDate }} 作息详情
            </div>
            <div class="detail-actions">
              <el-button size="small" type="primary" plain @click="handleEditSelected" :icon="EditPen">编辑</el-button>
              <el-button size="small" type="danger" plain @click="handleDeleteSelected" :icon="Delete">删除</el-button>
            </div>
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
          <div v-if="selectedRecord.tags && selectedRecord.tags.length > 0" class="detail-tags">
            <div class="detail-tags-label">
              <el-icon><PriceTag /></el-icon>
              标签
            </div>
            <div class="detail-tags-list">
              <el-tag
                v-for="t in selectedRecord.tags"
                :key="t"
                type="primary"
                effect="light"
                round
                size="small"
              >{{ t }}</el-tag>
            </div>
          </div>
          <div v-if="selectedRecord.note" class="detail-note">
            <el-icon><ChatLineSquare /></el-icon>
            {{ selectedRecord.note }}
          </div>
        </div>
        <div class="ct-card detail-card empty-card" v-else>
          <el-empty description="选择日期查看作息详情，或框选多天查看趋势" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Close, EditPen, Delete, DataAnalysis, Rank, TrendCharts, CircleCheckFilled, Sunny, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { useScheduleStore } from '@/store'
import { useThemeStore } from '@/store'

const route = useRoute()
const router = useRouter()
const store = useScheduleStore()
const themeStore = useThemeStore()

const currentYear = ref(dayjs().year())
const currentMonth = ref(dayjs().month())
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const filterTag = ref(null)
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const rangeStart = ref(null)
const rangeEnd = ref(null)
const shiftPressed = ref(false)

const contextMenu = ref({ visible: false, x: 0, y: 0, day: null })
const calendarGridRef = ref(null)
const rangeChartRef = ref(null)
let rangeChart = null

const calendarDays = computed(() => {
  const firstDay = dayjs(new Date(currentYear.value, currentMonth.value, 1))
  const startDay = firstDay.day()
  const daysInMonth = firstDay.daysInMonth()
  const prevMonthDays = dayjs(new Date(currentYear.value, currentMonth.value, 0)).daysInMonth()
  const today = dayjs().format('YYYY-MM-DD')
  const days = []
  const ft = filterTag.value

  function matchFilter(record) {
    if (!ft) return true
    if (!record) return false
    return Array.isArray(record.tags) && record.tags.includes(ft)
  }

  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const date = dayjs(new Date(currentYear.value, currentMonth.value - 1, d)).format('YYYY-MM-DD')
    const record = store.records.find(r => r.date === date)
    days.push({
      day: d, date, currentMonth: false, isToday: date === today,
      record: record || null,
      score: record ? store.calcSleepScore(record) : 0,
      matchFilter: matchFilter(record)
    })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = dayjs(new Date(currentYear.value, currentMonth.value, i)).format('YYYY-MM-DD')
    const record = store.records.find(r => r.date === date)
    days.push({
      day: i, date, currentMonth: true, isToday: date === today,
      record: record || null,
      score: record ? store.calcSleepScore(record) : 0,
      matchFilter: matchFilter(record)
    })
  }

  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = dayjs(new Date(currentYear.value, currentMonth.value + 1, i)).format('YYYY-MM-DD')
    const record = store.records.find(r => r.date === date)
    days.push({
      day: i, date, currentMonth: false, isToday: false,
      record: record || null,
      score: record ? store.calcSleepScore(record) : 0,
      matchFilter: matchFilter(record)
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

const weekStats = computed(() => {
  const startOfWeek = dayjs().startOf('week')
  const endOfWeek = dayjs().endOf('week')
  const records = store.getRecordsByRange(
    startOfWeek.format('YYYY-MM-DD'),
    endOfWeek.format('YYYY-MM-DD'),
    filterTag.value
  )
  if (records.length === 0) return { avgScore: '--', complianceRate: 0 }
  const scores = records.map(r => store.calcSleepScore(r))
  const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
  return { avgScore: avg, complianceRate: Math.round((scores.filter(s => s >= 60).length / scores.length) * 100) }
})

const monthStats = computed(() => {
  const start = dayjs(new Date(currentYear.value, currentMonth.value, 1)).format('YYYY-MM-DD')
  const end = dayjs(new Date(currentYear.value, currentMonth.value + 1, 0)).format('YYYY-MM-DD')
  const records = store.getRecordsByRange(start, end, filterTag.value)
  if (records.length === 0) {
    return { complianceRate: 0, bestDay: '', bestScore: '--', worstDay: '', worstScore: '--' }
  }
  const scores = records.map(r => ({ date: r.date, score: store.calcSleepScore(r) }))
  const complianceRate = Math.round((scores.filter(s => s.score >= 60).length / scores.length) * 100)
  const best = scores.reduce((a, b) => (a.score > b.score ? a : b))
  const worst = scores.reduce((a, b) => (a.score < b.score ? a : b))
  return {
    complianceRate,
    bestDay: best.date.slice(5),
    bestScore: best.score,
    worstDay: worst.date.slice(5),
    worstScore: worst.score
  }
})

const rangeDayCount = computed(() => {
  if (!rangeStart.value || !rangeEnd.value) return 0
  return dayjs(rangeEnd.value).diff(dayjs(rangeStart.value), 'day') + 1
})

const rangeStats = computed(() => {
  if (!rangeStart.value || !rangeEnd.value) return { avgScore: '--', complianceRate: 0, recordDays: 0, totalDays: 0 }
  const records = store.getRecordsByRange(rangeStart.value, rangeEnd.value, filterTag.value)
  const totalDays = rangeDayCount.value
  if (records.length === 0) return { avgScore: '--', complianceRate: 0, recordDays: 0, totalDays }
  const scores = records.map(r => store.calcSleepScore(r))
  const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
  const complianceRate = Math.round((scores.filter(s => s >= 60).length / scores.length) * 100)
  return { avgScore: avg, complianceRate, recordDays: records.length, totalDays }
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

function getTimePercent(timeStr, isBedtime) {
  const [h, m] = timeStr.split(':').map(Number)
  let totalMin = h * 60 + m
  if (isBedtime && totalMin < 12 * 60) totalMin += 24 * 60
  const minTime = 18 * 60
  const maxTime = 36 * 60
  return Math.max(0, Math.min(100, ((totalMin - minTime) / (maxTime - minTime)) * 100))
}

function getSleepBandStyle(record) {
  const bedtime = getTimePercent(record.bedtime, true)
  const waketime = getTimePercent(record.wakeTime, false)
  let left, width
  if (waketime >= bedtime) {
    left = bedtime
    width = waketime - bedtime
  } else {
    left = bedtime
    width = (100 - bedtime) + waketime
  }
  const score = store.calcSleepScore(record)
  let color = 'rgba(126, 184, 216, 0.5)'
  if (score >= 80) color = 'rgba(103, 194, 138, 0.6)'
  else if (score >= 60) color = 'rgba(126, 184, 216, 0.5)'
  else color = 'rgba(245, 108, 108, 0.5)'
  return {
    left: left + '%',
    width: Math.max(4, width) + '%',
    background: color
  }
}

function isInRange(date) {
  if (!rangeStart.value || !rangeEnd.value) return false
  return date >= rangeStart.value && date <= rangeEnd.value
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
  clearRange()
}

function selectDay(day) {
  selectedDate.value = day.date
}

function handleDayClick(day) {
  clearContextMenu()
  if (shiftPressed.value || rangeStart.value) {
    if (!rangeStart.value) {
      rangeStart.value = day.date
      rangeEnd.value = null
    } else if (!rangeEnd.value) {
      if (day.date < rangeStart.value) {
        rangeEnd.value = rangeStart.value
        rangeStart.value = day.date
      } else {
        rangeEnd.value = day.date
      }
      nextTick(renderRangeChart)
    } else {
      rangeStart.value = day.date
      rangeEnd.value = null
    }
  } else {
    rangeStart.value = null
    rangeEnd.value = null
    selectedDate.value = day.date
  }
}

function clearRange() {
  rangeStart.value = null
  rangeEnd.value = null
  if (rangeChart) {
    rangeChart.dispose()
    rangeChart = null
  }
}

function openContextMenu(e, day) {
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    day
  }
}

function clearContextMenu() {
  contextMenu.value.visible = false
}

function handleEdit(day) {
  clearContextMenu()
  if (day) {
    router.push({ path: '/input', query: { date: day.date } })
  }
}

function handleEditSelected() {
  router.push({ path: '/input', query: { date: selectedDate.value } })
}

async function handleDelete(day) {
  clearContextMenu()
  if (!day?.record) return
  try {
    await ElMessageBox.confirm(`确定删除 ${day.date} 的作息记录吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await store.deleteRecord(day.date)
    ElMessage.success('记录已删除')
  } catch {}
}

async function handleDeleteSelected() {
  if (!selectedRecord.value) return
  try {
    await ElMessageBox.confirm(`确定删除 ${selectedDate.value} 的作息记录吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await store.deleteRecord(selectedDate.value)
    ElMessage.success('记录已删除')
  } catch {}
}

function handleSelectRangeStart(day) {
  clearContextMenu()
  rangeStart.value = day.date
  rangeEnd.value = null
}

function handleKeyDown(e) {
  if (e.key === 'Shift') shiftPressed.value = true
  if (e.key === 'Escape') {
    clearContextMenu()
    clearRange()
  }
}

function handleKeyUp(e) {
  if (e.key === 'Shift') shiftPressed.value = false
}

function handleGlobalClick() {
  clearContextMenu()
}

const textColor = computed(() => themeStore.isDark ? '#c0ccd8' : '#7f8c9b')

function renderRangeChart() {
  if (!rangeChartRef.value || !rangeStart.value || !rangeEnd.value) return
  if (!rangeChart) {
    rangeChart = echarts.init(rangeChartRef.value)
  }
  const records = store.getRecordsByRange(rangeStart.value, rangeEnd.value, filterTag.value)
  if (records.length === 0) {
    rangeChart.clear()
    return
  }

  const startD = dayjs(rangeStart.value)
  const endD = dayjs(rangeEnd.value)
  const allDates = []
  for (let d = startD; d.isBefore(endD) || d.isSame(endD, 'day'); d = d.add(1, 'day')) {
    allDates.push(d.format('YYYY-MM-DD'))
  }
  const recordMap = {}
  records.forEach(r => { recordMap[r.date] = r })

  const dates = allDates.map(d => d.slice(5))
  const bedtimes = allDates.map(d => {
    const r = recordMap[d]
    if (!r) return null
    const [h, m] = r.bedtime.split(':').map(Number)
    let val = h + m / 60
    return val < 12 ? val + 24 : val
  })
  const wakeTimes = allDates.map(d => {
    const r = recordMap[d]
    if (!r) return null
    const [h, m] = r.wakeTime.split(':').map(Number)
    return h + m / 60
  })
  const scores = allDates.map(d => {
    const r = recordMap[d]
    return r ? store.calcSleepScore(r) : null
  })

  rangeChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let html = `<div style="font-size:12px"><b>${params[0]?.axisValue}</b>`
        params.forEach(p => {
          let v = p.value
          if (v == null) return
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
    legend: { data: ['入睡时间', '起床时间', '睡眠评分'], textStyle: { color: textColor.value }, top: 0 },
    grid: { left: 50, right: 50, bottom: 30, top: 35 },
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
        connectNulls: false,
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
        connectNulls: false,
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
        connectNulls: false,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#e6a23c', width: 2, type: 'dashed' },
        itemStyle: { color: '#e6a23c' }
      }
    ]
  }, true)
}

function handleResize() {
  rangeChart?.resize()
}

function handleRouteDate() {
  const dateQuery = route.query.date
  if (typeof dateQuery === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateQuery)) {
    selectedDate.value = dateQuery
    const d = dayjs(dateQuery)
    currentYear.value = d.year()
    currentMonth.value = d.month()
  }
}

onMounted(() => {
  handleRouteDate()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('click', handleGlobalClick)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('click', handleGlobalClick)
  window.removeEventListener('resize', handleResize)
  rangeChart?.dispose()
})

watch(() => route.query.date, () => {
  handleRouteDate()
})

watch([rangeStart, rangeEnd], () => {
  if (rangeStart.value && rangeEnd.value) {
    nextTick(renderRangeChart)
  }
})

watch(() => themeStore.isDark, () => {
  setTimeout(() => {
    if (rangeChart) {
      rangeChart.dispose()
      rangeChart = null
      nextTick(renderRangeChart)
    }
  }, 50)
})

watch([() => store.records, filterTag], () => {
  if (rangeStart.value && rangeEnd.value) {
    nextTick(renderRangeChart)
  }
}, { deep: true })
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  .stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;

      .stat-value {
        font-size: 22px;
        font-weight: 700;
        color: var(--ct-text);
        line-height: 1.2;

        &.small {
          font-size: 16px;
        }
      }
      .stat-label {
        font-size: 11px;
        color: var(--ct-text-secondary);
        white-space: nowrap;
      }
    }
  }
}

.calendar-body {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
}

.calendar-card {
  .calendar-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;

    .nav-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .month-label {
      font-size: 16px;
      font-weight: 600;
      min-width: 120px;
      text-align: center;
    }
  }

  .range-hint {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: rgba(126, 184, 216, 0.08);
    border-radius: 6px;

    .range-tip {
      font-size: 11px;
      color: var(--ct-text-secondary);
    }
  }

  .week-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 6px;

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
    min-height: 90px;
    padding: 6px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    border: 2px solid transparent;
    position: relative;
    display: flex;
    flex-direction: column;

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

    &.in-range {
      background: rgba(126, 184, 216, 0.18);
      border-color: var(--ct-primary-light);
      border-radius: 0;

      &.range-start {
        border-top-left-radius: 8px;
        border-bottom-left-radius: 8px;
        border-left: 2px solid var(--ct-primary);
      }
      &.range-end {
        border-top-right-radius: 8px;
        border-bottom-right-radius: 8px;
        border-right: 2px solid var(--ct-primary);
      }
      &.range-start.range-end {
        border-radius: 8px;
        border: 2px solid var(--ct-primary);
      }
    }

    &.filtered-out {
      opacity: 0.25;
      filter: grayscale(0.6);
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
      margin-top: 2px;

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

    .sleep-band {
      position: relative;
      height: 6px;
      margin-top: 5px;
      background: rgba(126, 184, 216, 0.12);
      border-radius: 3px;
      overflow: hidden;

      .sleep-band-fill {
        position: absolute;
        top: 0;
        height: 100%;
        border-radius: 3px;
        transition: all 0.2s;
      }

      .sleep-band-marker {
        position: absolute;
        top: -1px;
        width: 2px;
        height: 8px;
        transform: translateX(-50%);
        border-radius: 1px;

        &.bedtime {
          background: #5a9ab8;
        }
        &.waketime {
          background: #4ea06a;
        }
      }
    }

    .day-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      margin-top: 4px;

      .day-tag {
        transform: scale(0.75);
        transform-origin: left top;
      }
    }
  }
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .detail-actions {
      display: flex;
      gap: 6px;
    }
  }

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

  .detail-tags {
    margin-top: 12px;
    padding: 10px;
    background: rgba(126, 184, 216, 0.05);
    border-radius: 8px;

    .detail-tags-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      color: var(--ct-text-secondary);
      margin-bottom: 8px;
      .el-icon { color: var(--ct-primary); }
    }

    .detail-tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }

  .range-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 12px;

    .range-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 6px;
      background: rgba(126, 184, 216, 0.06);
      border-radius: 8px;

      .range-stat-value {
        font-size: 18px;
        font-weight: 700;
        color: var(--ct-primary);
      }
      .range-stat-label {
        font-size: 10px;
        color: var(--ct-text-secondary);
        margin-top: 2px;
      }
    }
  }

  .range-chart {
    height: 220px;
  }
}

.empty-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: 8px;
  padding: 6px;
  list-style: none;
  min-width: 160px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

  .ctx-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--ct-text);
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s;

    .el-icon {
      font-size: 14px;
      color: var(--ct-primary);
    }

    &:hover {
      background: var(--ct-primary-lighter);
    }

    &.danger {
      color: var(--ct-danger);

      .el-icon {
        color: var(--ct-danger);
      }

      &:hover {
        background: rgba(245, 108, 108, 0.1);
      }
    }
  }

  .ctx-divider {
    height: 1px;
    background: var(--ct-border);
    margin: 4px 6px;
  }
}
</style>
