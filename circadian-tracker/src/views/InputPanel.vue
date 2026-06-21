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
          <el-form-item label="常用标签">
            <div class="tags-wrap">
              <div class="tags-list">
                <el-tag
                  v-for="tag in store.tags"
                  :key="tag"
                  :type="form.tags.includes(tag) ? 'primary' : 'info'"
                  :effect="form.tags.includes(tag) ? 'dark' : 'plain'"
                  round
                  closable
                  @close="handleRemoveTagFromLib(tag)"
                  @click="toggleTag(tag)"
                  class="tag-item"
                  :class="{ 'tag-active': form.tags.includes(tag) }"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div class="tags-add">
                <el-input
                  v-model="newTagInput"
                  size="small"
                  placeholder="新增标签..."
                  style="width: 120px"
                  @keyup.enter="handleAddNewTag"
                />
                <el-button size="small" type="primary" plain @click="handleAddNewTag" :icon="Plus">
                  添加
                </el-button>
              </div>
            </div>
          </el-form-item>
          <el-form-item v-if="form.tags.length > 0" label="已选标签">
            <div class="selected-tags">
              <el-tag
                v-for="tag in form.tags"
                :key="tag"
                type="primary"
                effect="dark"
                round
                closable
                @close="toggleTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div class="ct-card form-card pre-sleep-card">
        <div class="ct-title collapsible" @click="preSleepCollapsed = !preSleepCollapsed">
          <el-icon><Moon /></el-icon>
          睡前状态
          <el-icon class="collapse-icon" :class="{ collapsed: preSleepCollapsed }"><ArrowDown /></el-icon>
        </div>
        <el-collapse-transition>
          <div v-show="!preSleepCollapsed">
            <el-form :model="form" label-width="100px" label-position="left" size="large">
              <el-form-item label="入睡前心情">
                <div class="mood-selector">
                  <div
                    v-for="mood in moodOptions"
                    :key="mood.value"
                    class="mood-item"
                    :class="{ active: form.preSleepMood === mood.value }"
                    @click="form.preSleepMood = form.preSleepMood === mood.value ? null : mood.value"
                  >
                    <span class="mood-emoji">{{ mood.emoji }}</span>
                    <span class="mood-label">{{ mood.label }}</span>
                  </div>
                </div>
              </el-form-item>
              <el-form-item label="睡前1小时活动">
                <el-checkbox-group v-model="form.preSleepActivities">
                  <div class="activity-checkboxes">
                    <el-checkbox
                      v-for="activity in preSleepActivities"
                      :key="activity.value"
                      :label="activity.value"
                      border
                    >
                      {{ activity.label }}
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="思绪程度">
                <div class="thoughts-slider">
                  <span class="slider-label">脑子空空</span>
                  <el-slider
                    v-model="form.preSleepThoughts"
                    :min="1"
                    :max="5"
                    :step="1"
                    :marks="thoughtsMarks"
                    show-tooltip
                    style="flex: 1; margin: 0 16px"
                  />
                  <span class="slider-label">思绪万千</span>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </el-collapse-transition>
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
import { RefreshLeft, Check, Plus, Moon, ArrowDown } from '@element-plus/icons-vue'
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
  note: '',
  tags: [],
  preSleepMood: null,
  preSleepActivities: [],
  preSleepThoughts: 0,
  morningEnergy: 0,
  dreamStatus: null,
  dreamDescription: '',
  nightWakeUps: null
})

const newTagInput = ref('')
const preSleepCollapsed = ref(false)

const moodOptions = [
  { value: 'happy', label: '愉快', emoji: '😊' },
  { value: 'calm', label: '平静', emoji: '😌' },
  { value: 'excited', label: '兴奋', emoji: '🤩' },
  { value: 'anxious', label: '焦虑', emoji: '😰' },
  { value: 'sad', label: '低落', emoji: '😔' },
  { value: 'angry', label: '烦躁', emoji: '😤' }
]

const preSleepActivities = [
  { value: 'phone', label: '刷手机' },
  { value: 'reading', label: '看书' },
  { value: 'exercise', label: '运动' },
  { value: 'shower', label: '洗澡' },
  { value: 'meditation', label: '冥想' },
  { value: 'other', label: '其他' }
]

const thoughtsMarks = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5'
}

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

function toggleTag(tag) {
  const idx = form.value.tags.indexOf(tag)
  if (idx >= 0) {
    form.value.tags.splice(idx, 1)
  } else {
    form.value.tags.push(tag)
  }
}

async function handleAddNewTag() {
  const val = newTagInput.value.trim()
  if (!val) return
  const ok = await store.addTag(val)
  if (ok) {
    ElMessage.success(`已添加标签「${val}」`)
    if (!form.value.tags.includes(val)) {
      form.value.tags.push(val)
    }
  } else {
    ElMessage.warning('标签已存在或为空')
  }
  newTagInput.value = ''
}

async function handleRemoveTagFromLib(tag) {
  try {
    await ElMessageBox.confirm(`确定从标签库中删除「${tag}」吗？`, '删除标签', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await store.removeTag(tag)
    const idx = form.value.tags.indexOf(tag)
    if (idx >= 0) form.value.tags.splice(idx, 1)
    ElMessage.success('标签已删除')
  } catch {}
}

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
    note: '',
    tags: [],
    preSleepMood: null,
    preSleepActivities: [],
    preSleepThoughts: 0,
    morningEnergy: 0,
    dreamStatus: null,
    dreamDescription: '',
    nightWakeUps: null
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
    form.value = {
      ...form.value,
      ...today,
      tags: today.tags || [],
      preSleepMood: today.preSleepMood || null,
      preSleepActivities: today.preSleepActivities || [],
      preSleepThoughts: today.preSleepThoughts || 0,
      morningEnergy: today.morningEnergy || 0,
      dreamStatus: today.dreamStatus || null,
      dreamDescription: today.dreamDescription || '',
      nightWakeUps: today.nightWakeUps || null
    }
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

.tags-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tags-add {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .tag-item {
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;

    &:hover {
      transform: translateY(-1px);
    }

    &.tag-active {
      box-shadow: 0 2px 8px rgba(126, 184, 216, 0.4);
    }
  }
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pre-sleep-card {
  .ct-title.collapsible {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;

    .collapse-icon {
      margin-left: auto;
      transition: transform 0.3s ease;

      &.collapsed {
        transform: rotate(-90deg);
      }
    }
  }

  .mood-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .mood-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      border: 2px solid var(--ct-border);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--ct-surface);

      &:hover {
        border-color: var(--ct-primary-light);
        transform: translateY(-2px);
      }

      &.active {
        border-color: var(--ct-primary);
        background: var(--ct-primary-lighter);
        box-shadow: 0 2px 8px rgba(126, 184, 216, 0.3);
      }

      .mood-emoji {
        font-size: 28px;
      }

      .mood-label {
        font-size: 12px;
        color: var(--ct-text-secondary);
      }
    }
  }

  .activity-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .thoughts-slider {
    display: flex;
    align-items: center;
    width: 100%;

    .slider-label {
      font-size: 12px;
      color: var(--ct-text-secondary);
      white-space: nowrap;
    }
  }
}

:deep(.el-collapse-transition) {
  transition: all 0.3s ease;
}
</style>
