<template>
  <div class="import-view">
    <h2 class="page-title">
      <el-icon><Upload /></el-icon>
      数据导入
    </h2>

    <div class="wizard-container">
      <div class="steps-bar">
        <div
          v-for="(step, idx) in steps"
          :key="idx"
          class="step-item"
          :class="{ active: currentStep === idx, done: currentStep > idx }"
          @click="idx < currentStep && goToStep(idx)"
        >
          <div class="step-circle">{{ idx + 1 }}</div>
          <div class="step-label">{{ step }}</div>
        </div>
        <div class="step-line" :style="{ width: `${Math.max(0, currentStep) / (steps.length - 1) * 100}%` }"></div>
      </div>

      <div class="step-content">
        <transition name="fade" mode="out-in">
          <div v-if="currentStep === 0" key="step0" class="step-panel">
            <div class="ct-card">
              <div class="ct-title">
                <el-icon><FolderOpened /></el-icon>
                选择数据来源并上传文件
              </div>
              <div class="source-grid">
                <div
                  v-for="src in PRESET_SOURCES"
                  :key="src.id"
                  class="source-card"
                  :class="{ selected: selectedSource === src.id }"
                  @click="selectSource(src.id)"
                >
                  <div class="source-icon">
                    <el-icon :size="28">
                      <component :is="sourceIcons[src.id]" />
                    </el-icon>
                  </div>
                  <div class="source-info">
                    <div class="source-name">{{ src.name }}</div>
                    <div class="source-desc">{{ src.description }}</div>
                  </div>
                  <el-icon v-if="selectedSource === src.id" class="source-check" color="#7eb8d8"><Check /></el-icon>
                </div>
              </div>

              <div class="upload-area" v-if="selectedSource">
                <el-upload
                  ref="uploadRef"
                  :auto-upload="false"
                  :limit="1"
                  :on-change="handleFileChange"
                  :on-remove="handleFileRemove"
                  accept=".csv,.json"
                  drag
                >
                  <el-icon :size="40" color="#7eb8d8"><UploadFilled /></el-icon>
                  <div class="upload-text">将文件拖到此处，或<em>点击上传</em></div>
                  <template #tip>
                    <div class="upload-tip">支持 CSV / JSON 格式，文件大小不超过 10MB</div>
                  </template>
                </el-upload>
              </div>

              <div class="sample-download" v-if="selectedSource">
                <el-divider content-position="left">参考模板文件</el-divider>
                <div class="sample-btns">
                  <el-button type="primary" plain size="small" @click="downloadSample('csv')">
                    <el-icon><Download /></el-icon>
                    下载 CSV 模板
                  </el-button>
                  <el-button type="primary" plain size="small" @click="downloadSample('json')">
                    <el-icon><Download /></el-icon>
                    下载 JSON 模板
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 1" key="step1" class="step-panel">
            <div class="ct-card">
              <div class="ct-title">
                <el-icon><Connection /></el-icon>
                字段映射
              </div>
              <div class="mapping-header">
                <span class="mapping-hint">将左侧系统字段与右侧文件列名进行匹配</span>
                <div class="mapping-actions">
                  <el-select
                    v-model="selectedTemplateId"
                    placeholder="加载映射模板"
                    size="small"
                    clearable
                    style="width: 160px"
                    @change="applyTemplate"
                  >
                    <el-option
                      v-for="tpl in mappingTemplates"
                      :key="tpl.id"
                      :label="tpl.name"
                      :value="tpl.id"
                    />
                  </el-select>
                  <el-button size="small" type="primary" plain @click="showSaveTemplate = true">
                    <el-icon><FolderAdd /></el-icon>
                    保存模板
                  </el-button>
                </div>
              </div>

              <div class="mapping-table">
                <div class="mapping-row mapping-header-row">
                  <div class="mapping-sys-col">系统字段</div>
                  <div class="mapping-arrow"></div>
                  <div class="mapping-file-col">文件列名</div>
                  <div class="mapping-preview-col">数据示例</div>
                </div>
                <div
                  v-for="field in SYSTEM_FIELDS"
                  :key="field.key"
                  class="mapping-row"
                  :class="{ 'mapping-required': field.required }"
                >
                  <div class="mapping-sys-col">
                    <span class="field-label">{{ field.label }}</span>
                    <el-tag v-if="field.required" size="small" type="danger" effect="dark" round>必填</el-tag>
                  </div>
                  <div class="mapping-arrow">
                    <el-icon><Right /></el-icon>
                  </div>
                  <div class="mapping-file-col">
                    <el-select
                      v-model="fieldMapping[field.key]"
                      placeholder="选择列"
                      clearable
                      filterable
                      size="default"
                      style="width: 100%"
                      @change="onMappingChange"
                    >
                      <el-option
                        v-for="col in fileColumns"
                        :key="col"
                        :label="col"
                        :value="col"
                      />
                    </el-select>
                  </div>
                  <div class="mapping-preview-col">
                    <span class="preview-text">{{ getPreviewData(field.key) }}</span>
                  </div>
                </div>
              </div>

              <div class="auto-match-hint" v-if="unmappedRequired.length > 0">
                <el-icon color="#e6a23c"><Warning /></el-icon>
                <span>必填字段「{{ unmappedRequired.join('、') }}」尚未映射</span>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 2" key="step2" class="step-panel">
            <div class="ct-card">
              <div class="ct-title">
                <el-icon><View /></el-icon>
                数据预览与冲突处理
              </div>

              <div class="preview-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ previewData.length }}</span>
                  <span class="stat-label">总记录</span>
                </div>
                <div class="stat-item stat-new">
                  <span class="stat-value">{{ newCount }}</span>
                  <span class="stat-label">新记录</span>
                </div>
                <div class="stat-item stat-conflict">
                  <span class="stat-value">{{ conflictCount }}</span>
                  <span class="stat-label">冲突记录</span>
                </div>
                <div class="stat-item stat-warning">
                  <span class="stat-value">{{ warningCount }}</span>
                  <span class="stat-label">警告</span>
                </div>
              </div>

              <div class="conflict-strategy" v-if="conflictCount > 0">
                <div class="strategy-label">冲突处理策略：</div>
                <el-radio-group v-model="conflictStrategy" size="small">
                  <el-radio-button value="skip">跳过冲突</el-radio-button>
                  <el-radio-button value="overwrite">覆盖已有</el-radio-button>
                  <el-radio-button value="merge">合并（取较完整者）</el-radio-button>
                </el-radio-group>
              </div>

              <div class="preview-table-wrap">
                <el-table
                  :data="previewData.slice(0, 50)"
                  size="small"
                  border
                  :row-class-name="previewRowClass"
                  max-height="360"
                >
                  <el-table-column label="状态" width="80" align="center">
                    <template #default="{ row }">
                      <el-tag
                        :type="row._conflict === 'new' ? 'success' : 'warning'"
                        size="small"
                        effect="dark"
                        round
                      >
                        {{ row._conflict === 'new' ? '新增' : '冲突' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="date" label="日期" width="110" />
                  <el-table-column prop="bedtime" label="入睡" width="70" />
                  <el-table-column prop="wakeTime" label="起床" width="70" />
                  <el-table-column prop="deepSleep" label="深睡(分)" width="80" />
                  <el-table-column prop="lightSleep" label="浅睡(分)" width="80" />
                  <el-table-column prop="napMin" label="小憩(分)" width="80" />
                  <el-table-column label="警告" min-width="120">
                    <template #default="{ row }">
                      <span v-if="row._warnings && row._warnings.length" class="warning-text">
                        {{ row._warnings.join('；') }}
                      </span>
                      <span v-else class="ok-text">-</span>
                    </template>
                  </el-table-column>
                </el-table>
                <div v-if="previewData.length > 50" class="preview-more">
                  仅展示前 50 条，共 {{ previewData.length }} 条记录
                </div>
              </div>

              <div class="conflict-detail" v-if="conflictCount > 0 && conflictStrategy === 'merge'">
                <el-divider content-position="left">冲突详情（合并策略预览）</el-divider>
                <div v-for="item in conflictItems.slice(0, 10)" :key="item.date" class="conflict-item">
                  <div class="conflict-date">{{ item.date }}</div>
                  <div class="conflict-compare">
                    <div class="compare-block">
                      <div class="compare-label">已有记录</div>
                      <div class="compare-values">
                        {{ item._existingRecord.bedtime }}~{{ item._existingRecord.wakeTime }}
                        | 深{{ item._existingRecord.deepSleep }}分 浅{{ item._existingRecord.lightSleep }}分
                        <span v-if="item._existingRecord.note">| {{ item._existingRecord.note }}</span>
                      </div>
                    </div>
                    <el-icon><Right /></el-icon>
                    <div class="compare-block merged">
                      <div class="compare-label">合并结果</div>
                      <div class="compare-values">
                        {{ mergeRecords(item._existingRecord, item).bedtime }}~{{ mergeRecords(item._existingRecord, item).wakeTime }}
                        | 深{{ mergeRecords(item._existingRecord, item).deepSleep }}分 浅{{ mergeRecords(item._existingRecord, item).lightSleep }}分
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 3" key="step3" class="step-panel">
            <div class="ct-card result-card">
              <div class="result-icon">
                <el-icon :size="64" color="#67c28a"><CircleCheckFilled /></el-icon>
              </div>
              <div class="result-title">导入完成</div>
              <div class="result-stats">
                <div class="result-stat">
                  <span class="rs-value">{{ importResult.total }}</span>
                  <span class="rs-label">总计处理</span>
                </div>
                <div class="result-stat rs-success">
                  <span class="rs-value">{{ importResult.imported }}</span>
                  <span class="rs-label">成功导入</span>
                </div>
                <div class="result-stat rs-skip">
                  <span class="rs-value">{{ importResult.skipped }}</span>
                  <span class="rs-label">跳过</span>
                </div>
                <div class="result-stat rs-merge">
                  <span class="rs-value">{{ importResult.merged }}</span>
                  <span class="rs-label">合并</span>
                </div>
                <div class="result-stat rs-overwrite">
                  <span class="rs-value">{{ importResult.overwritten }}</span>
                  <span class="rs-label">覆盖</span>
                </div>
              </div>
              <div class="result-actions">
                <el-button type="primary" round @click="resetWizard">
                  <el-icon><RefreshLeft /></el-icon>
                  继续导入
                </el-button>
                <el-button @click="$router.push('/')">
                  <el-icon><DataBoard /></el-icon>
                  返回仪表盘
                </el-button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <div class="wizard-footer" v-if="currentStep < 3">
        <el-button v-if="currentStep > 0" @click="prevStep">
          <el-icon><ArrowLeft /></el-icon>
          上一步
        </el-button>
        <div class="footer-spacer"></div>
        <el-button
          v-if="currentStep < 2"
          type="primary"
          :disabled="!canNext"
          @click="nextStep"
        >
          下一步
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button
          v-if="currentStep === 2"
          type="primary"
          :loading="importing"
          @click="executeImport"
        >
          <el-icon><Check /></el-icon>
          确认导入
        </el-button>
      </div>
    </div>

    <el-dialog v-model="showSaveTemplate" title="保存映射模板" width="400px" :close-on-click-modal="false">
      <el-form label-width="80px">
        <el-form-item label="模板名称">
          <el-input v-model="templateName" placeholder="例如：小米运动 CSV" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveTemplate = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate" :disabled="!templateName.trim()">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useScheduleStore } from '@/store'
import {
  SYSTEM_FIELDS, PRESET_SOURCES,
  parseFile, applyMapping, applyPresetMapping,
  detectConflicts, mergeRecords,
  generateSampleCSV, generateSampleJSON,
  downloadFile
} from '@/utils/dataImport'

const store = useScheduleStore()

const steps = ['选择来源', '字段映射', '预览与冲突', '导入结果']
const sourceIcons = {
  xiaomi: 'Cellphone',
  huawei: 'Monitor',
  apple: 'Apple',
  autosleep: 'Moon',
  custom: 'Document'
}

const currentStep = ref(0)
const selectedSource = ref('')
const uploadedFile = ref(null)
const fileData = ref(null)
const fieldMapping = reactive({})
const conflictStrategy = ref('skip')
const importing = ref(false)
const importResult = reactive({ total: 0, imported: 0, skipped: 0, merged: 0, overwritten: 0 })

const showSaveTemplate = ref(false)
const templateName = ref('')
const selectedTemplateId = ref(null)
const mappingTemplates = ref([])

loadTemplates()

function loadTemplates() {
  mappingTemplates.value = [...store.mappingTemplates]
}

function saveTemplatesToStorage() {
  store.saveMappingTemplatesLocal()
}

const fileColumns = computed(() => {
  if (!fileData.value) return []
  return fileData.value.columns || []
})

const canNext = computed(() => {
  if (currentStep.value === 0) {
    return selectedSource.value && uploadedFile.value && fileData.value
  }
  if (currentStep.value === 1) {
    return !!fieldMapping.date
  }
  return true
})

const unmappedRequired = computed(() => {
  return SYSTEM_FIELDS.filter(f => f.required && !fieldMapping[f.key]).map(f => f.label)
})

const previewData = computed(() => {
  if (!fileData.value || !fieldMapping.date) return []
  const mapped = applyMapping(fileData.value.rows, fieldMapping)
  return detectConflicts(mapped, store.records)
})

const newCount = computed(() => previewData.value.filter(r => r._conflict === 'new').length)
const conflictCount = computed(() => previewData.value.filter(r => r._conflict === 'existing').length)
const warningCount = computed(() => previewData.value.filter(r => r._warnings && r._warnings.length > 0).length)
const conflictItems = computed(() => previewData.value.filter(r => r._conflict === 'existing'))

function selectSource(id) {
  selectedSource.value = id
  if (fileData.value) {
    const autoMapping = applyPresetMapping(id, fileData.value.columns)
    Object.keys(fieldMapping).forEach(k => delete fieldMapping[k])
    Object.assign(fieldMapping, autoMapping)
  }
}

async function handleFileChange(file) {
  uploadedFile.value = file
  try {
    fileData.value = await parseFile(file.raw)
    if (selectedSource.value && selectedSource.value !== 'custom') {
      const autoMapping = applyPresetMapping(selectedSource.value, fileData.value.columns)
      Object.keys(fieldMapping).forEach(k => delete fieldMapping[k])
      Object.assign(fieldMapping, autoMapping)
    } else {
      Object.keys(fieldMapping).forEach(k => delete fieldMapping[k])
    }
    ElMessage.success(`文件解析成功，共 ${fileData.value.rows.length} 条记录，${fileData.value.columns.length} 个字段`)
  } catch (err) {
    ElMessage.error(err.message)
    fileData.value = null
    uploadedFile.value = null
  }
}

function handleFileRemove() {
  uploadedFile.value = null
  fileData.value = null
  Object.keys(fieldMapping).forEach(k => delete fieldMapping[k])
}

function getPreviewData(fieldKey) {
  if (!fileData.value || !fieldMapping[fieldKey]) return '-'
  const col = fieldMapping[fieldKey]
  const rows = fileData.value.rows
  const samples = []
  for (let i = 0; i < Math.min(3, rows.length); i++) {
    if (rows[i][col] != null && rows[i][col] !== '') {
      samples.push(String(rows[i][col]).substring(0, 20))
    }
  }
  return samples.length > 0 ? samples.join(' | ') : '-'
}

function onMappingChange() {
  selectedTemplateId.value = null
}

function applyTemplate(tplId) {
  if (!tplId) return
  const tpl = mappingTemplates.value.find(t => t.id === tplId)
  if (!tpl) return
  Object.keys(fieldMapping).forEach(k => delete fieldMapping[k])
  Object.assign(fieldMapping, { ...tpl.mapping })
  ElMessage.success(`已加载模板「${tpl.name}」`)
}

function saveTemplate() {
  const name = templateName.value.trim()
  if (!name) return
  const tpl = {
    id: Date.now().toString(),
    name,
    mapping: { ...fieldMapping },
    source: selectedSource.value
  }
  mappingTemplates.value.push(tpl)
  saveTemplatesToStorage()
  showSaveTemplate.value = false
  templateName.value = ''
  ElMessage.success('映射模板已保存')
}

function downloadSample(format) {
  const sourceId = selectedSource.value || 'custom'
  if (format === 'csv') {
    const content = generateSampleCSV(sourceId)
    downloadFile(content, `${PRESET_SOURCES.find(s => s.id === sourceId)?.name || '自定义'}_模板.csv`, 'text/csv;charset=utf-8')
  } else {
    const content = generateSampleJSON(sourceId)
    downloadFile(content, `${PRESET_SOURCES.find(s => s.id === sourceId)?.name || '自定义'}_模板.json`, 'application/json;charset=utf-8')
  }
}

function previewRowClass({ row }) {
  if (row._conflict === 'existing') return 'conflict-row'
  if (row._warnings && row._warnings.length > 0) return 'warning-row'
  return ''
}

function goToStep(idx) {
  if (idx < currentStep.value) currentStep.value = idx
}

function nextStep() {
  if (!canNext.value) return
  if (currentStep.value === 1 && unmappedRequired.value.length > 0) {
    ElMessage.warning(`必填字段「${unmappedRequired.value.join('、')}」尚未映射`)
    return
  }
  currentStep.value++
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

async function executeImport() {
  importing.value = true
  try {
    let imported = 0
    let skipped = 0
    let merged = 0
    let overwritten = 0

    for (const record of previewData.value) {
      const cleanRecord = {
        date: record.date,
        bedtime: record.bedtime || '23:00',
        wakeTime: record.wakeTime || '07:00',
        deepSleep: Number(record.deepSleep) || 0,
        lightSleep: Number(record.lightSleep) || 0,
        napMin: Number(record.napMin) || 0,
        caffeineMg: Number(record.caffeineMg) || 0,
        screenMin: Number(record.screenMin) || 0,
        note: record.note || '',
        tags: Array.isArray(record.tags) ? record.tags : []
      }

      if (record._conflict === 'new') {
        await store.addRecord(cleanRecord)
        imported++
      } else if (record._conflict === 'existing') {
        if (conflictStrategy.value === 'skip') {
          skipped++
        } else if (conflictStrategy.value === 'overwrite') {
          await store.addRecord(cleanRecord)
          overwritten++
        } else if (conflictStrategy.value === 'merge') {
          const mergedRecord = mergeRecords(record._existingRecord, cleanRecord)
          await store.addRecord(mergedRecord)
          merged++
        }
      }
    }

    importResult.total = previewData.value.length
    importResult.imported = imported
    importResult.skipped = skipped
    importResult.merged = merged
    importResult.overwritten = overwritten

    currentStep.value = 3
    ElMessage.success('数据导入完成')
  } catch (err) {
    ElMessage.error('导入失败：' + (err.message || '未知错误'))
  } finally {
    importing.value = false
  }
}

function resetWizard() {
  currentStep.value = 0
  selectedSource.value = ''
  uploadedFile.value = null
  fileData.value = null
  Object.keys(fieldMapping).forEach(k => delete fieldMapping[k])
  conflictStrategy.value = 'skip'
  importResult.total = 0
  importResult.imported = 0
  importResult.skipped = 0
  importResult.merged = 0
  importResult.overwritten = 0
}
</script>

<style lang="scss" scoped>
.import-view {
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

.wizard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.steps-bar {
  display: flex;
  align-items: center;
  position: relative;
  padding: 0 40px;
  background: var(--ct-surface);
  border-radius: var(--ct-radius);
  border: 1px solid var(--ct-border);
  height: 64px;

  .step-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    z-index: 1;
    cursor: default;
    position: relative;

    &.done { cursor: pointer; }

    .step-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      background: var(--ct-bg);
      border: 2px solid var(--ct-border);
      color: var(--ct-text-secondary);
      transition: all 0.3s;
    }

    .step-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--ct-text-secondary);
      transition: all 0.3s;
    }

    &.active .step-circle {
      background: linear-gradient(135deg, var(--ct-primary-light), var(--ct-primary));
      border-color: var(--ct-primary);
      color: #fff;
    }

    &.active .step-label {
      color: var(--ct-primary-dark);
      font-weight: 600;
    }

    &.done .step-circle {
      background: var(--ct-success);
      border-color: var(--ct-success);
      color: #fff;
    }

    &.done .step-label {
      color: var(--ct-success);
    }
  }

  .step-line {
    position: absolute;
    top: 50%;
    left: 60px;
    height: 3px;
    background: linear-gradient(90deg, var(--ct-success), var(--ct-primary));
    border-radius: 2px;
    transform: translateY(-50%);
    transition: width 0.4s ease;
    z-index: 0;
  }
}

.step-content {
  min-height: 400px;
}

.step-panel {
  width: 100%;
}

.source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 20px;

  .source-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 10px;
    border: 2px solid var(--ct-border);
    background: var(--ct-bg);
    cursor: pointer;
    transition: all 0.25s;
    position: relative;

    &:hover {
      border-color: var(--ct-primary-light);
      background: var(--ct-primary-lighter);
    }

    &.selected {
      border-color: var(--ct-primary);
      background: var(--ct-primary-lighter);
      box-shadow: 0 2px 12px rgba(126, 184, 216, 0.25);
    }

    .source-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(126, 184, 216, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .source-info {
      flex: 1;
      min-width: 0;

      .source-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--ct-text);
      }

      .source-desc {
        font-size: 11px;
        color: var(--ct-text-secondary);
        margin-top: 2px;
        line-height: 1.3;
      }
    }

    .source-check {
      flex-shrink: 0;
    }
  }
}

.upload-area {
  margin-bottom: 16px;

  :deep(.el-upload-dragger) {
    border-radius: var(--ct-radius);
    border: 2px dashed var(--ct-border);
    background: var(--ct-bg);
    padding: 30px;
    transition: all 0.3s;

    &:hover {
      border-color: var(--ct-primary);
    }
  }

  .upload-text {
    font-size: 14px;
    color: var(--ct-text-secondary);
    margin-top: 8px;

    em {
      color: var(--ct-primary);
      font-style: normal;
    }
  }

  .upload-tip {
    font-size: 12px;
    color: var(--ct-text-secondary);
    margin-top: 6px;
  }
}

.sample-download {
  .sample-btns {
    display: flex;
    gap: 10px;
  }
}

.mapping-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;

  .mapping-hint {
    font-size: 13px;
    color: var(--ct-text-secondary);
  }

  .mapping-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.mapping-table {
  border: 1px solid var(--ct-border);
  border-radius: 10px;
  overflow: hidden;

  .mapping-row {
    display: grid;
    grid-template-columns: 180px 36px 1fr 200px;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid var(--ct-border);
    transition: background 0.15s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: rgba(126, 184, 216, 0.04);
    }

    &.mapping-required {
      .field-label {
        font-weight: 600;
      }
    }

    &.mapping-header-row {
      background: rgba(126, 184, 216, 0.08);
      font-weight: 600;
      font-size: 13px;
      color: var(--ct-text);
    }
  }

  .mapping-sys-col {
    display: flex;
    align-items: center;
    gap: 6px;

    .field-label {
      font-size: 13px;
      color: var(--ct-text);
    }
  }

  .mapping-arrow {
    text-align: center;
    color: var(--ct-text-secondary);
  }

  .mapping-file-col {
    padding-right: 12px;
  }

  .mapping-preview-col {
    font-size: 12px;
    color: var(--ct-text-secondary);

    .preview-text {
      display: inline-block;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.auto-match-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(230, 162, 60, 0.08);
  border-radius: 8px;
  font-size: 13px;
  color: #e6a23c;
}

.preview-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 20px;
    background: var(--ct-bg);
    border-radius: 10px;
    border: 1px solid var(--ct-border);
    min-width: 80px;

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--ct-primary);
    }

    .stat-label {
      font-size: 11px;
      color: var(--ct-text-secondary);
      margin-top: 4px;
    }

    &.stat-new .stat-value { color: var(--ct-success); }
    &.stat-conflict .stat-value { color: var(--ct-warning); }
    &.stat-warning .stat-value { color: var(--ct-danger); }
  }
}

.conflict-strategy {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(230, 162, 60, 0.06);
  border-radius: 10px;
  border: 1px solid rgba(230, 162, 60, 0.2);

  .strategy-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--ct-text);
    white-space: nowrap;
  }
}

.preview-table-wrap {
  margin-bottom: 16px;

  .preview-more {
    text-align: center;
    font-size: 12px;
    color: var(--ct-text-secondary);
    padding: 8px;
  }

  .warning-text {
    color: var(--ct-warning);
    font-size: 12px;
  }

  .ok-text {
    color: var(--ct-text-secondary);
  }

  :deep(.conflict-row) {
    background: rgba(230, 162, 60, 0.06) !important;
  }

  :deep(.warning-row) {
    background: rgba(245, 108, 108, 0.04) !important;
  }
}

.conflict-detail {
  .conflict-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--ct-border);

    &:last-child { border-bottom: none; }

    .conflict-date {
      font-size: 13px;
      font-weight: 600;
      color: var(--ct-text);
      min-width: 100px;
    }

    .conflict-compare {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;

      .compare-block {
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid var(--ct-border);
        background: var(--ct-bg);

        &.merged {
          border-color: var(--ct-primary-light);
          background: var(--ct-primary-lighter);
        }

        .compare-label {
          font-size: 10px;
          color: var(--ct-text-secondary);
          margin-bottom: 2px;
        }

        .compare-values {
          font-size: 12px;
          color: var(--ct-text);
        }
      }
    }
  }
}

.wizard-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;

  .footer-spacer { flex: 1; }
}

.result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;

  .result-icon {
    margin-bottom: 16px;
  }

  .result-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--ct-text);
    margin-bottom: 24px;
  }

  .result-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;

    .result-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 14px 24px;
      background: var(--ct-bg);
      border-radius: 10px;
      border: 1px solid var(--ct-border);

      .rs-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--ct-primary);
      }

      .rs-label {
        font-size: 12px;
        color: var(--ct-text-secondary);
        margin-top: 4px;
      }

      &.rs-success .rs-value { color: var(--ct-success); }
      &.rs-skip .rs-value { color: var(--ct-text-secondary); }
      &.rs-merge .rs-value { color: var(--ct-primary); }
      &.rs-overwrite .rs-value { color: var(--ct-warning); }
    }
  }

  .result-actions {
    display: flex;
    gap: 12px;
  }
}
</style>
