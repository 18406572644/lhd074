<template>
  <el-dialog
    v-model="visible"
    title="晨间心情记录"
    width="520px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="morning-dialog-content">
      <div class="morning-header">
        <el-icon class="header-icon"><Sunrise /></el-icon>
        <div class="header-text">
          <div class="header-title">早安！今天感觉如何？</div>
          <div class="header-date">{{ todayStr }}</div>
        </div>
      </div>

      <el-form :model="form" label-width="110px" label-position="left" size="large">
        <el-form-item label="起床精神状态">
          <div class="energy-slider">
            <span class="energy-emoji low">😴</span>
            <el-slider
              v-model="form.morningEnergy"
              :min="1"
              :max="10"
              :step="1"
              :marks="energyMarks"
              show-tooltip
              style="flex: 1; margin: 0 12px"
            />
            <span class="energy-emoji high">💪</span>
          </div>
          <div class="energy-value" :class="getEnergyClass(form.morningEnergy)">
            精力值：{{ form.morningEnergy || '--' }} / 10
          </div>
        </el-form-item>

        <el-form-item label="是否做梦">
          <el-radio-group v-model="form.dreamStatus">
            <el-radio-button value="yes">是</el-radio-button>
            <el-radio-button value="no">否</el-radio-button>
            <el-radio-button value="unknown">记不清</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.dreamStatus === 'yes'" label="梦境描述">
          <el-input
            v-model="form.dreamDescription"
            type="textarea"
            :rows="2"
            placeholder="简单描述一下做了什么梦..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="夜间醒来次数">
          <el-radio-group v-model="form.nightWakeUps">
            <el-radio-button value="0">0次</el-radio-button>
            <el-radio-button value="1-2">1-2次</el-radio-button>
            <el-radio-button value="3+">3次以上</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="handleClose">跳过</el-button>
      <el-button type="primary" @click="handleSave" round>保存记录</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Sunrise } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useScheduleStore } from '@/store'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const store = useScheduleStore()
const visible = ref(props.modelValue)

const todayStr = computed(() => dayjs().format('YYYY年MM月DD日'))

const energyMarks = {
  1: '1',
  3: '3',
  5: '5',
  7: '7',
  10: '10'
}

const DEFAULT_FORM = () => ({
  morningEnergy: 0,
  dreamStatus: null,
  dreamDescription: '',
  nightWakeUps: null
})

const form = ref(DEFAULT_FORM())

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    if (props.initialData) {
      form.value = {
        morningEnergy: props.initialData.morningEnergy || 0,
        dreamStatus: props.initialData.dreamStatus || null,
        dreamDescription: props.initialData.dreamDescription || '',
        nightWakeUps: props.initialData.nightWakeUps || null
      }
    } else {
      form.value = DEFAULT_FORM()
    }
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

function getEnergyClass(value) {
  if (!value) return ''
  if (value >= 8) return 'good'
  if (value >= 5) return 'medium'
  return 'low'
}

function handleClose() {
  visible.value = false
}

async function handleSave() {
  const today = dayjs().format('YYYY-MM-DD')
  const existingRecord = store.records.find(r => r.date === today)

  const recordData = {
    date: today,
    bedtime: existingRecord?.bedtime || '23:00',
    wakeTime: existingRecord?.wakeTime || '07:00',
    deepSleep: existingRecord?.deepSleep || 120,
    lightSleep: existingRecord?.lightSleep || 240,
    napMin: existingRecord?.napMin || 0,
    caffeineMg: existingRecord?.caffeineMg || 0,
    screenMin: existingRecord?.screenMin || 0,
    note: existingRecord?.note || '',
    tags: existingRecord?.tags || [],
    preSleepMood: existingRecord?.preSleepMood || null,
    preSleepActivities: existingRecord?.preSleepActivities || [],
    preSleepThoughts: existingRecord?.preSleepThoughts || 0,
    morningEnergy: form.value.morningEnergy,
    dreamStatus: form.value.dreamStatus,
    dreamDescription: form.value.dreamDescription,
    nightWakeUps: form.value.nightWakeUps
  }

  await store.addRecord(recordData)
  ElMessage.success('晨间记录已保存')
  emit('saved', recordData)
  visible.value = false
}
</script>

<style lang="scss" scoped>
.morning-dialog-content {
  .morning-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #fff7e6 0%, #ffe8cc 100%);
    border-radius: 12px;

    .header-icon {
      font-size: 36px;
      color: #e6a23c;
    }

    .header-text {
      .header-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--ct-text);
      }

      .header-date {
        font-size: 13px;
        color: var(--ct-text-secondary);
        margin-top: 2px;
      }
    }
  }

  .energy-slider {
    display: flex;
    align-items: center;
    width: 100%;

    .energy-emoji {
      font-size: 24px;

      &.low {
        opacity: 0.8;
      }

      &.high {
        opacity: 0.9;
      }
    }
  }

  .energy-value {
    text-align: center;
    margin-top: 8px;
    font-size: 14px;
    font-weight: 600;

    &.good { color: #67c28a; }
    &.medium { color: #e6a23c; }
    &.low { color: #f56c6c; }
  }
}

:deep(.el-dialog) {
  --el-dialog-bg-color: var(--ct-surface);
  --el-dialog-title-color: var(--ct-text);
  border-radius: var(--ct-radius);
  border: 1px solid var(--ct-border);
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  color: var(--ct-text-secondary);
  font-size: 13px;
}
</style>
