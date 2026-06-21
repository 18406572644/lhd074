<template>
  <div class="app-container" :class="{ dark: themeStore.isDark }">
    <div class="title-bar">
      <div class="title-bar-drag">
        <span class="app-logo">◈</span>
        <span class="app-title">作息节律追踪</span>
      </div>
      <div class="title-bar-actions">
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
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useScheduleStore, useThemeStore } from '@/store'
import { generateMonthlyReport } from '@/utils/pdf'
import PdfTemplate from '@/components/PdfTemplate.vue'

const router = useRouter()
const scheduleStore = useScheduleStore()
const themeStore = useThemeStore()
const reportData = ref(null)
const pdfRef = ref(null)

const navItems = [
  { path: '/', label: '数据仪表盘', icon: 'DataBoard' },
  { path: '/input', label: '作息录入', icon: 'EditPen' },
  { path: '/calendar', label: '日历视图', icon: 'Calendar' },
  { path: '/sleep', label: '睡眠详情', icon: 'Moon' }
]

function minimize() { window.electronAPI?.minimizeWindow() }
function maximize() { window.electronAPI?.maximizeWindow() }
function close() { window.electronAPI?.closeWindow() }

onMounted(() => {
  themeStore.initTheme()
  scheduleStore.loadRecords()

  if (window.electronAPI) {
    window.electronAPI.onNavigateTo((route) => {
      router.push(route)
    })
    window.electronAPI.onExportPdf(() => {
      handleExportPdf()
    })
  }

  window.addEventListener('export-pdf', handleExportPdf)
})

async function handleExportPdf() {
  const report = await generateMonthlyReport(scheduleStore)
  if (!report) {
    ElMessage.warning('暂无足够数据生成报告')
    return
  }
  reportData.value = report

  await new Promise(r => setTimeout(r, 100))

  const el = document.querySelector('.pdf-template')
  if (!el) {
    ElMessage.error('报告模板渲染失败')
    return
  }

  try {
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

    pdf.save(`作息报告_${report.period.replace(/ /g, '')}.pdf`)
    ElMessage.success('月度报告已导出')
    reportData.value = null
  } catch {
    ElMessage.error('PDF导出失败')
    reportData.value = null
  }
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
    gap: 4px;
    -webkit-app-region: no-drag;

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
  }
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--ct-bg);
}
</style>
