const ALGORITHM = 'AES-GCM'
const KEY_MATERIAL = 'circadian-tracker-2024-mist-blue-secure'

let cryptoKey = null

async function getKey() {
  if (cryptoKey) return cryptoKey
  const encoder = new TextEncoder()
  const keyData = encoder.encode(KEY_MATERIAL)
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData)
  cryptoKey = await crypto.subtle.importKey(
    'raw', hashBuffer, { name: ALGORITHM }, false, ['encrypt', 'decrypt']
  )
  return cryptoKey
}

async function encrypt(text) {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, data)
  const result = new Uint8Array(iv.length + encrypted.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(encrypted), iv.length)
  return btoa(String.fromCharCode(...result))
}

async function decrypt(cipherText) {
  try {
    const key = await getKey()
    const raw = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0))
    const iv = raw.slice(0, 12)
    const data = raw.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data)
    return new TextDecoder().decode(decrypted)
  } catch {
    return cipherText
  }
}

export { encrypt, decrypt }
