import { encrypt, decrypt } from './crypto'

const DB_PREFIX = 'ct_'
const RECORDS_KEY = DB_PREFIX + 'records'
const GOALS_KEY = DB_PREFIX + 'goals'
const TAGS_KEY = DB_PREFIX + 'tags'

async function safeGet(key) {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  const decrypted = await decrypt(raw)
  try {
    return JSON.parse(decrypted)
  } catch {
    return decrypted
  }
}

async function safeSet(key, value) {
  const text = JSON.stringify(value)
  const encrypted = await encrypt(text)
  localStorage.setItem(key, encrypted)
}

export const db = {
  async getAllRecords() {
    const records = await safeGet(RECORDS_KEY)
    return Array.isArray(records) ? records : []
  },

  async insertRecord(record) {
    const records = await this.getAllRecords()
    records.push(record)
    await safeSet(RECORDS_KEY, records)
  },

  async updateRecord(record) {
    const records = await this.getAllRecords()
    const idx = records.findIndex(r => r.date === record.date)
    if (idx >= 0) records[idx] = record
    await safeSet(RECORDS_KEY, records)
  },

  async deleteRecord(date) {
    const records = await this.getAllRecords()
    const filtered = records.filter(r => r.date !== date)
    await safeSet(RECORDS_KEY, filtered)
  },

  async getGoals() {
    return await safeGet(GOALS_KEY)
  },

  async saveGoals(goals) {
    await safeSet(GOALS_KEY, goals)
  },

  async getTags() {
    const tags = await safeGet(TAGS_KEY)
    return Array.isArray(tags) ? tags : null
  },

  async saveTags(tags) {
    await safeSet(TAGS_KEY, tags)
  }
}
