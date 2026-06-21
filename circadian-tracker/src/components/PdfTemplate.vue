<template>
  <div class="pdf-template" ref="pdfRef" v-if="reportData">
    <div class="pdf-header">
      <div class="pdf-logo">◈</div>
      <h1>月度作息节律报告</h1>
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
import { computed } from 'vue'

const props = defineProps({
  reportData: Object
})

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
  margin-bottom: 24px;
}
.pdf-section h2 {
  font-size: 16px;
  color: #5a9ab8;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #d0e9f6;
}
.pdf-stats {
  display: flex;
  gap: 16px;
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
