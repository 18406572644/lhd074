<template>
  <el-dialog
    v-model="visible"
    title="系统设置"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="left"
    >
      <div class="settings-content">
        <div class="settings-section">
          <div class="section-header">
            <div class="section-title">
              <el-icon><Moon /></el-icon>
              就寝提醒
            </div>
            <el-button
              v-if="formData.bedtimeReminder.enabled"
              size="small"
              type="primary"
              link
              @click="handleTestReminder('bedtime')"
            >
              <el-icon><Bell /></el-icon>
              测试
            </el-button>
          </div>
          <el-form-item label="启用提醒" prop="bedtimeReminder.enabled">
            <el-switch
              v-model="formData.bedtimeReminder.enabled"
              style="--el-switch-on-color: var(--ct-primary)"
            />
          </el-form-item>
          <el-form-item
            v-if="formData.bedtimeReminder.enabled"
            label="提醒时间"
            prop="bedtimeReminder.time"
          >
            <el-time-picker
              v-model="formData.bedtimeReminder.time"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择时间"
              :clearable="false"
              style="width: 160px"
            />
          </el-form-item>
        </div>

        <div class="settings-section">
          <div class="section-header">
            <div class="section-title">
              <el-icon><Warning /></el-icon>
              凌晨未休息提醒
            </div>
            <el-button
              v-if="formData.lateNightReminder.enabled"
              size="small"
              type="primary"
              link
              @click="handleTestReminder('lateNight')"
            >
              <el-icon><Bell /></el-icon>
              测试
            </el-button>
          </div>
          <el-form-item label="启用提醒" prop="lateNightReminder.enabled">
            <el-switch
              v-model="formData.lateNightReminder.enabled"
              style="--el-switch-on-color: var(--ct-primary)"
            />
          </el-form-item>
          <el-form-item
            v-if="formData.lateNightReminder.enabled"
            label="开始时间"
            prop="lateNightReminder.startTime"
          >
            <el-time-picker
              v-model="formData.lateNightReminder.startTime"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择时间"
              :clearable="false"
              style="width: 160px"
            />
          </el-form-item>
        </div>

        <div class="settings-section">
          <div class="section-header">
            <div class="section-title">
              <el-icon><Sunny /></el-icon>
              起床打卡提醒
            </div>
            <el-button
              v-if="formData.wakeUpReminder.enabled"
              size="small"
              type="primary"
              link
              @click="handleTestReminder('wakeUp')"
            >
              <el-icon><Bell /></el-icon>
              测试
            </el-button>
          </div>
          <el-form-item label="启用提醒" prop="wakeUpReminder.enabled">
            <el-switch
              v-model="formData.wakeUpReminder.enabled"
              style="--el-switch-on-color: var(--ct-primary)"
            />
          </el-form-item>
          <el-form-item
            v-if="formData.wakeUpReminder.enabled"
            label="目标起床时间"
            prop="wakeUpReminder.time"
          >
            <el-time-picker
              v-model="formData.wakeUpReminder.time"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择时间"
              :clearable="false"
              style="width: 160px"
            />
          </el-form-item>
        </div>

        <div class="settings-section">
          <div class="section-header">
            <div class="section-title">
              <el-icon><EditPen /></el-icon>
              每日录入提醒
            </div>
            <el-button
              v-if="formData.dailyEntryReminder.enabled"
              size="small"
              type="primary"
              link
              @click="handleTestReminder('dailyEntry')"
            >
              <el-icon><Bell /></el-icon>
              测试
            </el-button>
          </div>
          <el-form-item label="启用提醒" prop="dailyEntryReminder.enabled">
            <el-switch
              v-model="formData.dailyEntryReminder.enabled"
              style="--el-switch-on-color: var(--ct-primary)"
            />
          </el-form-item>
          <el-form-item
            v-if="formData.dailyEntryReminder.enabled"
            label="提醒时间"
            prop="dailyEntryReminder.time"
          >
            <el-time-picker
              v-model="formData.dailyEntryReminder.time"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择时间"
              :clearable="false"
              style="width: 160px"
            />
          </el-form-item>
        </div>

        <div class="settings-section">
          <div class="section-header">
            <div class="section-title">
              <el-icon><Sunrise /></el-icon>
              晨间记录弹窗
            </div>
            <el-button
              v-if="formData.morningEntryReminder.enabled"
              size="small"
              type="primary"
              link
              @click="handleTestReminder('morningEntry')"
            >
              <el-icon><Bell /></el-icon>
              测试
            </el-button>
          </div>
          <el-form-item label="自动弹出" prop="morningEntryReminder.enabled">
            <el-switch
              v-model="formData.morningEntryReminder.enabled"
              style="--el-switch-on-color: var(--ct-primary)"
            />
          </el-form-item>
          <el-form-item
            v-if="formData.morningEntryReminder.enabled"
            label="弹窗时间"
            prop="morningEntryReminder.time"
          >
            <el-time-picker
              v-model="formData.morningEntryReminder.time"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择时间"
              :clearable="false"
              style="width: 160px"
            />
          </el-form-item>
        </div>

        <div class="settings-section">
          <div class="section-header">
            <div class="section-title">
              <el-icon><MagicStick /></el-icon>
              智能目标推荐
            </div>
            <el-button
              v-if="formData.smartRecommend?.enabled"
              size="small"
              type="primary"
              link
              @click="handleCalibrateNow"
            >
              <el-icon><RefreshRight /></el-icon>
              立即校准
            </el-button>
          </div>
          <el-form-item label="启用推荐">
            <el-switch
              v-model="formData.smartRecommend.enabled"
              style="--el-switch-on-color: var(--ct-primary)"
            />
          </el-form-item>
          <el-form-item
            v-if="formData.smartRecommend?.enabled"
            label="推荐策略"
          >
            <el-radio-group v-model="formData.smartRecommend.percentile" size="small">
              <el-radio-button value="p50">P50 适中</el-radio-button>
              <el-radio-button value="p75">P75 进取</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            v-if="formData.smartRecommend?.enabled"
            label="自动校准"
          >
            <div class="calibrate-info">
              <span class="calibrate-label">每周自动校准目标值</span>
              <span class="calibrate-date">上次校准：{{ lastCalibratedLabel }}</span>
            </div>
          </el-form-item>
          <div v-if="formData.smartRecommend?.enabled && smartRecPreview?.available" class="smart-rec-preview">
            <div class="preview-item">
              <span class="preview-label">推荐入睡</span>
              <span class="preview-value">{{ smartRecPreview[formData.smartRecommend.percentile || 'p50']?.targetBedtime || '--:--' }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">推荐起床</span>
              <span class="preview-value">{{ smartRecPreview[formData.smartRecommend.percentile || 'p50']?.targetWakeTime || '--:--' }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">推荐时长</span>
              <span class="preview-value">{{ smartRecPreview[formData.smartRecommend.percentile || 'p50']?.targetSleepHours || '--' }}h</span>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-title">
            <el-icon><Monitor /></el-icon>
            启动设置
          </div>
          <el-form-item label="开机自启" prop="autoStart">
            <el-switch
              v-model="formData.autoStart"
              style="--el-switch-on-color: var(--ct-primary)"
            />
          </el-form-item>
        </div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">保存设置</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSettingsStore, useScheduleStore } from '@/store'
import { calcSmartRecommendation } from '@/utils/prediction'
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const settingsStore = useSettingsStore()
const scheduleStore = useScheduleStore()
const visible = ref(props.modelValue)
const saving = ref(false)
const testing = ref(false)
const formRef = ref(null)
const originalBackup = ref(null)

const DEFAULT_FORM = () => ({
  bedtimeReminder: {
    enabled: true,
    time: '23:00'
  },
  lateNightReminder: {
    enabled: true,
    startTime: '01:00'
  },
  wakeUpReminder: {
    enabled: false,
    time: '07:00'
  },
  dailyEntryReminder: {
    enabled: true,
    time: '22:30'
  },
  morningEntryReminder: {
    enabled: false,
    time: '07:30'
  },
  autoStart: true,
  smartRecommend: {
    enabled: false,
    percentile: 'p50',
    lastCalibrated: null
  }
})

const formData = ref(DEFAULT_FORM())

const validateTimeRequired = (_rule, value, callback) => {
  if (!value || typeof value !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
    callback(new Error('请选择有效的时间 (HH:mm)'))
  } else {
    callback()
  }
}

const formRules = computed(() => ({
  'bedtimeReminder.time': [
    { validator: validateTimeRequired, trigger: 'change' }
  ],
  'lateNightReminder.startTime': [
    { validator: validateTimeRequired, trigger: 'change' }
  ],
  'wakeUpReminder.time': [
    { validator: validateTimeRequired, trigger: 'change' }
  ],
  'dailyEntryReminder.time': [
    { validator: validateTimeRequired, trigger: 'change' }
  ],
  'morningEntryReminder.time': [
    { validator: validateTimeRequired, trigger: 'change' }
  ]
}))

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    formData.value = JSON.parse(JSON.stringify(settingsStore.settings))
    originalBackup.value = JSON.parse(JSON.stringify(settingsStore.settings))
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

function handleClose() {
  if (originalBackup.value) {
    formData.value = JSON.parse(JSON.stringify(originalBackup.value))
  }
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  visible.value = false
}

async function validateEnabledFields() {
  const errors = []
  const check = (enabled, field, label) => {
    if (enabled) {
      if (!field || typeof field !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(field)) {
        errors.push(label)
      }
    }
  }
  check(formData.value.bedtimeReminder.enabled, formData.value.bedtimeReminder.time, '就寝提醒时间')
  check(formData.value.lateNightReminder.enabled, formData.value.lateNightReminder.startTime, '凌晨未休息提醒开始时间')
  check(formData.value.wakeUpReminder.enabled, formData.value.wakeUpReminder.time, '起床打卡提醒时间')
  check(formData.value.dailyEntryReminder.enabled, formData.value.dailyEntryReminder.time, '每日录入提醒时间')
  check(formData.value.morningEntryReminder.enabled, formData.value.morningEntryReminder.time, '晨间记录弹窗时间')
  return errors
}

async function handleSave() {
  saving.value = true
  try {
    const errors = await validateEnabledFields()
    if (errors.length > 0) {
      ElMessage.error('请完善以下字段：' + errors.join('、'))
      return
    }
    if (formRef.value) {
      try {
        await formRef.value.validate()
      } catch {
        ElMessage.error('请检查表单字段是否正确填写')
        return
      }
    }
    const result = await settingsStore.saveSettings(formData.value)
    if (result && result.success) {
      originalBackup.value = JSON.parse(JSON.stringify(formData.value))
      if (formData.value.smartRecommend) {
        await scheduleStore.saveGoals({
          smartRecommend: formData.value.smartRecommend
        })
      }
      ElMessage.success('设置已保存并生效')
      visible.value = false
    } else {
      ElMessage.error(result?.message || '保存失败，请重试')
    }
  } catch (err) {
    console.error('Save error:', err)
    ElMessage.error(err.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

async function handleTestReminder(type) {
  testing.value = true
  try {
    const result = await settingsStore.testReminder(type)
    if (result && result.success) {
      ElMessage.success('测试通知已发送，请查看系统通知')
    } else {
      ElMessage.error(result?.message || '测试失败')
    }
  } catch (err) {
    ElMessage.error(err.message || '测试失败')
  } finally {
    testing.value = false
  }
}

const smartRecPreview = computed(() => {
  return calcSmartRecommendation(scheduleStore.getLast30Days())
})

const lastCalibratedLabel = computed(() => {
  const lc = formData.value.smartRecommend?.lastCalibrated
  if (!lc) return '从未校准'
  return dayjs(lc).format('YYYY-MM-DD')
})

async function handleCalibrateNow() {
  const rec = smartRecPreview.value
  if (!rec || !rec.available) {
    ElMessage.warning('数据不足，无法校准（需至少7天数据）')
    return
  }
  const percentile = formData.value.smartRecommend?.percentile || 'p50'
  const preset = rec[percentile]
  try {
    await ElMessageBox.confirm(
      `将立即校准目标为：入睡 ${preset.targetBedtime}、起床 ${preset.targetWakeTime}、时长 ${preset.targetSleepHours}h，是否继续？`,
      '立即校准',
      { confirmButtonText: '校准', cancelButtonText: '取消', type: 'info' }
    )
    const ok = await scheduleStore.applySmartRecommendation(rec, percentile)
    if (ok) {
      formData.value.smartRecommend.lastCalibrated = dayjs().format('YYYY-MM-DD')
      ElMessage.success('目标已校准')
    } else {
      ElMessage.error('校准失败')
    }
  } catch {}
}
</script>

<style lang="scss" scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-section {
  background: var(--ct-bg);
  border-radius: var(--ct-radius);
  padding: 8px 20px 4px;
  border: 1px solid var(--ct-border);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ct-text);
  padding: 12px 0 4px;

  .el-icon {
    color: var(--ct-primary);
    font-size: 16px;
  }
}

:deep(.el-dialog) {
  --el-dialog-bg-color: var(--ct-surface);
  --el-dialog-title-color: var(--ct-text);
  border-radius: var(--ct-radius);
  border: 1px solid var(--ct-border);
}

:deep(.el-form-item) {
  margin-bottom: 14px;
}

:deep(.el-form-item__label) {
  color: var(--ct-text-secondary);
  font-size: 13px;
}

.calibrate-info {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .calibrate-label {
    font-size: 13px;
    color: var(--ct-text);
  }

  .calibrate-date {
    font-size: 11px;
    color: var(--ct-text-secondary);
  }
}

.smart-rec-preview {
  display: flex;
  gap: 16px;
  padding: 10px 14px;
  background: var(--ct-primary-lighter);
  border-radius: 8px;
  margin-bottom: 12px;

  .preview-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    .preview-label {
      font-size: 11px;
      color: var(--ct-text-secondary);
    }

    .preview-value {
      font-size: 15px;
      font-weight: 700;
      color: var(--ct-primary-dark);
    }
  }
}
</style>
