import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY ?? '', 'hex')
const IV = Buffer.from(process.env.ENCRYPTION_IV ?? '', 'hex')

/**
 * Chiffre un texte avec AES-256-CBC
 */
export function encrypt(plaintext: string): string {
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV)
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return encrypted
}

/**
 * Déchiffre un texte chiffré avec AES-256-CBC
 */
export function decrypt(ciphertext: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV)
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Hache un identifiant pour les logs (conformité RGPD — pseudonymisation)
 */
export function pseudonymize(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16)
}

/**
 * Génère un token aléatoire sécurisé
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}
