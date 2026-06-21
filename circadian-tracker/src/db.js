const STORAGE_KEYS = {
  RECORDS: 'circadian_records',
  GOALS: 'circadian_goals',
  TAGS: 'circadian_tags',
  MAPPING_TEMPLATES: 'circadian_mapping_templates'
}

function safeGet(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined) return defaultValue
    return JSON.parse(raw)
  } catch (err) {
    console.error(`Failed to parse ${key}:`, err)
    return defaultValue
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    console.error(`Failed to save ${key}:`, err)
    return false
  }
}

export const db = {
  async getAllRecords() {
    return safeGet(STORAGE_KEYS.RECORDS, [])
  },

  async insertRecord(record) {
    const records = safeGet(STORAGE_KEYS.RECORDS, [])
    records.push(record)
    safeSet(STORAGE_KEYS.RECORDS, records)
    return record
  },

  async updateRecord(record) {
    const records = safeGet(STORAGE_KEYS.RECORDS, [])
    const idx = records.findIndex(r => r.date === record.date)
    if (idx >= 0) {
      records[idx] = record
      safeSet(STORAGE_KEYS.RECORDS, records)
    }
    return record
  },

  async deleteRecord(date) {
    const records = safeGet(STORAGE_KEYS.RECORDS, [])
    const filtered = records.filter(r => r.date !== date)
    safeSet(STORAGE_KEYS.RECORDS, filtered)
    return true
  },

  async getGoals() {
    return safeGet(STORAGE_KEYS.GOALS, null)
  },

  async saveGoals(goalsObj) {
    safeSet(STORAGE_KEYS.GOALS, goalsObj)
    return true
  },

  async getTags() {
    return safeGet(STORAGE_KEYS.TAGS, [])
  },

  async saveTags(tags) {
    safeSet(STORAGE_KEYS.TAGS, tags)
    return true
  },

  async getMappingTemplates() {
    return safeGet(STORAGE_KEYS.MAPPING_TEMPLATES, [])
  },

  async saveMappingTemplates(templates) {
    safeSet(STORAGE_KEYS.MAPPING_TEMPLATES, templates)
    return true
  }
}

export default db
