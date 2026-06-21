import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { db } from '@/db'

const DEFAULT_TAGS = ['加班', '熬夜', '出差', '感冒', '经期', '运动', '饮酒', '压力大']

export const useScheduleStore = defineStore('schedule', () => {
  const records = ref([])
  const mappingTemplates = ref([])
  const goals = ref({
    targetBedtime: '23:00',
    targetWakeTime: '07:00',
    targetSleepHours: 8,
    targetDeepRatio: 0.25,
    maxCaffeineMg: 200,
    maxScreenMin: 480,
    smartRecommend: {
      enabled: false,
      percentile: 'p50',
      lastCalibrated: null
    }
  })
  const tags = ref([...DEFAULT_TAGS])

  const todayRecord = computed(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return records.value.find(r => r.date === today) || null
  })

  async function loadRecords() {
    records.value = await db.getAllRecords()
    const savedGoals = await db.getGoals()
    if (savedGoals) goals.value = { ...goals.value, ...JSON.parse(savedGoals) }
    const savedTags = await db.getTags()
    if (savedTags && savedTags.length > 0) tags.value = savedTags
    mappingTemplates.value = await db.getMappingTemplates()
  }

  async function addRecord(record) {
    const normalized = {
      date: record.date,
      bedtime: record.bedtime || '23:00',
      wakeTime: record.wakeTime || '07:00',
      deepSleep: Number(record.deepSleep) || 0,
      lightSleep: Number(record.lightSleep) || 0,
      napMin: Number(record.napMin) || 0,
      caffeineMg: Number(record.caffeineMg) || 0,
      screenMin: Number(record.screenMin) || 0,
      note: record.note || '',
      tags: Array.isArray(record.tags) ? record.tags : [],
      preSleepMood: record.preSleepMood || null,
      preSleepActivities: Array.isArray(record.preSleepActivities) ? record.preSleepActivities : [],
      preSleepThoughts: Number(record.preSleepThoughts) || 0,
      morningEnergy: Number(record.morningEnergy) || 0,
      dreamStatus: record.dreamStatus || null,
      dreamDescription: record.dreamDescription || '',
      nightWakeUps: record.nightWakeUps || null
    }
    const existing = records.value.findIndex(r => r.date === normalized.date)
    if (existing >= 0) {
      records.value.splice(existing, 1, normalized)
      await db.updateRecord(normalized)
    } else {
      records.value = [...records.value, normalized]
      await db.insertRecord(normalized)
    }
  }

  async function saveGoals(newGoals) {
    goals.value = { ...goals.value, ...newGoals }
    await db.saveGoals(JSON.stringify(goals.value))
  }

  function shouldAutoCalibrate() {
    const sr = goals.value.smartRecommend
    if (!sr || !sr.enabled) return false
    if (!sr.lastCalibrated) return true
    const last = dayjs(sr.lastCalibrated)
    return dayjs().diff(last, 'day') >= 7
  }

  async function applySmartRecommendation(recommendation, percentile = 'p50') {
    const preset = recommendation[percentile]
    if (!preset) return false
    goals.value.targetBedtime = preset.targetBedtime
    goals.value.targetWakeTime = preset.targetWakeTime
    goals.value.targetSleepHours = preset.targetSleepHours
    goals.value.smartRecommend = {
      ...goals.value.smartRecommend,
      percentile,
      lastCalibrated: dayjs().format('YYYY-MM-DD')
    }
    await db.saveGoals(JSON.stringify(goals.value))
    return true
  }

  async function addTag(tagName) {
    const trimmed = tagName.trim()
    if (!trimmed) return false
    if (tags.value.includes(trimmed)) return false
    tags.value.push(trimmed)
    await db.saveTags(tags.value)
    return true
  }

  async function removeTag(tagName) {
    const idx = tags.value.indexOf(tagName)
    if (idx >= 0) {
      tags.value.splice(idx, 1)
      await db.saveTags(tags.value)
      return true
    }
    return false
  }

  async function deleteRecord(date) {
    const idx = records.value.findIndex(r => r.date === date)
    if (idx >= 0) {
      records.value.splice(idx, 1)
      await db.deleteRecord(date)
    }
  }

  async function addMappingTemplate(template) {
    mappingTemplates.value.push(template)
    await db.saveMappingTemplates(mappingTemplates.value)
  }

  async function removeMappingTemplate(id) {
    const idx = mappingTemplates.value.findIndex(t => t.id === id)
    if (idx >= 0) {
      mappingTemplates.value.splice(idx, 1)
      await db.saveMappingTemplates(mappingTemplates.value)
    }
  }

  async function saveMappingTemplatesLocal() {
    await db.saveMappingTemplates(mappingTemplates.value)
  }

  function getRecordsByRange(startDate, endDate, filterTag = null) {
    let result = records.value.filter(r => r.date >= startDate && r.date <= endDate)
    if (filterTag) {
      result = result.filter(r => Array.isArray(r.tags) && r.tags.includes(filterTag))
    }
    return result
  }

  function getRecordsByYear(year, filterTag = null) {
    const start = `${year}-01-01`
    const end = `${year}-12-31`
    return getRecordsByRange(start, end, filterTag)
  }

  function getLast7Days(filterTag = null) {
    const end = dayjs().format('YYYY-MM-DD')
    const start = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
    return getRecordsByRange(start, end, filterTag)
  }

  function getLast30Days(filterTag = null) {
    const end = dayjs().format('YYYY-MM-DD')
    const start = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
    return getRecordsByRange(start, end, filterTag)
  }

  function calcSleepScore(record) {
    if (!record) return 0
    let score = 0

    const bedtime = dayjs(`${record.date} ${record.bedtime}`)
    const wakeTime = dayjs(`${record.date} ${record.wakeTime}`)
    let sleepHours = wakeTime.diff(bedtime, 'minute') / 60
    if (sleepHours < 0) sleepHours += 24

    const targetHours = goals.value.targetSleepHours
    const durationScore = Math.max(0, 30 - Math.abs(sleepHours - targetHours) * 6)
    score += durationScore

    const targetBedtime = dayjs(`${record.date} ${goals.value.targetBedtime}`)
    const bedtimeDiff = Math.abs(bedtime.diff(targetBedtime, 'minute'))
    const bedtimeScore = Math.max(0, 20 - bedtimeDiff * 0.2)
    score += bedtimeScore

    const deepRatio = record.deepSleep / (sleepHours * 60 || 1)
    const deepScore = Math.max(0, 20 - Math.abs(deepRatio - goals.value.targetDeepRatio) * 80)
    score += deepScore

    const caffeinePenalty = Math.min(10, (record.caffeineMg || 0) / goals.value.maxCaffeineMg * 10)
    score += (15 - caffeinePenalty)

    const screenPenalty = Math.min(10, (record.screenMin || 0) / goals.value.maxScreenMin * 10)
    score += (15 - screenPenalty)

    return Math.round(Math.min(100, Math.max(0, score)))
  }

  function searchRecords(keyword) {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return []
    return records.value
      .filter(r => {
        const noteMatch = r.note && r.note.toLowerCase().includes(kw)
        const tagMatch = Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase().includes(kw))
        const dateMatch = r.date.includes(kw)
        return noteMatch || tagMatch || dateMatch
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(r => ({
        ...r,
        score: calcSleepScore(r),
        matchedFields: [
          r.note && r.note.toLowerCase().includes(kw) ? '备注' : null,
          Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase().includes(kw)) ? '标签' : null,
          r.date.includes(kw) ? '日期' : null
        ].filter(Boolean)
      }))
  }

  return {
    records, goals, tags, mappingTemplates, todayRecord,
    loadRecords, addRecord, deleteRecord, saveGoals, addTag, removeTag,
    addMappingTemplate, removeMappingTemplate, saveMappingTemplatesLocal,
    getRecordsByRange, getRecordsByYear, getLast7Days, getLast30Days, calcSleepScore,
    searchRecords, shouldAutoCalibrate, applySmartRecommendation
  }
})

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  function initTheme() {
    const saved = localStorage.getItem('circadian-theme')
    if (saved) {
      isDark.value = saved === 'dark'
    } else if (window.electronAPI) {
      isDark.value = window.electronAPI.getSystemTheme() === 'dark'
    }
    applyTheme()
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.setItem('circadian-theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  function applyTheme() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  return { isDark, initTheme, toggleTheme }
})

export const useSettingsStore = defineStore('settings', () => {
  const DEFAULT_SETTINGS = {
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
    autoStart: true
  }

  const settings = ref(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)))

  function deepMerge(target, source) {
    const result = JSON.parse(JSON.stringify(target))
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    return result
  }

  async function loadSettings() {
    if (window.electronAPI && typeof window.electronAPI.getSettings === 'function') {
      try {
        const saved = await window.electronAPI.getSettings()
        if (saved && typeof saved === 'object') {
          settings.value = deepMerge(DEFAULT_SETTINGS, saved)
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }
  }

  async function saveSettings(newSettings) {
    const merged = deepMerge(settings.value, newSettings)
    if (window.electronAPI && typeof window.electronAPI.setSettings === 'function') {
      try {
        const result = await window.electronAPI.setSettings(merged)
        if (result && result.success) {
          settings.value = deepMerge(DEFAULT_SETTINGS, result.data || merged)
          return { success: true }
        } else {
          return { success: false, message: result?.message || '保存失败' }
        }
      } catch (err) {
        console.error('Failed to save settings:', err)
        return { success: false, message: err.message || '保存失败' }
      }
    }
    settings.value = merged
    return { success: true }
  }

  async function testReminder(type) {
    if (window.electronAPI && typeof window.electronAPI.testReminder === 'function') {
      return await window.electronAPI.testReminder(type)
    }
    return { success: false, message: 'Electron API 不可用' }
  }

  return { settings, loadSettings, saveSettings, testReminder }
})
