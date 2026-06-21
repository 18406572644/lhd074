import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { db } from '@/db'

export const useScheduleStore = defineStore('schedule', () => {
  const records = ref([])
  const goals = ref({
    targetBedtime: '23:00',
    targetWakeTime: '07:00',
    targetSleepHours: 8,
    targetDeepRatio: 0.25,
    maxCaffeineMg: 200,
    maxScreenMin: 480
  })

  const todayRecord = computed(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return records.value.find(r => r.date === today) || null
  })

  async function loadRecords() {
    records.value = await db.getAllRecords()
    const savedGoals = await db.getGoals()
    if (savedGoals) goals.value = { ...goals.value, ...JSON.parse(savedGoals) }
  }

  async function addRecord(record) {
    const existing = records.value.findIndex(r => r.date === record.date)
    if (existing >= 0) {
      records.value[existing] = record
      await db.updateRecord(record)
    } else {
      records.value.push(record)
      await db.insertRecord(record)
    }
  }

  async function saveGoals(newGoals) {
    goals.value = { ...goals.value, ...newGoals }
    await db.saveGoals(JSON.stringify(goals.value))
  }

  function getRecordsByRange(startDate, endDate) {
    return records.value.filter(r => r.date >= startDate && r.date <= endDate)
  }

  function getRecordsByYear(year) {
    const start = `${year}-01-01`
    const end = `${year}-12-31`
    return getRecordsByRange(start, end)
  }

  function getLast7Days() {
    const end = dayjs().format('YYYY-MM-DD')
    const start = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
    return getRecordsByRange(start, end)
  }

  function getLast30Days() {
    const end = dayjs().format('YYYY-MM-DD')
    const start = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
    return getRecordsByRange(start, end)
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

  return {
    records, goals, todayRecord,
    loadRecords, addRecord, saveGoals,
    getRecordsByRange, getRecordsByYear, getLast7Days, getLast30Days, calcSleepScore
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
