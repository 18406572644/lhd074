<template>
  <div class="input-panel">
    <h2 class="page-title">
      <el-icon><EditPen /></el-icon>
      作息手动录入
    </h2>

    <div class="input-body">
      <div class="ct-card form-card">
        <div class="ct-title">
          <el-icon><Calendar /></el-icon>
          基础作息信息
        </div>
        <el-form :model="form" label-width="100px" label-position="left" size="large">
          <el-form-item label="日期">
            <el-date-picker
              v-model="form.date"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :clearable="false"
              style="width: 100%"
            />
          </el-form-item>
          <div class="time-row">
            <el-form-item label="入睡时间">
              <el-time-picker
                v-model="form.bedtime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择时间"
                :clearable="false"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="起床时间">
              <el-time-picker
                v-model="form.wakeTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择时间"
                :clearable="false"
                style="width: 100%"
              />
            </el-form-item>
          </div>
        </el-form>
      </div>

      <div class="ct-card form-card">
        <div class="ct-title">
          <el-icon><Timer /></el-icon>
          睡眠详情
        </div>
        <el-form :model="form" label-width="100px" label-position="left" size="large">
          <div class="time-row">
            <el-form-item label="深睡时长">
              <el-input-number v-model="form.deepSleep" :min="0" :max="600" :step="10" controls-position="right" />
              <span class="unit">分钟</span>
            </el-form-item>
            <el-form-item label="浅睡时长">
              <el-input-number v-model="form.lightSleep" :min="0" :max="600" :step="10" controls-position="right" />
              <span class="unit">分钟</span>
            </el-form-item>
          </div>
          <el-form-item label="日间小憩">
            <el-input-number v-model="form.napMin" :min="0" :max="300" :step="5" controls-position="right" />
            <span class="unit">分钟</span>
          </el-form-item>
        </el-form>
      </div>

      <div class="ct-card form-card">
        <div class="ct-title">
          <el-icon><Coffee /></el-icon>
          生活因素记录
        </div>
        <el-form :model="form" label-width="100px" label-position="left" size="large">
          <el-form-item label="咖啡因摄入">
            <el-input-number v-model="form.caffeineMg" :min="0" :max="1000" :step="25" controls-position="right" />
            <span class="unit">mg</span>
          </el-form-item>
          <el-form-item label="用眼时长">
            <el-input-number v-model="form.screenMin" :min="0" :max="960" :step="15" controls-position="right" />
            <span class="unit">分钟</span>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.note" type="textarea" :rows="2" placeholder="记录今日特殊状况..." />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="input-footer">
      <div class="ct-card score-preview" v-if="previewScore > 0">
        <div class="score-ring">
          <svg viewBox="0 0 100 100">
            <circle class="score-bg" cx="50" cy="50" r="42" />
            <circle class="score-fill" cx="50" cy="50" r="42"
                    :stroke-dasharray="`${previewScore * 2.64} 264`"
                    :class="scoreClass" />
          </svg>
          <div class="score-number" :class="scoreClass">{{ previewScore }}</div>
        </div>
        <div class="score-desc">
          <div class="score-title">预估睡眠评分</div>
          <div class="score-text">{{ scoreDesc }}</div>
        </div>
      </div>
      <div class="footer-buttons">
        <el-button @click="resetForm" :icon="RefreshLeft">重置</el-button>
        <el-button type="primary" @click="submitForm" :icon="Check" round size="large">
          保存记录
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RefreshLeft, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { useScheduleStore } from '@/store'

const store = useScheduleStore()

const form = ref({
  date: dayjs().format('YYYY-MM-DD'),
  bedtime: '23:00',
  wakeTime: '07:00',
  deepSleep: 120,
  lightSleep: 240,
  napMin: 0,
  caffeineMg: 0,
  screenMin: 0,
  note: ''
})

const previewScore = computed(() => {
  return store.calcSleepScore(form.value)
})

const scoreClass = computed(() => {
  const s = previewScore.value
  if (s >= 80) return 'good'
  if (s >= 60) return 'warn'
  return 'bad'
})

const scoreDesc = computed(() => {
  const s = previewScore.value
  if (s >= 80) return '睡眠质量优秀，继续保持当前作息节律'
  if (s >= 60) return '睡眠质量尚可，部分指标可进一步优化'
  if (s >= 40) return '睡眠质量欠佳，建议调整作息习惯'
  return '睡眠质量较差，请重视作息健康'
})

function resetForm() {
  form.value = {
    date: dayjs().format('YYYY-MM-DD'),
    bedtime: '23:00',
    wakeTime: '07:00',
    deepSleep: 120,
    lightSleep: 240,
    napMin: 0,
    caffeineMg: 0,
    screenMin: 0,
    note: ''
  }
}

async function submitForm() {
  if (!form.value.date || !form.value.bedtime || !form.value.wakeTime) {
    ElMessage.warning('请完整填写日期和作息时间')
    return
  }
  await store.addRecord({ ...form.value })

  const score = store.calcSleepScore(form.value)
  if (score < 50) {
    ElMessageBox.alert(
      `当前睡眠评分仅 ${score} 分，作息异常！建议尽早入睡并保证充足睡眠时长。`,
      '作息异常提醒',
      { confirmButtonText: '知道了', type: 'warning' }
    )
  } else {
    ElMessage.success('作息记录已保存')
  }

  checkAbnormal()
}

function checkAbnormal() {
  const r = form.value
  const goals = store.goals
  const warnings = []
  const bedtime = dayjs(`${r.date} ${r.bedtime}`)
  const target = dayjs(`${r.date} ${goals.targetBedtime}`)
  if (bedtime.isAfter(target.add(60, 'minute'))) {
    warnings.push('入睡时间偏离目标超过1小时')
  }
  if ((r.caffeineMg || 0) > goals.maxCaffeineMg) {
    warnings.push('咖啡因摄入超出目标上限')
  }
  if (warnings.length > 0 && window.electronAPI) {
    window.electronAPI.showNotification('作息异常提醒', warnings.join('；'))
  }
}

onMounted(() => {
  const today = store.todayRecord
  if (today) {
    form.value = { ...form.value, ...today }
  }
})
</script>

<style lang="scss" scoped>
.input-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;

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

.input-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  .form-card {
    .time-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
    }

    .unit {
      margin-left: 8px;
      color: var(--ct-text-secondary);
      font-size: 13px;
      white-space: nowrap;
    }
  }
}

.input-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-top: 8px;

  .footer-buttons {
    display: flex;
    gap: 12px;
  }
}

.score-preview {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 24px;

  .score-ring {
    position: relative;
    width: 80px;
    height: 80px;

    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .score-bg {
      fill: none;
      stroke: var(--ct-border);
      stroke-width: 6;
    }

    .score-fill {
      fill: none;
      stroke-width: 6;
      stroke-linecap: round;
      transition: stroke-dasharray 0.6s ease;

      &.good { stroke: #67c28a; }
      &.warn { stroke: #e6a23c; }
      &.bad { stroke: #f56c6c; }
    }

    .score-number {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 22px;
      font-weight: 800;

      &.good { color: #67c28a; }
      &.warn { color: #e6a23c; }
      &.bad { color: #f56c6c; }
    }
  }

  .score-desc {
    .score-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--ct-text);
      margin-bottom: 4px;
    }
    .score-text {
      font-size: 12px;
      color: var(--ct-text-secondary);
      max-width: 180px;
      line-height: 1.4;
    }
  }
}
</style>
