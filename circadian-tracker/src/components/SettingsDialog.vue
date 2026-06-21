<template>
  <el-dialog
    v-model="visible"
    title="系统设置"
    width="520px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="settings-content">
      <div class="settings-section">
        <div class="section-title">
          <el-icon><Moon /></el-icon>
          就寝提醒
        </div>
        <div class="setting-row">
          <div class="setting-label">启用提醒</div>
          <el-switch
            v-model="formData.bedtimeReminder.enabled"
            style="--el-switch-on-color: var(--ct-primary)"
          />
        </div>
        <div class="setting-row" v-if="formData.bedtimeReminder.enabled">
          <div class="setting-label">提醒时间</div>
          <el-time-picker
            v-model="formData.bedtimeReminder.time"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择时间"
            :clearable="false"
            style="width: 160px"
          />
        </div>
      </div>

      <div class="settings-section">
        <div class="section-title">
          <el-icon><Warning /></el-icon>
          凌晨未休息提醒
        </div>
        <div class="setting-row">
          <div class="setting-label">启用提醒</div>
          <el-switch
            v-model="formData.lateNightReminder.enabled"
            style="--el-switch-on-color: var(--ct-primary)"
          />
        </div>
        <div class="setting-row" v-if="formData.lateNightReminder.enabled">
          <div class="setting-label">开始时间</div>
          <el-time-picker
            v-model="formData.lateNightReminder.startTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择时间"
            :clearable="false"
            style="width: 160px"
          />
        </div>
      </div>

      <div class="settings-section">
        <div class="section-title">
          <el-icon><Sunny /></el-icon>
          起床打卡提醒
        </div>
        <div class="setting-row">
          <div class="setting-label">启用提醒</div>
          <el-switch
            v-model="formData.wakeUpReminder.enabled"
            style="--el-switch-on-color: var(--ct-primary)"
          />
        </div>
        <div class="setting-row" v-if="formData.wakeUpReminder.enabled">
          <div class="setting-label">目标起床时间</div>
          <el-time-picker
            v-model="formData.wakeUpReminder.time"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择时间"
            :clearable="false"
            style="width: 160px"
          />
        </div>
      </div>

      <div class="settings-section">
        <div class="section-title">
          <el-icon><EditPen /></el-icon>
          每日录入提醒
        </div>
        <div class="setting-row">
          <div class="setting-label">启用提醒</div>
          <el-switch
            v-model="formData.dailyEntryReminder.enabled"
            style="--el-switch-on-color: var(--ct-primary)"
          />
        </div>
        <div class="setting-row" v-if="formData.dailyEntryReminder.enabled">
          <div class="setting-label">提醒时间</div>
          <el-time-picker
            v-model="formData.dailyEntryReminder.time"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择时间"
            :clearable="false"
            style="width: 160px"
          />
        </div>
      </div>

      <div class="settings-section">
        <div class="section-title">
          <el-icon><Monitor /></el-icon>
          启动设置
        </div>
        <div class="setting-row">
          <div class="setting-label">开机自启</div>
          <el-switch
            v-model="formData.autoStart"
            style="--el-switch-on-color: var(--ct-primary)"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">保存设置</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '@/store'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const settingsStore = useSettingsStore()
const visible = ref(props.modelValue)
const saving = ref(false)

const defaultForm = () => ({
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
  autoStart: true
})

const formData = ref(defaultForm())

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    formData.value = JSON.parse(JSON.stringify(settingsStore.settings))
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

function handleClose() {
  visible.value = false
}

function handleSave() {
  saving.value = true
  try {
    settingsStore.saveSettings(formData.value)
    ElMessage.success('设置已保存')
    visible.value = false
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
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
  padding: 16px 20px;
  border: 1px solid var(--ct-border);

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--ct-text);
    margin-bottom: 12px;

    .el-icon {
      color: var(--ct-primary);
      font-size: 16px;
    }
  }
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;

  .setting-label {
    font-size: 13px;
    color: var(--ct-text-secondary);
  }
}

:deep(.el-dialog) {
  --el-dialog-bg-color: var(--ct-surface);
  --el-dialog-title-color: var(--ct-text);
  border-radius: var(--ct-radius);
  border: 1px solid var(--ct-border);
}
</style>
