import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export type FileType = 'pdf' | 'docx' | 'doc' | 'txt' | 'unknown'

export function detectFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx') return 'docx'
  if (ext === 'doc') return 'doc'
  if (ext === 'txt') return 'txt'
  return 'unknown'
}

/**
 * Extrait le texte brut d'un Buffer selon le type de fichier
 */
export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const type = detectFileType(filename)

  switch (type) {
    case 'pdf': {
      const data = await pdfParse(buffer)
      return data.text.trim()
    }
    case 'docx':
    case 'doc': {
      const result = await mammoth.extractRawText({ buffer })
      return result.value.trim()
    }
    case 'txt': {
      return buffer.toString('utf-8').trim()
    }
    default:
      throw new Error(`Format de fichier non supporté : ${filename}`)
  }
}

/**
 * Validation de la taille et du type de fichier
 */
export function validateFile(
  filename: string,
  sizeBytes: number,
  maxMB = 10
): { valid: boolean; error?: string } {
  const type = detectFileType(filename)

  if (type === 'unknown') {
    return { valid: false, error: 'Format non supporté. Utilisez PDF, DOCX ou TXT.' }
  }

  const maxBytes = maxMB * 1024 * 1024
  if (sizeBytes > maxBytes) {
    return { valid: false, error: `Fichier trop volumineux (max ${maxMB} Mo).` }
  }

  return { valid: true }
}
