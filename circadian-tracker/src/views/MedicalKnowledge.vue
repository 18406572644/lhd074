<template>
  <div class="medical-knowledge">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Reading /></el-icon>
        昼夜节律医学诊疗知识库
      </h2>
      <el-alert
        type="info"
        :closable="false"
        class="disclaimer-alert"
        show-icon
      >
        <template #title>
          <strong>重要免责声明</strong>
        </template>
        {{ diagnosticResult.disclaimer }}
      </el-alert>
    </div>

    <el-tabs v-model="activeTab" class="knowledge-tabs">
      <el-tab-pane label="智能诊断" name="diagnosis">
        <div class="diagnosis-section">
          <div v-if="!diagnosticResult.hasData" class="empty-state">
            <el-empty description="请先录入作息数据以获取智能诊断">
              <el-button type="primary" @click="goToInput">立即录入</el-button>
            </el-empty>
          </div>

          <div v-else class="diagnosis-content">
            <div class="ct-card chronotype-card">
              <div class="ct-title">
                <el-icon><Clock /></el-icon>
                昼夜时型分析
              </div>
              <div class="chronotype-content" v-if="diagnosticResult.chronotype">
                <div class="chronotype-badge" :class="diagnosticResult.chronotype.type">
                  {{ diagnosticResult.chronotype.name }}
                </div>
                <div class="chronotype-details">
                  <div class="detail-item">
                    <span class="label">睡眠中点(MSFsc):</span>
                    <span class="value">{{ diagnosticResult.chronotype.correctedMSFsc }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">原始睡眠中点:</span>
                    <span class="value">{{ diagnosticResult.chronotype.rawMSF }}</span>
                  </div>
                  <p class="chronotype-desc">{{ diagnosticResult.chronotype.description }}</p>
                </div>
              </div>
            </div>

            <div class="ct-card metrics-card">
              <div class="ct-title">
                <el-icon><DataAnalysis /></el-icon>
                睡眠指标汇总
              </div>
              <div class="metrics-grid" v-if="diagnosticResult.aggregatedMetrics?.last30Days">
                <div class="metric-item">
                  <div class="metric-value">{{ diagnosticResult.aggregatedMetrics.last30Days.avgSleepHours.toFixed(1) }}h</div>
                  <div class="metric-label">30天平均睡眠时长</div>
                </div>
                <div class="metric-item">
                  <div class="metric-value">{{ diagnosticResult.aggregatedMetrics.last30Days.avgBedtime }}</div>
                  <div class="metric-label">30天平均入睡时间</div>
                </div>
                <div class="metric-item">
                  <div class="metric-value">{{ diagnosticResult.aggregatedMetrics.last30Days.daysWithInsomniaSymptoms }}</div>
                  <div class="metric-label">30天失眠症状天数</div>
                </div>
                <div class="metric-item" v-if="diagnosticResult.aggregatedMetrics.sleepLatency30Days.avg">
                  <div class="metric-value">{{ diagnosticResult.aggregatedMetrics.sleepLatency30Days.avg.toFixed(0) }}min</div>
                  <div class="metric-label">平均入睡潜伏期</div>
                </div>
                <div class="metric-item" v-if="diagnosticResult.assessments.epworth">
                  <div class="metric-value : { 'danger': diagnosticResult.assessments.epworth.totalScore >= 10 }">
                    {{ diagnosticResult.assessments.epworth.totalScore }}
                  </div>
                  <div class="metric-label">Epworth嗜睡评分</div>
                </div>
                <div class="metric-item" v-if="diagnosticResult.assessments.isi">
                  <div class="metric-value : { 'danger': diagnosticResult.assessments.isi.totalScore >= 8 }">
                    {{ diagnosticResult.assessments.isi.totalScore }}
                  </div>
                  <div class="metric-label">失眠严重指数</div>
                </div>
              </div>
            </div>

            <div class="ct-card diagnoses-card">
              <div class="ct-title">
                <el-icon><Bell /></el-icon>
                疑似诊断匹配
                <el-tag size="small" type="info" effect="plain" style="margin-left: auto">
                  基于 ICSD-3 标准
                </el-tag>
              </div>
              <div v-if="diagnosticResult.diagnoses.length === 0" class="no-diagnoses">
                <el-icon :size="48" color="#67c28a"><CircleCheckFilled /></el-icon>
                <p>当前数据未匹配到明显睡眠障碍特征</p>
              </div>
              <div v-else class="diagnoses-list">
                <div
                  v-for="diagnosis in diagnosticResult.diagnoses"
                  :key="diagnosis.id"
                  class="diagnosis-item"
                  :class="diagnosis.matchLevel"
                >
                  <div class="diagnosis-header">
                    <div class="diagnosis-name">
                      <el-icon><WarningFilled v-if="diagnosis.severity === 'high'" /><InfoFilled v-else /></el-icon>
                      {{ diagnosis.name }}
                      <el-tag size="small" :type="getSeverityTagType(diagnosis.severity)" effect="dark" style="margin-left: 8px">
                        {{ diagnosis.code }}
                      </el-tag>
                    </div>
                    <div class="confidence-badge" :class="diagnosis.matchLevel">
                      匹配度 {{ diagnosis.confidence }}%
                    </div>
                  </div>
                  <p class="diagnosis-desc">{{ diagnosis.description }}</p>
                  <div class="criteria-section">
                    <div class="criteria-column">
                      <h4><el-icon><CircleCheck /></el-icon> 已匹配标准</h4>
                      <ul>
                        <li v-for="(c, i) in diagnosis.matchingCriteria" :key="'match-'+i">
                          <span class="check-icon">✓</span>{{ c }}
                        </li>
                      </ul>
                    </div>
                    <div class="criteria-column">
                      <h4><el-icon><QuestionFilled /></el-icon> 待确认标准</h4>
                      <ul>
                        <li v-for="(c, i) in diagnosis.missingCriteria" :key="'miss-'+i">
                          <span class="question-icon">?</span>{{ c }}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="diagnosis-suggestion">
                    <el-icon><SwitchButton /></el-icon>
                    {{ diagnosis.suggestion }}
                  </div>
                  <div class="diagnosis-actions">
                    <el-button
                      size="small"
                      type="primary"
                      plain
                      @click="viewInterventions(diagnosis.relatedInterventions)"
                    >
                      查看干预方案
                    </el-button>
                    <el-button
                      v-for="ref in diagnosis.references"
                      :key="ref.url"
                      size="small"
                      type="info"
                      plain
                      @click="openExternal(ref.url)"
                    >
                      <el-icon><Link /></el-icon>
                      {{ ref.title }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <div class="ct-card recommendations-card">
              <div class="ct-title">
                <el-icon><ChatDotRound /></el-icon>
                健康建议
              </div>
              <div class="recommendations-list">
                <div
                  v-for="(rec, i) in diagnosticResult.recommendations"
                  :key="i"
                  class="recommendation-item"
                  :class="rec.type"
                >
                  <div class="rec-icon">
                    <el-icon :size="20"><component :is="rec.icon" /></el-icon>
                  </div>
                  <div class="rec-content">
                    <h4>{{ rec.title }}</h4>
                    <p>{{ rec.content }}</p>
                    <div class="rec-confidence" v-if="rec.confidence">
                      置信度: {{ rec.confidence }}%
                    </div>
                    <div class="rec-actions" v-if="rec.relatedInterventions">
                      <el-button
                        v-for="iv in rec.relatedInterventions"
                        :key="iv"
                        size="small"
                        type="primary"
                        link
                        @click="activeTab = 'interventions'; scrollToIntervention(iv)"
                      >
                        {{ getInterventionName(iv) }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="ICSD-3 疾病分类" name="diseases">
        <div class="diseases-section">
          <div class="search-bar">
            <el-input
              v-model="diseaseSearch"
              placeholder="搜索睡眠障碍..."
              :prefix-icon="Search"
              clearable
              style="width: 300px"
            />
          </div>
          <div class="diseases-grid">
            <div
              v-for="disease in filteredDiseases"
              :key="disease.id"
              class="ct-card disease-card"
              :class="disease.severity"
            >
              <div class="disease-header">
                <h3>
                  <el-icon><Medal /></el-icon>
                  {{ disease.name }}
                </h3>
                <el-tag size="small" :type="getSeverityTagType(disease.severity)" effect="dark">
                  {{ disease.code }}
                </el-tag>
              </div>
              <p class="disease-desc">{{ disease.description }}</p>
              <div class="disease-criteria">
                <h4>诊断标准</h4>
                <ul>
                  <li v-for="(c, i) in disease.diagnosticCriteria" :key="i">{{ c }}</li>
                </ul>
              </div>
              <div class="disease-refs">
                <h4>权威文献</h4>
                <div class="ref-links">
                  <a
                    v-for="ref in disease.references"
                    :key="ref.url"
                    class="ref-link"
                    @click="openExternal(ref.url)"
                  >
                    <el-icon><Link /></el-icon>
                    {{ ref.title }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="CBT-I 干预方案" name="interventions">
        <div class="interventions-section">
          <div class="interventions-list">
            <div
              v-for="intervention in allInterventions"
              :key="intervention.id"
              :ref="el => setInterventionRef(intervention.id, el)"
              class="ct-card intervention-card"
            >
              <div class="intervention-header">
                <h3>
                  <el-icon><MagicStick /></el-icon>
                  {{ intervention.name }}
                </h3>
                <el-tag size="small" type="primary" effect="plain">
                  {{ intervention.category }}
                </el-tag>
              </div>
              <p class="intervention-desc">{{ intervention.description }}</p>
              
              <div class="intervention-purpose" v-if="intervention.purpose">
                <h4><el-icon><Aim /></el-icon> 干预目标</h4>
                <p>{{ intervention.purpose }}</p>
              </div>

              <div class="intervention-steps" v-if="intervention.steps">
                <h4><el-icon><List /></el-icon> 实施步骤</h4>
                <div class="steps-timeline">
                  <div v-for="step in intervention.steps" :key="step.step" class="step-item">
                    <div class="step-number">{{ step.step }}</div>
                    <div class="step-content">
                      <p>{{ step.description }}</p>
                      <span class="step-duration">{{ step.duration }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="intervention-precautions" v-if="intervention.precautions">
                <h4><el-icon><Warning /></el-icon> 注意事项</h4>
                <ul>
                  <li v-for="(p, i) in intervention.precautions" :key="i">{{ p }}</li>
                </ul>
              </div>

              <div class="intervention-components" v-if="intervention.components">
                <h4><el-icon><Files /></el-icon> 组成部分</h4>
                <div class="components-list">
                  <div v-for="comp in intervention.components" :key="comp.category" class="component-item">
                    <h5>{{ comp.category }}</h5>
                    <ul>
                      <li v-for="(item, i) in comp.items" :key="i">{{ item }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="intervention-schedule" v-if="intervention.scheduleTemplate">
                <h4><el-icon><Calendar /></el-icon> 日程模板</h4>
                <el-descriptions :column="2" border size="small">
                  <template v-if="intervention.scheduleTemplate.weekday">
                    <el-descriptions-item label="工作日就寝">
                      {{ intervention.scheduleTemplate.weekday.bedtime }}
                    </el-descriptions-item>
                    <el-descriptions-item label="工作日起床">
                      {{ intervention.scheduleTemplate.weekday.riseTime }}
                    </el-descriptions-item>
                    <el-descriptions-item label="允许小睡">
                      {{ intervention.scheduleTemplate.weekday.allowedNap }}
                    </el-descriptions-item>
                    <el-descriptions-item label="周末起床">
                      {{ intervention.scheduleTemplate.weekend.riseTime }}
                    </el-descriptions-item>
                  </template>
                  <template v-if="intervention.scheduleTemplate.bedroomRules">
                    <el-descriptions-item label="卧室规则" :span="2">
                      <div class="rules-list">
                        <el-tag v-for="rule in intervention.scheduleTemplate.bedroomRules" :key="rule" size="small" type="info">
                          {{ rule }}
                        </el-tag>
                      </div>
                    </el-descriptions-item>
                  </template>
                  <template v-if="intervention.scheduleTemplate.preSleepRoutine">
                    <el-descriptions-item label="睡前仪式" :span="2">
                      <div class="rules-list">
                        <el-tag v-for="routine in intervention.scheduleTemplate.preSleepRoutine" :key="routine" size="small" type="success">
                          {{ routine }}
                        </el-tag>
                      </div>
                    </el-descriptions-item>
                  </template>
                </el-descriptions>
              </div>

              <div class="intervention-protocols" v-if="intervention.protocols">
                <h4><el-icon><SetUp /></el-icon> 治疗方案</h4>
                <el-tabs v-model="currentProtocolTab[intervention.id]" type="border-card">
                  <el-tab-pane label="晚睡型方案" name="delayed_phase">
                    <div class="protocol-content" v-if="intervention.protocols.delayed_phase">
                      <div class="protocol-item">
                        <span class="label">治疗时间:</span>
                        <span class="value">{{ intervention.protocols.delayed_phase.timing }}</span>
                      </div>
                      <div class="protocol-item">
                        <span class="label">持续时间:</span>
                        <span class="value">{{ intervention.protocols.delayed_phase.duration }}</span>
                      </div>
                      <div class="protocol-item">
                        <span class="label">光照强度:</span>
                        <span class="value">{{ intervention.protocols.delayed_phase.intensity }}</span>
                      </div>
                      <div class="protocol-item">
                        <span class="label">见效时间:</span>
                        <span class="value">{{ intervention.protocols.delayed_phase.duration_weeks }}</span>
                      </div>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="早睡型方案" name="advanced_phase">
                    <div class="protocol-content" v-if="intervention.protocols.advanced_phase">
                      <div class="protocol-item">
                        <span class="label">治疗时间:</span>
                        <span class="value">{{ intervention.protocols.advanced_phase.timing }}</span>
                      </div>
                      <div class="protocol-item">
                        <span class="label">持续时间:</span>
                        <span class="value">{{ intervention.protocols.advanced_phase.duration }}</span>
                      </div>
                      <div class="protocol-item">
                        <span class="label">光照强度:</span>
                        <span class="value">{{ intervention.protocols.advanced_phase.intensity }}</span>
                      </div>
                      <div class="protocol-item">
                        <span class="label">见效时间:</span>
                        <span class="value">{{ intervention.protocols.advanced_phase.duration_weeks }}</span>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>

              <div class="intervention-daily" v-if="intervention.dailyPractice">
                <h4><el-icon><AlarmClock /></el-icon> 每日练习安排</h4>
                <div class="daily-grid">
                  <div v-for="practice in intervention.dailyPractice" :key="practice.time" class="daily-item">
                    <div class="daily-time">{{ practice.time }}</div>
                    <div class="daily-activity">{{ practice.activity }}</div>
                    <div class="daily-duration">{{ practice.duration }}</div>
                  </div>
                </div>
              </div>

              <div class="intervention-distortions" v-if="intervention.commonCognitiveDistortions">
                <h4><el-icon><View /></el-icon> 常见认知扭曲</h4>
                <el-table :data="intervention.commonCognitiveDistortions" size="small" border>
                  <el-table-column prop="distortion" label="认知扭曲类型" width="150" />
                  <el-table-column prop="example" label="典型表现" />
                </el-table>
              </div>

              <div class="intervention-techniques" v-if="intervention.techniques">
                <h4><el-icon><Operation /></el-icon> 干预技术</h4>
                <div class="techniques-list">
                  <div v-for="tech in intervention.techniques" :key="tech.technique" class="technique-item">
                    <h5>{{ tech.technique }}</h5>
                    <p>{{ tech.description }}</p>
                  </div>
                </div>
              </div>

              <div class="intervention-indications" v-if="intervention.indications">
                <h4><el-icon><CircleCheckFilled /></el-icon> 适应症</h4>
                <div class="indications-list">
                  <el-tag v-for="ind in intervention.indications" :key="ind" size="small" type="success" effect="light">
                    {{ ind }}
                  </el-tag>
                </div>
              </div>

              <div class="intervention-refs" v-if="intervention.references">
                <h4><el-icon><Document /></el-icon> 参考文献</h4>
                <div class="ref-links">
                  <a
                    v-for="ref in intervention.references"
                    :key="ref.url"
                    class="ref-link"
                    @click="openExternal(ref.url)"
                  >
                    <el-icon><Link /></el-icon>
                    {{ ref.title }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="评估量表" name="assessments">
        <div class="assessments-section">
          <el-tabs v-model="assessmentTab" type="border-card">
            <el-tab-pane label="Epworth 嗜睡量表" name="epworth">
              <div class="assessment-content">
                <div class="assessment-intro">
                  <h3>Epworth 嗜睡量表 (ESS)</h3>
                  <p>{{ engine.getAssessmentScale('epworth').description }}</p>
                  <p class="scoring-rule">评分标准: 0=从不瞌睡, 1=轻微瞌睡, 2=中度瞌睡, 3=高度瞌睡</p>
                </div>
                <div class="assessment-form">
                  <div v-for="item in engine.getAssessmentScale('epworth').items" :key="item.id" class="question-item">
                    <div class="question-text">
                      <span class="q-number">{{ item.id }}.</span>
                      {{ item.question }}
                    </div>
                    <el-radio-group v-model="epworthAnswers[item.id - 1]" size="large">
                      <el-radio-button :value="0">0</el-radio-button>
                      <el-radio-button :value="1">1</el-radio-button>
                      <el-radio-button :value="2">2</el-radio-button>
                      <el-radio-button :value="3">3</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
                <div class="assessment-actions">
                  <el-button type="primary" @click="calculateEpworth" :disabled="!isEpworthComplete">
                    计算评分
                  </el-button>
                  <el-button @click="resetEpworth">重置</el-button>
                </div>
                <div v-if="epworthResult" class="assessment-result" :class="getResultClass(epworthResult.totalScore, 'epworth')">
                  <div class="result-score">
                    总分: <strong>{{ epworthResult.totalScore }}</strong> / 24
                  </div>
                  <div class="result-interpretation">
                    {{ epworthResult.interpretation }}
                  </div>
                  <div class="result-reference">
                    <a @click="openExternal(epworthResult.reference.url)">
                      <el-icon><Link /></el-icon>
                      {{ epworthResult.reference.title }}
                    </a>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="失眠严重指数" name="isi">
              <div class="assessment-content">
                <div class="assessment-intro">
                  <h3>失眠严重程度指数 (ISI)</h3>
                  <p>{{ engine.getAssessmentScale('isi').description }}</p>
                  <p class="scoring-rule">评分标准: 0=无, 1=轻微, 2=中度, 3=较重, 4=严重</p>
                </div>
                <div class="assessment-form">
                  <div v-for="item in engine.getAssessmentScale('isi').items" :key="item.id" class="question-item">
                    <div class="question-text">
                      <span class="q-number">{{ item.id }}.</span>
                      {{ item.question }}
                    </div>
                    <el-radio-group v-model="isiAnswers[item.id - 1]" size="large">
                      <el-radio-button :value="0">0</el-radio-button>
                      <el-radio-button :value="1">1</el-radio-button>
                      <el-radio-button :value="2">2</el-radio-button>
                      <el-radio-button :value="3">3</el-radio-button>
                      <el-radio-button :value="4">4</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
                <div class="assessment-actions">
                  <el-button type="primary" @click="calculateISI" :disabled="!isISIComplete">
                    计算评分
                  </el-button>
                  <el-button @click="resetISI">重置</el-button>
                </div>
                <div v-if="isiResult" class="assessment-result" :class="getResultClass(isiResult.totalScore, 'isi')">
                  <div class="result-score">
                    总分: <strong>{{ isiResult.totalScore }}</strong> / 28
                  </div>
                  <div class="result-interpretation">
                    {{ isiResult.interpretation }}
                  </div>
                  <div class="result-reference">
                    <a @click="openExternal(isiResult.reference.url)">
                      <el-icon><Link /></el-icon>
                      {{ isiResult.reference.title }}
                    </a>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Reading, Clock, DataAnalysis, Bell, WarningFilled, InfoFilled, CircleCheck, QuestionFilled, SwitchButton, Link, ChatDotRound, Medal, MagicStick, Aim, List, Warning, Files, Calendar, SetUp, AlarmClock, View, Operation, Document, CircleCheckFilled } from '@element-plus/icons-vue'
import { useScheduleStore } from '@/store'

const store = useScheduleStore()
const router = useRouter()

const activeTab = ref('diagnosis')
const assessmentTab = ref('epworth')
const diseaseSearch = ref('')
const protocolTabs = ref({})
const currentProtocolTab = ref({})

const epworthAnswers = ref(new Array(8).fill(null))
const isiAnswers = ref(new Array(7).fill(null))
const epworthResult = ref(null)
const isiResult = ref(null)

const interventionRefs = ref({})

const diagnosticResult = computed(() => store.diagnosticResult)
const engine = computed(() => store.getDiagnosticEngine())
const allInterventions = computed(() => engine.value.getAllInterventions())
const allDiseases = computed(() => engine.value.getAllDiseases())

const filteredDiseases = computed(() => {
  if (!diseaseSearch.value) return allDiseases.value
  const kw = diseaseSearch.value.toLowerCase()
  return allDiseases.value.filter(d =>
    d.name.toLowerCase().includes(kw) ||
    d.description.toLowerCase().includes(kw) ||
    d.code.toLowerCase().includes(kw)
  )
})

const isEpworthComplete = computed(() => epworthAnswers.value.every(a => a !== null))
const isISIComplete = computed(() => isiAnswers.value.every(a => a !== null))

watch(allInterventions, (interventions) => {
  interventions.forEach(iv => {
    if (!currentProtocolTab.value[iv.id]) {
      currentProtocolTab.value[iv.id] = 'delayed_phase'
    }
  })
}, { immediate: true, deep: true })

function setInterventionRef(id, el) {
  if (el) {
    interventionRefs.value[id] = el
  }
}

function scrollToIntervention(interventionId) {
  nextTick(() => {
    const el = interventionRefs.value[interventionId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

function getSeverityTagType(severity) {
  switch (severity) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    default: return 'info'
  }
}

function goToInput() {
  router.push('/input')
}

function openExternal(url) {
  window.open(url, '_blank')
}

function viewInterventions(interventionIds) {
  activeTab.value = 'interventions'
  if (interventionIds && interventionIds.length > 0) {
    nextTick(() => {
      scrollToIntervention(interventionIds[0])
    })
  }
}

function getInterventionName(id) {
  const iv = engine.value.getInterventionDetails(id)
  return iv ? iv.name : id
}

function calculateEpworth() {
  const result = engine.value.calculateEpworthScore(epworthAnswers.value)
  epworthResult.value = result
  if (result.totalScore !== null) {
    store.setEpworthScore(result)
  }
}

function calculateISI() {
  const result = engine.value.calculateISIScore(isiAnswers.value)
  isiResult.value = result
  if (result.totalScore !== null) {
    store.setISIScore(result)
  }
}

function resetEpworth() {
  epworthAnswers.value = new Array(8).fill(null)
  epworthResult.value = null
}

function resetISI() {
  isiAnswers.value = new Array(7).fill(null)
  isiResult.value = null
}

function getResultClass(score, type) {
  if (type === 'epworth') {
    if (score >= 16) return 'danger'
    if (score >= 10) return 'warning'
    return 'success'
  }
  if (type === 'isi') {
    if (score >= 15) return 'danger'
    if (score >= 8) return 'warning'
    return 'success'
  }
  return ''
}
</script>

<style lang="scss" scoped>
.medical-knowledge {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .page-header {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .page-title {
      font-size: 20px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--ct-text);
      .el-icon { color: var(--ct-primary); }
    }

    .disclaimer-alert {
      margin: 0;
    }
  }
}

.knowledge-tabs {
  :deep(.el-tabs__header) {
    margin: 0 0 16px 0;
  }
  :deep(.el-tabs__item) {
    font-size: 14px;
    font-weight: 600;
  }
}

.ct-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--ct-text);
  .el-icon { color: var(--ct-primary); }
}

.empty-state {
  padding: 40px;
  text-align: center;
}

.chronotype-card {
  .chronotype-content {
    display: flex;
    gap: 24px;
    align-items: flex-start;

    .chronotype-badge {
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;

      &.delayed { background: linear-gradient(135deg, #f56c6c, #e6a23c); }
      &.advanced { background: linear-gradient(135deg, #909399, #67c28a); }
      &.normal { background: linear-gradient(135deg, #67c28a, #7eb8d8); }
    }

    .chronotype-details {
      flex: 1;

      .detail-item {
        display: flex;
        gap: 8px;
        margin-bottom: 6px;
        .label { color: var(--ct-text-secondary); font-size: 13px; }
        .value { font-weight: 600; color: var(--ct-text); }
      }

      .chronotype-desc {
        margin-top: 12px;
        padding: 12px;
        background: var(--ct-bg-soft);
        border-radius: 8px;
        color: var(--ct-text);
        line-height: 1.6;
      }
    }
  }
}

.metrics-card {
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;

    .metric-item {
      text-align: center;
      padding: 16px;
      background: var(--ct-surface);
      border-radius: 12px;
      border: 1px solid var(--ct-border);

      .metric-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--ct-primary);
        margin-bottom: 4px;
        &.danger { color: #f56c6c; }
      }

      .metric-label {
        font-size: 12px;
        color: var(--ct-text-secondary);
      }
    }
  }
}

.diagnoses-card {
  .no-diagnoses {
    text-align: center;
    padding: 40px;
    color: var(--ct-text-secondary);
    p { margin-top: 12px; }
  }

  .diagnoses-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .diagnosis-item {
      padding: 20px;
      border-radius: 12px;
      border: 1px solid var(--ct-border);
      background: var(--ct-surface);

      &.high {
        border-left: 4px solid #f56c6c;
        background: rgba(245, 108, 108, 0.03);
      }
      &.medium {
        border-left: 4px solid #e6a23c;
        background: rgba(230, 162, 60, 0.03);
      }
      &.low {
        border-left: 4px solid #7eb8d8;
        background: rgba(126, 184, 216, 0.03);
      }

      .diagnosis-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .diagnosis-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--ct-text);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .confidence-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 13px;

          &.high { background: #fef0f0; color: #f56c6c; }
          &.medium { background: #fdf6ec; color: #e6a23c; }
          &.low { background: #ecf5ff; color: #7eb8d8; }
        }
      }

      .diagnosis-desc {
        color: var(--ct-text-secondary);
        line-height: 1.6;
        margin-bottom: 16px;
      }

      .criteria-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 16px;

        h4 {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 600;
          color: var(--ct-text);
          margin-bottom: 8px;
          .el-icon { color: #67c28a; }
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;

          li {
            display: flex;
            gap: 8px;
            padding: 6px 0;
            color: var(--ct-text);
            font-size: 13px;
            line-height: 1.5;

            .check-icon {
              color: #67c28a;
              font-weight: 700;
            }
            .question-icon {
              color: #e6a23c;
              font-weight: 700;
            }
          }
        }
      }

      .diagnosis-suggestion {
        padding: 12px 16px;
        background: var(--ct-primary-lighter);
        border-radius: 8px;
        color: var(--ct-primary);
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        line-height: 1.5;
      }

      .diagnosis-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  }
}

.recommendations-card {
  .recommendations-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .recommendation-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      border-radius: 12px;

      &.positive {
        background: rgba(103, 194, 138, 0.08);
        .rec-icon { color: #67c28a; }
      }
      &.warning {
        background: rgba(230, 162, 60, 0.08);
        .rec-icon { color: #e6a23c; }
      }
      &.info {
        background: rgba(126, 184, 216, 0.08);
        .rec-icon { color: #7eb8d8; }
      }
      &.danger {
        background: rgba(245, 108, 108, 0.08);
        .rec-icon { color: #f56c6c; }
      }
      &.disclaimer {
        background: rgba(144, 147, 153, 0.08);
        .rec-icon { color: #909399; }
      }

      .rec-icon {
        flex-shrink: 0;
        margin-top: 2px;
      }

      .rec-content {
        flex: 1;

        h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--ct-text);
          margin: 0 0 6px 0;
        }

        p {
          color: var(--ct-text-secondary);
          line-height: 1.6;
          margin: 0 0 8px 0;
        }

        .rec-confidence {
          font-size: 12px;
          color: var(--ct-text-secondary);
          margin-bottom: 8px;
        }

        .rec-actions {
          display: flex;
          gap: 4px;
        }
      }
    }
  }
}

.search-bar {
  margin-bottom: 16px;
}

.diseases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;

  .disease-card {
    padding: 20px;

    .disease-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h3 {
        font-size: 16px;
        font-weight: 700;
        color: var(--ct-text);
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        .el-icon { color: var(--ct-primary); }
      }
    }

    .disease-desc {
      color: var(--ct-text-secondary);
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .disease-criteria, .disease-refs {
      margin-bottom: 16px;

      h4 {
        font-size: 13px;
        font-weight: 600;
        color: var(--ct-text);
        margin-bottom: 8px;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: 4px 0;
          padding-left: 16px;
          position: relative;
          font-size: 13px;
          color: var(--ct-text-secondary);
          line-height: 1.5;

          &::before {
            content: '•';
            position: absolute;
            left: 0;
            color: var(--ct-primary);
          }
        }
      }
    }

    .ref-links {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .ref-link {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--ct-primary);
        font-size: 13px;
        cursor: pointer;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

.interventions-section {
  .interventions-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .intervention-card {
      padding: 24px;

      .intervention-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--ct-text);
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          .el-icon { color: var(--ct-primary); }
        }
      }

      .intervention-desc {
        color: var(--ct-text-secondary);
        line-height: 1.6;
        margin-bottom: 20px;
      }

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: var(--ct-text);
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 20px 0 12px 0;
        .el-icon { color: var(--ct-primary); }
      }

      .intervention-purpose p {
        color: var(--ct-text);
        line-height: 1.6;
        padding: 12px;
        background: var(--ct-primary-lighter);
        border-radius: 8px;
      }

      .steps-timeline {
        position: relative;
        padding-left: 40px;

        .step-item {
          position: relative;
          padding-bottom: 20px;

          &::before {
            content: '';
            position: absolute;
            left: -28px;
            top: 24px;
            width: 2px;
            height: calc(100% - 16px);
            background: var(--ct-border);
          }

          &:last-child::before {
            display: none;
          }

          .step-number {
            position: absolute;
            left: -40px;
            top: 0;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: var(--ct-primary);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
          }

          .step-content {
            p {
              margin: 0 0 4px 0;
              color: var(--ct-text);
              line-height: 1.5;
            }
            .step-duration {
              font-size: 12px;
              color: var(--ct-text-secondary);
            }
          }
        }
      }

      .intervention-precautions ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: 6px 0;
          padding-left: 20px;
          position: relative;
          color: var(--ct-text-secondary);
          font-size: 13px;

          &::before {
            content: '!';
            position: absolute;
            left: 0;
            top: 6px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #e6a23c;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
          }
        }
      }

      .components-list {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .component-item {
          padding: 16px;
          background: var(--ct-surface);
          border-radius: 8px;
          border: 1px solid var(--ct-border);

          h5 {
            font-size: 14px;
            font-weight: 600;
            color: var(--ct-primary);
            margin: 0 0 10px 0;
          }

          ul {
            list-style: none;
            padding: 0;
            margin: 0;

            li {
              padding: 4px 0;
              padding-left: 16px;
              position: relative;
              font-size: 13px;
              color: var(--ct-text-secondary);

              &::before {
                content: '✓';
                position: absolute;
                left: 0;
                color: #67c28a;
                font-weight: 700;
              }
            }
          }
        }
      }

      .rules-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .protocol-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        padding: 16px 0 0 0;

        .protocol-item {
          display: flex;
          gap: 8px;

          .label {
            color: var(--ct-text-secondary);
            min-width: 80px;
          }
          .value {
            font-weight: 600;
            color: var(--ct-text);
          }
        }
      }

      .daily-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;

        .daily-item {
          padding: 16px;
          background: var(--ct-surface);
          border-radius: 8px;
          border: 1px solid var(--ct-border);
          text-align: center;

          .daily-time {
            font-size: 14px;
            font-weight: 700;
            color: var(--ct-primary);
            margin-bottom: 6px;
          }
          .daily-activity {
            color: var(--ct-text);
            margin-bottom: 4px;
            font-size: 13px;
          }
          .daily-duration {
            font-size: 12px;
            color: var(--ct-text-secondary);
          }
        }
      }

      .techniques-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .technique-item {
          padding: 16px;
          background: var(--ct-bg-soft);
          border-radius: 8px;

          h5 {
            font-size: 14px;
            font-weight: 600;
            color: var(--ct-text);
            margin: 0 0 8px 0;
          }

          p {
            color: var(--ct-text-secondary);
            margin: 0;
            line-height: 1.5;
          }
        }
      }

      .indications-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .ref-links {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .ref-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--ct-primary);
          font-size: 13px;
          cursor: pointer;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }
}

.assessments-section {
  .assessment-content {
    .assessment-intro {
      padding: 20px;
      background: var(--ct-bg-soft);
      border-radius: 12px;
      margin-bottom: 20px;

      h3 {
        font-size: 18px;
        font-weight: 700;
        color: var(--ct-text);
        margin: 0 0 10px 0;
      }

      p {
        color: var(--ct-text-secondary);
        margin: 0 0 8px 0;
        line-height: 1.6;
      }

      .scoring-rule {
        font-size: 13px;
        color: var(--ct-primary);
        font-weight: 600;
      }
    }

    .assessment-form {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .question-item {
        padding: 16px;
        background: var(--ct-surface);
        border-radius: 8px;
        border: 1px solid var(--ct-border);

        .question-text {
          font-size: 14px;
          color: var(--ct-text);
          margin-bottom: 12px;
          line-height: 1.5;

          .q-number {
            font-weight: 700;
            color: var(--ct-primary);
            margin-right: 4px;
          }
        }
      }
    }

    .assessment-actions {
      display: flex;
      gap: 12px;
      margin: 20px 0;
    }

    .assessment-result {
      padding: 20px;
      border-radius: 12px;
      text-align: center;

      &.danger {
        background: rgba(245, 108, 108, 0.1);
        border: 1px solid #f56c6c;
      }
      &.warning {
        background: rgba(230, 162, 60, 0.1);
        border: 1px solid #e6a23c;
      }
      &.success {
        background: rgba(103, 194, 138, 0.1);
        border: 1px solid #67c28a;
      }

      .result-score {
        font-size: 24px;
        color: var(--ct-text);
        margin-bottom: 8px;

        strong {
          font-size: 36px;
          color: inherit;
        }
      }

      .result-interpretation {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
      }

      .result-reference {
        a {
          color: var(--ct-primary);
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }
}
</style>
