<template>
  <el-dialog
    v-model="visible"
    title="导出作息报告"
    width="520px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="report-dialog-body">
      <div class="form-section">
        <div class="section-title">
          <el-icon><Calendar /></el-icon>
          选择报告周期
        </div>
        <el-radio-group v-model="period" class="period-group" @change="handlePeriodChange">
          <el-radio-button
            v-for="opt in periodOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
        <div class="custom-range" v-if="period === 'custom'">
          <el-date-picker
            v-model="customRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :editable="false"
          />
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          选择导出格式
        </div>
        <div class="format-grid">
          <div
            v-for="fmt in formatOptions"
            :key="fmt.value"
            class="format-card"
            :class="{ active: selectedFormat === fmt.value }"
            @click="selectedFormat = fmt.value"
          >
            <div class="format-icon" :style="{ background: fmt.color }">
              <el-icon :size="26"><component :is="fmt.icon" /></el-icon>
            </div>
            <div class="format-info">
              <div class="format-name">{{ fmt.label }}</div>
              <div class="format-desc">{{ fmt.desc }}</div>
            </div>
            <el-icon v-if="selectedFormat === fmt.value" class="check-icon"><CircleCheckFilled /></el-icon>
          </div>
        </div>
      </div>

      <div class="preview-hint" v-if="previewInfo">
        <el-icon><InfoFilled /></el-icon>
        <span>将导出 {{ previewInfo }}</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="exporting"
        @click="handleExport"
        :disabled="!canExport"
      >
        <el-icon><Download /></el-icon>
        {{ exporting ? '正在导出...' : '开始导出' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { PERIOD_OPTIONS, getDateRange, generateReport } from '@/utils/pdf'
import { useScheduleStore } from '@/store'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'export'])

const store = useScheduleStore()
const periodOptions = PERIOD_OPTIONS

const formatOptions = [
  {
    value: 'pdf',
    label: 'PDF 文档',
    desc: '含图表和完整排版，适合存档分享',
    icon: 'Document',
    color: 'linear-gradient(135deg,#7eb8d8,#5a9ab8)'
  },
  {
    value: 'csv',
    label: 'Excel (CSV)',
    desc: '表格数据格式，可直接用 Excel 打开',
    icon: 'Grid',
    color: 'linear-gradient(135deg,#67c28a,#4ea06a)'
  },
  {
    value: 'png',
    label: 'PNG 长图',
    desc: '高清图片格式，便于分享到社交平台',
    icon: 'Picture',
    color: 'linear-gradient(135deg,#e6a23c,#c88530)'
  }
]

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const period = ref('30d')
const customRange = ref([
  dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD')
])
const selectedFormat = ref('pdf')
const exporting = ref(false)

const canExport = computed(() => {
  if (period.value === 'custom') {
    return customRange.value && customRange.value.length === 2
  }
  return true
})

const previewInfo = computed(() => {
  const { start, end } = getCurrentRange()
  const days = dayjs(end).diff(dayjs(start), 'day') + 1
  const fmtName = formatOptions.find(f => f.value === selectedFormat.value)?.label || ''
  return `${start} 至 ${end}（共 ${days} 天）的${fmtName}`
})

function getCurrentRange() {
  if (period.value === 'custom' && customRange.value?.length === 2) {
    return { start: customRange.value[0], end: customRange.value[1] }
  }
  return getDateRange(period.value)
}

function handlePeriodChange() {
  if (period.value === 'custom' && (!customRange.value || customRange.value.length !== 2)) {
    const { start, end } = getDateRange('30d')
    customRange.value = [start, end]
  }
}

async function handleExport() {
  if (!canExport.value) return

  exporting.value = true
  try {
    const { start, end } = getCurrentRange()
    const report = await generateReport(
      store,
      period.value,
      start,
      end
    )

    if (!report) {
      ElMessage.warning('所选时间段暂无数据，请选择其他范围')
      return
    }

    emit('export', {
      format: selectedFormat.value,
      report,
      period: period.value,
      start,
      end
    })
  } finally {
    exporting.value = false
  }
}

function handleClose() {
  if (!exporting.value) {
    visible.value = false
  }
}

watch(visible, (v) => {
  if (v) {
    period.value = '30d'
    selectedFormat.value = 'pdf'
    const { start, end } = getDateRange('30d')
    customRange.value = [start, end]
  }
})
</script>

<style lang="scss" scoped>
.report-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: var(--ct-text);
    margin-bottom: 12px;

    .el-icon {
      color: var(--ct-primary);
    }
  }
}

.period-group {
  width: 100%;
  display: flex;

  :deep(.el-radio-button__inner) {
    padding: 10px 16px;
  }
}

.custom-range {
  margin-top: 12px;

  :deep(.el-date-editor) {
    width: 100%;
  }
}

.format-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.format-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 2px solid var(--ct-border);
  background: var(--ct-bg);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: var(--ct-primary-light);
    background: rgba(126, 184, 216, 0.04);
  }

  &.active {
    border-color: var(--ct-primary);
    background: rgba(126, 184, 216, 0.08);
  }

  .format-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  .format-info {
    flex: 1;

    .format-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--ct-text);
    }

    .format-desc {
      font-size: 12px;
      color: var(--ct-text-secondary);
      margin-top: 2px;
    }
  }

  .check-icon {
    color: var(--ct-primary);
    font-size: 22px;
  }
}

.preview-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(126, 184, 216, 0.08);
  border-radius: 8px;
  font-size: 13px;
  color: var(--ct-text-secondary);

  .el-icon {
    color: var(--ct-primary);
  }
}
</style>
