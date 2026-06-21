<template>
  <div class="pdf-template" ref="pdfRef" v-if="reportData">
    <div class="pdf-header">
      <div class="pdf-logo">◈</div>
      <h1>作息节律报告</h1>
      <p class="pdf-period">{{ reportData.period }}</p>
    </div>

    <div class="pdf-section">
      <h2>概览统计</h2>
      <div class="pdf-stats">
        <div class="pdf-stat-item">
          <div class="stat-val" :class="scoreClass">{{ reportData.avgScore }}</div>
          <div class="stat-label">平均评分</div>
        </div>
        <div class="pdf-stat-item">
          <div class="stat-val">{{ reportData.avgSleep }}h</div>
          <div class="stat-label">日均睡眠</div>
        </div>
        <div class="pdf-stat-item">
          <div class="stat-val">{{ reportData.totalDays }}</div>
          <div class="stat-label">记录天数</div>
        </div>
        <div class="pdf-stat-item good">
          <div class="stat-val">{{ reportData.goodDays }}</div>
          <div class="stat-label">优秀天数</div>
        </div>
        <div class="pdf-stat-item warn">
          <div class="stat-val">{{ reportData.warnDays }}</div>
          <div class="stat-label">一般天数</div>
        </div>
        <div class="pdf-stat-item bad">
          <div class="stat-val">{{ reportData.badDays }}</div>
          <div class="stat-label">较差天数</div>
        </div>
      </div>
    </div>

    <div class="pdf-section" v-if="reportData.comparison">
      <h2>环比对比</h2>
      <div class="comparison-grid">
        <div class="comparison-item">
          <span class="comp-label">平均评分</span>
          <span class="comp-value" :class="getCompClass(reportData.comparison.avgScore)">
            {{ formatPct(reportData.comparison.avgScore) }}
          </span>
        </div>
        <div class="comparison-item">
          <span class="comp-label">日均睡眠</span>
          <span class="comp-value" :class="getCompClass(reportData.comparison.avgSleep, true)">
            {{ formatPct(reportData.comparison.avgSleep) }}
          </span>
        </div>
        <div class="comparison-item">
          <span class="comp-label">日均深睡</span>
          <span class="comp-value" :class="getCompClass(reportData.comparison.avgDeep, true)">
            {{ formatPct(reportData.comparison.avgDeep) }}
          </span>
        </div>
        <div class="comparison-item">
          <span class="comp-label">优秀天数</span>
          <span class="comp-value" :class="getCompClass(reportData.comparison.goodDays)">
            {{ formatPct(reportData.comparison.goodDays) }}
          </span>
        </div>
        <div class="comparison-item">
          <span class="comp-label">咖啡因摄入</span>
          <span class="comp-value" :class="getCompClass(reportData.comparison.avgCaffeine, false, true)">
            {{ formatPct(reportData.comparison.avgCaffeine) }}
          </span>
        </div>
        <div class="comparison-item">
          <span class="comp-label">用眼时长</span>
          <span class="comp-value" :class="getCompClass(reportData.comparison.avgScreen, false, true)">
            {{ formatPct(reportData.comparison.avgScreen) }}
          </span>
        </div>
      </div>
    </div>

    <div class="pdf-section">
      <h2>作息趋势</h2>
      <div class="chart-wrapper">
        <div ref="trendChartRef" class="chart-box"></div>
      </div>
    </div>

    <div class="pdf-section">
      <h2>睡眠评分分布</h2>
      <div class="chart-wrapper">
        <div ref="scoreChartRef" class="chart-box"></div>
      </div>
    </div>

    <div class="pdf-section">
      <h2>高光时刻</h2>
      <div class="highlights-row">
        <div class="highlight-col best">
          <div class="highlight-title">
            <el-icon><Trophy /></el-icon>
            最佳 3 天
          </div>
          <div
            class="highlight-item"
            v-for="d in reportData.bestDays"
            :key="'b-' + d.date"
          >
            <span class="h-date">{{ d.date }}</span>
            <span class="h-score">{{ d.score }}分</span>
            <span class="h-time">{{ d.bedtime }} - {{ d.wakeTime }}</span>
          </div>
        </div>
        <div class="highlight-col worst">
          <div class="highlight-title">
            <el-icon><Warning /></el-icon>
            待改进 3 天
          </div>
          <div
            class="highlight-item"
            v-for="d in reportData.worstDays"
            :key="'w-' + d.date"
          >
            <span class="h-date">{{ d.date }}</span>
            <span class="h-score">{{ d.score }}分</span>
            <span class="h-time">{{ d.bedtime }} - {{ d.wakeTime }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="pdf-section">
      <h2>详细数据</h2>
      <table class="pdf-table">
        <thead>
          <tr>
            <th>日期</th>
            <th>入睡</th>
            <th>起床</th>
            <th>深睡</th>
            <th>浅睡</th>
            <th>小憩</th>
            <th>咖啡因</th>
            <th>用眼</th>
            <th>评分</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in reportData.records" :key="r.date">
            <td>{{ r.date }}</td>
            <td>{{ r.bedtime }}</td>
            <td>{{ r.wakeTime }}</td>
            <td>{{ r.deepSleep }}m</td>
            <td>{{ r.lightSleep }}m</td>
            <td>{{ r.napMin || 0 }}m</td>
            <td>{{ r.caffeineMg || 0 }}mg</td>
            <td>{{ r.screenMin || 0 }}m</td>
            <td :class="getScoreClass(reportData.scores[i])">{{ reportData.scores[i] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pdf-section">
      <h2>健康建议</h2>
      <ul class="pdf-advices">
        <li v-for="(advice, i) in reportData.advices" :key="i">{{ advice }}</li>
      </ul>
    </div>

    <div class="pdf-footer">
      <p>由「作息节律追踪」自动生成 · {{ new Date().toLocaleDateString('zh-CN') }}</p>
      <p>数据经AES-256-GCM加密本地存储，保障隐私安全</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const props = defineProps({
  reportData: Object
})

const trendChartRef = ref(null)
const scoreChartRef = ref(null)
let trendChart = null
let scoreChart = null

const scoreClass = computed(() => {
  const s = props.reportData?.avgScore || 0
  if (s >= 80) return 'good'
  if (s >= 60) return 'warn'
  return 'bad'
})

function getScoreClass(score) {
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-warn'
  return 'score-bad'
}

function formatPct(v) {
  if (v > 0) return `↑ ${v}%`
  if (v < 0) return `↓ ${Math.abs(v)}%`
  return '— 0%'
}

function getCompClass(v, higherBetter = true, lowerBetter = false) {
  if (v === 0) return ''
  if (lowerBetter) {
    return v < 0 ? 'comp-good' : 'comp-bad'
  }
  if (higherBetter) {
    return v > 0 ? 'comp-good' : 'comp-bad'
  }
  return v > 0 ? 'comp-good' : 'comp-bad'
}

function renderTrendChart() {
  if (!trendChartRef.value || !props.reportData) return
  if (trendChart) trendChart.dispose()
  trendChart = echarts.init(trendChartRef.value)

  const records = props.reportData.records
  const dates = records.map(r => r.date.slice(5))
  const bedtimes = records.map(r => {
    const [h, m] = r.bedtime.split(':').map(Number)
    let val = h + m / 60
    return val < 12 ? val + 24 : val
  })
  const wakeTimes = records.map(r => {
    const [h, m] = r.wakeTime.split(':').map(Number)
    return h + m / 60
  })
  const scores = props.reportData.scores

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
    legend: { data: ['入睡时间', '起床时间', '睡眠评分'], textStyle: { color: '#7f8c9b', fontSize: 11 } },
    grid: { left: 50, right: 50, bottom: 30, top: 40 },
    xAxis: { type: 'category', data: dates, axisLabel: { color: '#7f8c9b', fontSize: 10 } },
    yAxis: [
      {
        type: 'value',
        name: '时刻',
        min: 0,
        max: 36,
        axisLabel: {
          color: '#7f8c9b',
          fontSize: 10,
          formatter: (v) => `${Math.floor(v) % 24}:00`
        }
      },
      {
        type: 'value',
        name: '评分',
        min: 0,
        max: 100,
        axisLabel: { color: '#7f8c9b', fontSize: 10 }
      }
    ],
    series: [
      {
        name: '入睡时间',
        type: 'line',
        data: bedtimes,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
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
        symbolSize: 5,
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
        symbolSize: 4,
        lineStyle: { color: '#e6a23c', width: 2, type: 'dashed' },
        itemStyle: { color: '#e6a23c' }
      }
    ]
  })
}

function renderScoreChart() {
  if (!scoreChartRef.value || !props.reportData) return
  if (scoreChart) scoreChart.dispose()
  scoreChart = echarts.init(scoreChartRef.value)

  const dist = props.reportData.scoreDistribution
  scoreChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        return `<div style="font-size:12px"><b>${p.axisValue}</b><br/>天数: ${p.value}</div>`
      }
    },
    grid: { left: 45, right: 20, bottom: 30, top: 25 },
    xAxis: {
      type: 'category',
      data: ['优秀(90+)', '良好(80-89)', '一般(60-79)', '较差(40-59)', '很差(<40)'],
      axisLabel: { color: '#7f8c9b', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: '天数',
      nameTextStyle: { color: '#7f8c9b', fontSize: 10 },
      axisLabel: { color: '#7f8c9b', fontSize: 10 }
    },
    series: [{
      type: 'bar',
      barWidth: '50%',
      data: [
        { value: dist.excellent, itemStyle: { color: '#2b6cb0', borderRadius: [4, 4, 0, 0] } },
        { value: dist.good, itemStyle: { color: '#67c28a', borderRadius: [4, 4, 0, 0] } },
        { value: dist.normal, itemStyle: { color: '#7eb8d8', borderRadius: [4, 4, 0, 0] } },
        { value: dist.poor, itemStyle: { color: '#e6a23c', borderRadius: [4, 4, 0, 0] } },
        { value: dist.bad, itemStyle: { color: '#f56c6c', borderRadius: [4, 4, 0, 0] } }
      ],
      label: {
        show: true,
        position: 'top',
        color: '#2c3e50',
        fontSize: 11,
        fontWeight: 600
      }
    }]
  })
}

function renderCharts() {
  nextTick(() => {
    renderTrendChart()
    renderScoreChart()
  })
}

onMounted(() => {
  renderCharts()
})

watch(() => props.reportData, () => {
  if (props.reportData) {
    renderCharts()
  }
}, { deep: true })
</script>

<style scoped>
.pdf-template {
  width: 794px;
  padding: 40px;
  background: #fff;
  color: #2c3e50;
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.pdf-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #7eb8d8;
}
.pdf-logo {
  font-size: 36px;
  color: #7eb8d8;
  margin-bottom: 8px;
}
.pdf-header h1 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0;
}
.pdf-period {
  font-size: 13px;
  color: #7f8c9b;
  margin-top: 6px;
}
.pdf-section {
  margin-bottom: 28px;
}
.pdf-section h2 {
  font-size: 16px;
  color: #5a9ab8;
  margin-bottom: 14px;
  padding-bottom: 6px;
  border-bottom: 1px solid #d0e9f6;
}
.pdf-stats {
  display: flex;
  gap: 12px;
}
.pdf-stat-item {
  flex: 1;
  text-align: center;
  padding: 12px 8px;
  background: #f0f5fa;
  border-radius: 8px;
}
.pdf-stat-item .stat-val {
  font-size: 22px;
  font-weight: 700;
  color: #7eb8d8;
}
.pdf-stat-item .stat-val.good { color: #67c28a; }
.pdf-stat-item .stat-val.warn { color: #e6a23c; }
.pdf-stat-item .stat-val.bad { color: #f56c6c; }
.pdf-stat-item .stat-label {
  font-size: 11px;
  color: #7f8c9b;
  margin-top: 4px;
}
.comparison-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8fbfd;
  border-radius: 8px;
  border: 1px solid #e8eef3;
}
.comp-label {
  font-size: 12px;
  color: #7f8c9b;
}
.comp-value {
  font-size: 13px;
  font-weight: 700;
}
.comp-good { color: #67c28a; }
.comp-bad { color: #f56c6c; }
.chart-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 8px;
}
.chart-box {
  height: 240px;
  width: 100%;
}
.highlights-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.highlight-col {
  border-radius: 10px;
  padding: 14px;
}
.highlight-col.best {
  background: linear-gradient(135deg, rgba(103,194,138,0.08), rgba(103,194,138,0.02));
  border: 1px solid rgba(103,194,138,0.2);
}
.highlight-col.worst {
  background: linear-gradient(135deg, rgba(245,108,108,0.08), rgba(245,108,108,0.02));
  border: 1px solid rgba(245,108,108,0.2);
}
.highlight-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
}
.highlight-col.best .highlight-title {
  color: #4ea06a;
}
.highlight-col.worst .highlight-title {
  color: #c94e4e;
}
.highlight-item {
  display: grid;
  grid-template-columns: 90px 50px 1fr;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.7);
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 12px;
}
.highlight-item:last-child {
  margin-bottom: 0;
}
.h-date {
  font-weight: 600;
  color: #2c3e50;
}
.h-score {
  font-weight: 700;
  text-align: center;
}
.highlight-col.best .h-score { color: #4ea06a; }
.highlight-col.worst .h-score { color: #c94e4e; }
.h-time {
  color: #7f8c9b;
  font-size: 11px;
}
.pdf-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.pdf-table th {
  background: #7eb8d8;
  color: #fff;
  padding: 8px 6px;
  text-align: center;
  font-weight: 600;
}
.pdf-table td {
  padding: 7px 6px;
  text-align: center;
  border-bottom: 1px solid #e8eef3;
}
.pdf-table tr:nth-child(even) td {
  background: #f8fbfd;
}
.score-good { color: #67c28a; font-weight: 700; }
.score-warn { color: #e6a23c; font-weight: 700; }
.score-bad { color: #f56c6c; font-weight: 700; }
.pdf-advices {
  padding-left: 18px;
  font-size: 13px;
  line-height: 2;
  color: #2c3e50;
}
.pdf-footer {
  margin-top: 30px;
  padding-top: 16px;
  border-top: 1px solid #d0e9f6;
  text-align: center;
  font-size: 11px;
  color: #7f8c9b;
}
</style>
