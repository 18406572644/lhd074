<template>
  <div class="app-container" :class="{ dark: themeStore.isDark }">
    <div class="title-bar">
      <div class="title-bar-drag">
        <span class="app-logo">◈</span>
        <span class="app-title">作息节律追踪</span>
      </div>
      <div class="title-bar-actions">
        <div class="global-search" ref="searchWrapRef">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索标签或备注..."
            size="small"
            clearable
            :prefix-icon="Search"
            style="width: 220px"
            @input="handleSearchInput"
            @focus="showSearchResults = true"
          />
          <transition name="fade">
            <div v-if="showSearchResults && searchKeyword.trim()" class="search-results-panel">
              <div class="search-results-header">
                <span>搜索结果</span>
                <span class="result-count">{{ searchResults.length }} 条</span>
              </div>
              <div v-if="searchResults.length === 0" class="search-empty">
                <el-empty description="未找到匹配记录" :image-size="60" />
              </div>
              <div v-else class="search-results-list">
                <div
                  v-for="result in searchResults"
                  :key="result.date"
                  class="search-result-item"
                  @click="jumpToResult(result)"
                >
                  <div class="result-left">
                    <div class="result-date">{{ result.date }}</div>
                    <div class="result-time">
                      {{ result.bedtime }} - {{ result.wakeTime }}
                    </div>
                  </div>
                  <div class="result-center">
                    <div v-if="result.tags && result.tags.length" class="result-tags">
                      <el-tag
                        v-for="t in result.tags"
                        :key="t"
                        size="small"
                        type="primary"
                        effect="light"
                        round
                      >{{ t }}</el-tag>
                    </div>
                    <div v-if="result.note" class="result-note">{{ result.note }}</div>
                  </div>
                  <div class="result-right">
                    <el-tag
                      :type="getScoreTagType(result.score)"
                      size="small"
                      effect="dark"
                      round
                    >{{ result.score }}分</el-tag>
                    <div class="matched-fields">
                      <el-tag
                        v-for="f in result.matchedFields"
                        :key="f"
                        size="small"
                        type="info"
                        effect="plain"
                      >{{ f }}</el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
        <el-switch
          v-model="themeStore.isDark"
          @change="themeStore.toggleTheme()"
          active-text="暗"
          inactive-text="亮"
          size="small"
          style="--el-switch-on-color: #5a9ab8"
        />
        <div class="window-btn" @click="minimize"><el-icon><Minus /></el-icon></div>
        <div class="window-btn" @click="maximize"><el-icon><FullScreen /></el-icon></div>
        <div class="window-btn close-btn" @click="close"><el-icon><Close /></el-icon></div>
      </div>
    </div>
    <div class="app-body">
      <aside class="sidebar">
        <nav class="nav-menu">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            active-class="nav-active"
          >
            <el-icon :size="20"><component :is="item.icon" /></el-icon>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </nav>
        <div class="sidebar-footer">
          <div class="shortcut-hint">
            <el-icon><Key /></el-icon>
            <span>快捷键</span>
          </div>
          <div class="shortcut-list">
            <div><kbd>Ctrl+Shift+D</kbd> 仪表盘</div>
            <div><kbd>Ctrl+Shift+I</kbd> 录入</div>
            <div><kbd>Ctrl+Shift+C</kbd> 日历</div>
            <div><kbd>Ctrl+Shift+S</kbd> 睡眠</div>
            <div><kbd>Ctrl+Shift+E</kbd> 导出</div>
          </div>
          <div class="settings-entry" @click="showSettings = true">
            <el-icon :size="16"><Setting /></el-icon>
            <span>系统设置</span>
          </div>
        </div>
      </aside>
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
    <PdfTemplate v-if="reportData" :reportData="reportData" ref="pdfRef" />
    <ReportExportDialog v-model="showReportDialog" @export="handleDialogExport" />
    <SettingsDialog v-model="showSettings" />
  </div>
</template>

<script setup>
import { onMounted, ref, computed, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import Papa from 'papaparse'
import { useScheduleStore, useThemeStore, useSettingsStore } from '@/store'
import { generateMonthlyReport, generateReport } from '@/utils/pdf'
import PdfTemplate from '@/components/PdfTemplate.vue'
import ReportExportDialog from '@/components/ReportExportDialog.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'

const router = useRouter()
const scheduleStore = useScheduleStore()
const themeStore = useThemeStore()
const settingsStore = useSettingsStore()
const reportData = ref(null)
const pdfRef = ref(null)
const showSettings = ref(false)
const showReportDialog = ref(false)

const searchKeyword = ref('')
const showSearchResults = ref(false)
const searchWrapRef = ref(null)

const navItems = [
  { path: '/', label: '数据仪表盘', icon: 'DataBoard' },
  { path: '/input', label: '作息录入', icon: 'EditPen' },
  { path: '/import', label: '数据导入', icon: 'Upload' },
  { path: '/calendar', label: '日历视图', icon: 'Calendar' },
  { path: '/sleep', label: '睡眠详情', icon: 'Moon' }
]

const searchResults = computed(() => {
  return scheduleStore.searchRecords(searchKeyword.value)
})

function getScoreTagType(score) {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

function handleSearchInput() {
  showSearchResults.value = true
}

function jumpToResult(result) {
  router.push({ path: '/calendar', query: { date: result.date } })
  showSearchResults.value = false
  searchKeyword.value = ''
}

function handleDocumentClick(e) {
  if (searchWrapRef.value && !searchWrapRef.value.contains(e.target)) {
    showSearchResults.value = false
  }
}

function minimize() { window.electronAPI?.minimizeWindow() }
function maximize() { window.electronAPI?.maximizeWindow() }
function close() { window.electronAPI?.closeWindow() }

onMounted(async () => {
  themeStore.initTheme()
  scheduleStore.loadRecords()
  await settingsStore.loadSettings()

  if (window.electronAPI) {
    window.electronAPI.onNavigateTo((route) => {
      router.push(route)
    })
    window.electronAPI.onExportPdf(() => {
      handleExportPdf()
    })
  }

  window.addEventListener('export-pdf', handleExportPdf)
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

async function handleExportPdf() {
  showReportDialog.value = true
}

async function handleDialogExport({ format, report, start, end }) {
  reportData.value = report

  await nextTick()
  await new Promise(r => setTimeout(r, 300))

  const el = document.querySelector('.pdf-template')
  if (!el) {
    ElMessage.error('报告模板渲染失败')
    reportData.value = null
    return
  }

  try {
    if (format === 'pdf') {
      await exportAsPdf(el, report)
    } else if (format === 'png') {
      await exportAsPng(el, report)
    } else if (format === 'csv') {
      await exportAsCsv(report)
    }
    showReportDialog.value = false
    reportData.value = null
  } catch (err) {
    console.error(err)
    ElMessage.error('导出失败，请重试')
    reportData.value = null
  }
}

async function exportAsPdf(el, report) {
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width

  let position = 0
  const pageHeight = pdf.internal.pageSize.getHeight()
  let heightLeft = pdfHeight

  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = -(pageHeight - 0.5) * (Math.ceil((pdfHeight - heightLeft) / pageHeight))
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
    heightLeft -= pageHeight
  }

  const safePeriod = report.period.replace(/[ ~]/g, '_')
  pdf.save(`作息报告_${safePeriod}.pdf`)
  ElMessage.success('PDF 报告已导出')
}

async function exportAsPng(el, report) {
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
  const link = document.createElement('a')
  link.download = `作息报告_${report.period.replace(/[ ~]/g, '_')}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  ElMessage.success('PNG 长图已导出')
}

async function exportAsCsv(report) {
  const rows = [
    ['日期', '入睡时间', '起床时间', '深睡(分钟)', '浅睡(分钟)', '小憩(分钟)', '咖啡因(mg)', '用眼(分钟)', '睡眠评分', '标签', '备注']
  ]

  report.records.forEach((r, i) => {
    rows.push([
      r.date,
      r.bedtime,
      r.wakeTime,
      r.deepSleep || 0,
      r.lightSleep || 0,
      r.napMin || 0,
      r.caffeineMg || 0,
      r.screenMin || 0,
      report.scores[i],
      (r.tags || []).join(';'),
      r.note || ''
    ])
  })

  rows.push([])
  rows.push(['统计汇总'])
  rows.push(['报告周期', report.period])
  rows.push(['记录天数', report.totalDays])
  rows.push(['平均评分', report.avgScore])
  rows.push(['日均睡眠(小时)', report.avgSleep])
  rows.push(['日均深睡(分钟)', report.avgDeep])
  rows.push(['日均浅睡(分钟)', report.avgLight])
  rows.push(['日均咖啡因(mg)', report.avgCaffeine])
  rows.push(['日均用眼(分钟)', report.avgScreen])
  rows.push(['优秀天数(>=80)', report.goodDays])
  rows.push(['一般天数(60-79)', report.warnDays])
  rows.push(['较差天数(<60)', report.badDays])

  const csv = Papa.unparse(rows)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `作息数据_${report.period.replace(/[ ~]/g, '_')}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('CSV 数据已导出')
}
</script>

<style lang="scss" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--ct-bg);
  color: var(--ct-text);
}

.title-bar {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--ct-surface);
  border-bottom: 1px solid var(--ct-border);
  padding: 0 12px;
  -webkit-app-region: drag;
  flex-shrink: 0;

  .title-bar-drag {
    display: flex;
    align-items: center;
    gap: 8px;

    .app-logo {
      color: var(--ct-primary);
      font-size: 18px;
    }

    .app-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--ct-text);
    }
  }

  .title-bar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    -webkit-app-region: no-drag;

    .global-search {
      position: relative;
      margin-right: 8px;

      .search-results-panel {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        width: 480px;
        max-height: 420px;
        background: var(--ct-surface);
        border: 1px solid var(--ct-border);
        border-radius: 10px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
        z-index: 1000;
        overflow: hidden;
        display: flex;
        flex-direction: column;

        .search-results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid var(--ct-border);
          font-size: 12px;
          font-weight: 600;
          color: var(--ct-text);
          background: rgba(126, 184, 216, 0.06);

          .result-count {
            color: var(--ct-text-secondary);
            font-weight: 500;
          }
        }

        .search-empty {
          padding: 20px;
        }

        .search-results-list {
          overflow-y: auto;
          flex: 1;
        }

        .search-result-item {
          display: grid;
          grid-template-columns: 100px 1fr auto;
          gap: 12px;
          padding: 10px 14px;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid var(--ct-border);

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background: rgba(126, 184, 216, 0.08);
          }

          .result-left {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 2px;

            .result-date {
              font-size: 13px;
              font-weight: 700;
              color: var(--ct-text);
            }

            .result-time {
              font-size: 10px;
              color: var(--ct-text-secondary);
            }
          }

          .result-center {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;

            .result-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
            }

            .result-note {
              font-size: 11px;
              color: var(--ct-text-secondary);
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              line-height: 1.4;
            }
          }

          .result-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
            justify-content: center;

            .matched-fields {
              display: flex;
              flex-wrap: wrap;
              gap: 3px;
              justify-content: flex-end;
            }
          }
        }
      }
    }

    .window-btn {
      width: 32px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
      color: var(--ct-text-secondary);

      &:hover {
        background: rgba(126, 184, 216, 0.15);
        color: var(--ct-primary);
      }

      &.close-btn:hover {
        background: #f56c6c;
        color: #fff;
      }
    }
  }
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 180px;
  background: var(--ct-surface);
  border-right: 1px solid var(--ct-border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px 0;
  flex-shrink: 0;

  .nav-menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 8px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 8px;
    color: var(--ct-text-secondary);
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;

    &:hover {
      background: var(--ct-primary-lighter);
      color: var(--ct-primary-dark);
    }

    &.nav-active {
      background: linear-gradient(135deg, var(--ct-primary-light), var(--ct-primary));
      color: #fff;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(126, 184, 216, 0.3);
    }
  }

  .sidebar-footer {
    padding: 0 12px;

    .shortcut-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--ct-text-secondary);
      margin-bottom: 8px;
    }

    .shortcut-list {
      font-size: 10px;
      color: var(--ct-text-secondary);
      line-height: 2;

      kbd {
        background: var(--ct-bg);
        border: 1px solid var(--ct-border);
        border-radius: 3px;
        padding: 0 4px;
        font-size: 9px;
        font-family: monospace;
      }
    }

    .settings-entry {
      margin-top: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      color: var(--ct-text-secondary);
      border: 1px solid var(--ct-border);
      transition: all 0.2s;

      &:hover {
        background: var(--ct-primary-lighter);
        color: var(--ct-primary-dark);
        border-color: var(--ct-primary-light);
      }

      .el-icon {
        color: inherit;
      }
    }
  }
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--ct-bg);
}
</style>
