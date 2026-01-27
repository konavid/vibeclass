/**
 * Google Gemini API 클라이언트
 * 텍스트 생성 및 이미지 생성
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_TEXT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent'

interface TextGenerationOptions {
  prompt: string
  systemInstruction?: string
  maxTokens?: number
  temperature?: number
}

interface ImageGenerationOptions {
  prompt: string
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  numberOfImages?: number
  referenceImage?: string // base64 이미지
  referenceImageMimeType?: string
}

/**
 * Gemini로 텍스트 생성
 */
export async function generateText(options: TextGenerationOptions): Promise<string> {
  const { prompt, systemInstruction, maxTokens = 4000, temperature = 0.7 } = options

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다')
  }

  const contents = []

  if (systemInstruction) {
    contents.push({
      role: 'user',
      parts: [{ text: systemInstruction }]
    })
    contents.push({
      role: 'model',
      parts: [{ text: '네, 알겠습니다. 지시사항을 따르겠습니다.' }]
    })
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  })

  const response = await fetch(`${GEMINI_TEXT_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Gemini API error:', error)
    throw new Error(`Gemini API 요청 실패: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('Gemini에서 응답을 받지 못했습니다')
  }

  return text
}

/**
 * Gemini 3 Pro로 이미지 생성 (나노바나나)
 */
export async function generateImage(options: ImageGenerationOptions): Promise<string> {
  const { prompt, aspectRatio = '16:9', referenceImage, referenceImageMimeType = 'image/jpeg' } = options

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다')
  }

  // parts 배열 구성 (참조 이미지가 있으면 포함)
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

  if (referenceImage) {
    parts.push({
      inlineData: {
        mimeType: referenceImageMimeType,
        data: referenceImage
      }
    })
  }

  parts.push({ text: prompt })

  const response = await fetch(`${GEMINI_IMAGE_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        { parts }
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: '2K'
        }
      }
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Gemini Image API error:', error)
    throw new Error(`Gemini Image API 요청 실패: ${response.status}`)
  }

  const data = await response.json()

  // 응답에서 이미지 찾기
  const responseParts = data.candidates?.[0]?.content?.parts || []
  const imagePart = responseParts.find((part: { inlineData?: { mimeType: string; data: string } }) =>
    part.inlineData?.mimeType?.startsWith('image/')
  )

  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini에서 이미지를 받지 못했습니다')
  }

  return imagePart.inlineData.data
}

/**
 * Base64 이미지를 Buffer로 변환
 */
export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, 'base64')
}
