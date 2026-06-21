import Papa from 'papaparse'
import dayjs from 'dayjs'

export const SYSTEM_FIELDS = [
  { key: 'date', label: '日期', required: true, type: 'date' },
  { key: 'bedtime', label: '入睡时间', required: false, type: 'time' },
  { key: 'wakeTime', label: '起床时间', required: false, type: 'time' },
  { key: 'deepSleep', label: '深睡时长(分钟)', required: false, type: 'number' },
  { key: 'lightSleep', label: '浅睡时长(分钟)', required: false, type: 'number' },
  { key: 'napMin', label: '日间小憩(分钟)', required: false, type: 'number' },
  { key: 'caffeineMg', label: '咖啡因(mg)', required: false, type: 'number' },
  { key: 'screenMin', label: '用眼时长(分钟)', required: false, type: 'number' },
  { key: 'note', label: '备注', required: false, type: 'text' },
  { key: 'tags', label: '标签', required: false, type: 'text' }
]

export const PRESET_SOURCES = [
  {
    id: 'xiaomi',
    name: '小米运动 / Zepp Life',
    format: 'csv',
    description: '小米手环/Zepp Life 导出的睡眠 CSV',
    presetMapping: {
      date: '日期',
      bedtime: '入睡时间',
      wakeTime: '起床时间',
      deepSleep: '深睡时长(分)',
      lightSleep: '浅睡时长(分)'
    }
  },
  {
    id: 'huawei',
    name: '华为运动健康',
    format: 'csv',
    description: '华为运动健康导出的睡眠 CSV',
    presetMapping: {
      date: '日期',
      bedtime: '睡眠开始时间',
      wakeTime: '睡眠结束时间',
      deepSleep: '深度睡眠时长(分)',
      lightSleep: '浅度睡眠时长(分)'
    }
  },
  {
    id: 'apple',
    name: 'Apple Health',
    format: 'csv',
    description: 'Apple Health 导出的睡眠分析 CSV (含 Start Date / End Date)',
    presetMapping: {
      bedtime: 'Start Date',
      wakeTime: 'End Date'
    }
  },
  {
    id: 'autosleep',
    name: 'AutoSleep',
    format: 'csv',
    description: 'AutoSleep 导出的睡眠 CSV',
    presetMapping: {
      date: 'Date',
      bedtime: 'Asleep',
      wakeTime: 'Awake',
      deepSleep: 'Deep',
      lightSleep: 'Lights'
    }
  },
  {
    id: 'custom',
    name: '自定义文件',
    format: 'auto',
    description: 'CSV 或 JSON 格式，手动映射字段',
    presetMapping: {}
  }
]

export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'json') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          let data = JSON.parse(e.target.result)
          if (!Array.isArray(data)) {
            if (typeof data === 'object' && data !== null) {
              const keys = Object.keys(data)
              const arrayKey = keys.find(k => Array.isArray(data[k]))
              if (arrayKey) {
                data = data[arrayKey]
              } else {
                data = [data]
              }
            } else {
              data = [data]
            }
          }
          if (data.length === 0) {
            reject(new Error('JSON 文件中未找到数据记录'))
            return
          }
          const columns = Object.keys(data[0])
          resolve({ columns, rows: data, format: 'json' })
        } catch (err) {
          reject(new Error('JSON 解析失败：' + err.message))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file, 'utf-8')
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'utf-8',
      complete(results) {
        if (results.errors.length > 0) {
          const critical = results.errors.filter(e => e.type === 'Quotes' || e.type === 'FieldMismatch')
          if (critical.length > 0 && results.data.length === 0) {
            reject(new Error('CSV 解析失败：' + critical[0].message))
            return
          }
        }
        if (results.data.length === 0) {
          reject(new Error('CSV 文件中未找到数据行'))
          return
        }
        const columns = results.meta.fields || []
        resolve({ columns, rows: results.data, format: 'csv' })
      },
      error(err) {
        reject(new Error('CSV 解析失败：' + err.message))
      }
    })
  })
}

function parseDate(val) {
  if (!val) return null
  if (typeof val === 'number') {
    const d = new Date(val)
    if (!isNaN(d.getTime())) return dayjs(d).format('YYYY-MM-DD')
    return null
  }
  const s = String(val).trim()
  const m1 = dayjs(s)
  if (m1.isValid()) return m1.format('YYYY-MM-DD')
  const ts = Date.parse(s)
  if (!isNaN(ts)) return dayjs(ts).format('YYYY-MM-DD')
  return null
}

function parseTime(val) {
  if (!val) return null
  if (typeof val === 'number') {
    const totalMin = Math.round(val * 24 * 60)
    const h = Math.floor(totalMin / 60) % 24
    const m = totalMin % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  const s = String(val).trim()
  const hmMatch = s.match(/(\d{1,2})[:：hH](\d{1,2})/)
  if (hmMatch) {
    return `${hmMatch[1].padStart(2, '0')}:${hmMatch[2].padStart(2, '0')}`
  }
  const fullMatch = s.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2})[:：](\d{1,2})/)
  if (fullMatch) {
    return `${fullMatch[4].padStart(2, '0')}:${fullMatch[5].padStart(2, '0')}`
  }
  const ampmMatch = s.match(/(\d{1,2})[:：](\d{1,2})\s*(AM|PM)/i)
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1])
    const m = ampmMatch[2]
    if (/PM/i.test(ampmMatch[3]) && h < 12) h += 12
    if (/AM/i.test(ampmMatch[3]) && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m.padStart(2, '0')}`
  }
  return null
}

function parseNumber(val) {
  if (val == null) return 0
  if (typeof val === 'number') return Math.round(val)
  const n = parseFloat(String(val).replace(/[^\d.-]/g, ''))
  return isNaN(n) ? 0 : Math.round(n)
}

function extractTimeFromDatetime(val) {
  if (!val) return null
  const s = String(val).trim()
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return parseTime(val)
}

function extractDateFromDatetime(val) {
  if (!val) return null
  const s = String(val).trim()
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    return dayjs(d).format('YYYY-MM-DD')
  }
  return parseDate(val)
}

export function applyMapping(rows, mapping) {
  return rows.map((row, idx) => {
    const record = { _sourceRow: idx + 1, _warnings: [] }

    const dateCol = mapping.date
    if (dateCol) {
      record.date = extractDateFromDatetime(row[dateCol])
      if (!record.date) record._warnings.push('日期解析失败')
    }

    const bedtimeCol = mapping.bedtime
    if (bedtimeCol) {
      record.bedtime = extractTimeFromDatetime(row[bedtimeCol]) || parseTime(row[bedtimeCol])
      if (!record.bedtime) record._warnings.push('入睡时间解析失败')
      else record.bedtime = record.bedtime.substring(0, 5)
    }

    const wakeTimeCol = mapping.wakeTime
    if (wakeTimeCol) {
      record.wakeTime = extractTimeFromDatetime(row[wakeTimeCol]) || parseTime(row[wakeTimeCol])
      if (!record.wakeTime) record._warnings.push('起床时间解析失败')
      else record.wakeTime = record.wakeTime.substring(0, 5)
    }

    const deepCol = mapping.deepSleep
    if (deepCol && row[deepCol] != null && row[deepCol] !== '') {
      record.deepSleep = parseNumber(row[deepCol])
    }

    const lightCol = mapping.lightSleep
    if (lightCol && row[lightCol] != null && row[lightCol] !== '') {
      record.lightSleep = parseNumber(row[lightCol])
    }

    const napCol = mapping.napMin
    if (napCol && row[napCol] != null && row[napCol] !== '') {
      record.napMin = parseNumber(row[napCol])
    }

    const caffeineCol = mapping.caffeineMg
    if (caffeineCol && row[caffeineCol] != null && row[caffeineCol] !== '') {
      record.caffeineMg = parseNumber(row[caffeineCol])
    }

    const screenCol = mapping.screenMin
    if (screenCol && row[screenCol] != null && row[screenCol] !== '') {
      record.screenMin = parseNumber(row[screenCol])
    }

    const noteCol = mapping.note
    if (noteCol && row[noteCol] != null && row[noteCol] !== '') {
      record.note = String(row[noteCol]).trim()
    }

    const tagsCol = mapping.tags
    if (tagsCol && row[tagsCol] != null && row[tagsCol] !== '') {
      const tagStr = String(row[tagsCol]).trim()
      record.tags = tagStr.includes(',') ? tagStr.split(',').map(t => t.trim()).filter(Boolean) : [tagStr]
    }

    return record
  }).filter(r => r.date)
}

export function detectConflicts(mappedRecords, existingRecords) {
  const existingMap = new Map()
  for (const r of existingRecords) {
    existingMap.set(r.date, r)
  }

  return mappedRecords.map(record => {
    const existing = existingMap.get(record.date)
    return {
      ...record,
      _conflict: existing ? 'existing' : 'new',
      _existingRecord: existing || null
    }
  })
}

function countFilledFields(record) {
  let count = 0
  if (record.date) count++
  if (record.bedtime) count++
  if (record.wakeTime) count++
  if (record.deepSleep) count++
  if (record.lightSleep) count++
  if (record.napMin) count++
  if (record.caffeineMg) count++
  if (record.screenMin) count++
  if (record.note) count++
  if (record.tags && record.tags.length) count++
  return count
}

export function mergeRecords(existing, incoming) {
  const merged = { ...existing }
  const fieldsToCheck = ['bedtime', 'wakeTime', 'deepSleep', 'lightSleep', 'napMin', 'caffeineMg', 'screenMin', 'note']
  for (const field of fieldsToCheck) {
    const hasExisting = existing[field] != null && existing[field] !== '' && existing[field] !== 0
    const hasIncoming = incoming[field] != null && incoming[field] !== '' && incoming[field] !== 0
    if (!hasExisting && hasIncoming) {
      merged[field] = incoming[field]
    } else if (hasExisting && hasIncoming) {
      const existingFilled = countFilledFields(existing)
      const incomingFilled = countFilledFields(incoming)
      if (incomingFilled > existingFilled) {
        merged[field] = incoming[field]
      }
    }
  }
  if (incoming.tags && incoming.tags.length > 0) {
    const existingTags = existing.tags || []
    const combined = [...new Set([...existingTags, ...incoming.tags])]
    merged.tags = combined
  }
  return merged
}

export function generateSampleCSV(sourceId) {
  const samples = {
    xiaomi: '日期,入睡时间,起床时间,深睡时长(分),浅睡时长(分),备注\n2025-06-01,23:15,06:45,90,195,正常作息\n2025-06-02,00:30,07:20,60,210,熬夜加班\n2025-06-03,22:45,06:30,105,165,早睡早起',
    huawei: '日期,睡眠开始时间,睡眠结束时间,深度睡眠时长(分),浅度睡眠时长(分),备注\n2025-06-01,23:15,06:45,90,195,\n2025-06-02,00:30,07:20,60,210,熬夜\n2025-06-03,22:45,06:30,105,165,',
    apple: 'Type,Start Date,End Date,Value\nSleepAnalysis,2025-06-01 23:15:00 +0800,2025-06-02 06:45:00 +0800,DeepSleep\nSleepAnalysis,2025-06-01 23:15:00 +0800,2025-06-02 06:45:00 +0800,LightSleep\nSleepAnalysis,2025-06-02 00:30:00 +0800,2025-06-02 07:20:00 +0800,DeepSleep',
    autosleep: 'Date,Asleep,Awake,Deep,Lights,REM,Rating,Notes\n2025-06-01,23:15,06:45,90,195,60,8.5,\n2025-06-02,00:30,07:20,60,210,45,6.2,熬夜\n2025-06-03,22:45,06:30,105,165,55,9.1,',
    custom: '日期,入睡时间,起床时间,深睡时长(分钟),浅睡时长(分钟),日间小憩(分钟),咖啡因(mg),用眼时长(分钟),备注,标签\n2025-06-01,23:15,06:45,90,195,0,100,360,正常,运动\n2025-06-02,00:30,07:20,60,210,20,200,480,熬夜加班,加班;熬夜\n2025-06-03,22:45,06:30,105,165,0,0,300,早睡,'
  }
  return samples[sourceId] || samples.custom
}

export function generateSampleJSON(sourceId) {
  const samples = {
    custom: [
      { '日期': '2025-06-01', '入睡时间': '23:15', '起床时间': '06:45', '深睡时长(分钟)': 90, '浅睡时长(分钟)': 195, '备注': '正常' },
      { '日期': '2025-06-02', '入睡时间': '00:30', '起床时间': '07:20', '深睡时长(分钟)': 60, '浅睡时长(分钟)': 210, '备注': '熬夜' },
      { '日期': '2025-06-03', '入睡时间': '22:45', '起床时间': '06:30', '深睡时长(分钟)': 105, '浅睡时长(分钟)': 165, '备注': '' }
    ]
  }
  return JSON.stringify(samples[sourceId] || samples.custom, null, 2)
}

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function applyPresetMapping(sourceId, columns) {
  const source = PRESET_SOURCES.find(s => s.id === sourceId)
  if (!source || sourceId === 'custom') return {}

  const mapping = {}
  for (const [sysKey, presetCol] of Object.entries(source.presetMapping)) {
    const found = columns.find(c =>
      c === presetCol ||
      c.toLowerCase().trim() === presetCol.toLowerCase().trim() ||
      c.includes(presetCol) ||
      presetCol.includes(c)
    )
    if (found) {
      mapping[sysKey] = found
    }
  }
  return mapping
}
