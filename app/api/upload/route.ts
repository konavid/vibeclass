import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import {
  requireAuth,
  badRequestResponse,
  serverErrorResponse,
  sanitizeFileName,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  safeErrorLog,
} from '@/lib/security'

// 파일 타입별 설정
const FILE_CONFIG = {
  courses: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ALLOWED_IMAGE_TYPES,
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  },
  instructors: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ALLOWED_IMAGE_TYPES,
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  },
  materials: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES],
    allowedExtensions: [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'txt'
    ],
  },
} as const

type UploadType = keyof typeof FILE_CONFIG

export async function POST(request: NextRequest) {
  try {
    // 인증 필수
    const { session, error } = await requireAuth()
    if (error) return error

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const typeParam = formData.get('type') as string | null

    if (!file) {
      return badRequestResponse('파일이 없습니다.')
    }

    // 파일 타입 결정
    const uploadType: UploadType = (typeParam && typeParam in FILE_CONFIG)
      ? typeParam as UploadType
      : 'courses'

    const config = FILE_CONFIG[uploadType]

    // 파일 크기 검증
    if (file.size > config.maxSize) {
      const maxMB = config.maxSize / (1024 * 1024)
      return badRequestResponse(`파일 크기는 ${maxMB}MB를 초과할 수 없습니다.`)
    }

    // MIME 타입 검증
    if (!config.allowedTypes.includes(file.type)) {
      return badRequestResponse('허용되지 않는 파일 형식입니다.')
    }

    // 확장자 검증
    const originalExt = file.name.split('.').pop()?.toLowerCase() || ''
    if (!config.allowedExtensions.includes(originalExt)) {
      return badRequestResponse('허용되지 않는 파일 확장자입니다.')
    }

    // 파일 내용 읽기
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 매직 바이트 검증 (파일 시그니처 확인)
    if (!validateFileMagicBytes(buffer, originalExt)) {
      return badRequestResponse('파일 내용이 확장자와 일치하지 않습니다.')
    }

    // 안전한 파일명 생성
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const safeName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''))
    const fileName = `${timestamp}_${randomSuffix}_${safeName}.${originalExt}`

    // 저장 경로 (public/uploads/{type}/)
    const uploadDir = join(process.cwd(), 'public', 'uploads', uploadType)

    // 디렉토리가 없으면 생성
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }

    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // URL 반환
    const fileUrl = `/uploads/${uploadType}/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl
    })
  } catch (error) {
    safeErrorLog('파일 업로드 오류:', error)
    return serverErrorResponse('파일 업로드에 실패했습니다.')
  }
}

/**
 * 매직 바이트 검증 (파일 시그니처 확인)
 */
function validateFileMagicBytes(buffer: Buffer, extension: string): boolean {
  if (buffer.length < 4) return false

  // 파일 시그니처 정의
  const signatures: Record<string, number[][]> = {
    // 이미지
    jpg: [[0xFF, 0xD8, 0xFF]],
    jpeg: [[0xFF, 0xD8, 0xFF]],
    png: [[0x89, 0x50, 0x4E, 0x47]],
    gif: [[0x47, 0x49, 0x46, 0x38]],
    webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF
    svg: [[0x3C, 0x3F, 0x78, 0x6D], [0x3C, 0x73, 0x76, 0x67]], // <?xm or <svg

    // 문서
    pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
    zip: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]], // PK
    doc: [[0xD0, 0xCF, 0x11, 0xE0]], // DOC/XLS (OLE)
    docx: [[0x50, 0x4B, 0x03, 0x04]], // DOCX/XLSX (ZIP based)
    xls: [[0xD0, 0xCF, 0x11, 0xE0]],
    xlsx: [[0x50, 0x4B, 0x03, 0x04]],

    // 텍스트 (다양한 인코딩 허용)
    txt: [], // 텍스트 파일은 시그니처 검증 생략
  }

  const expectedSignatures = signatures[extension]

  // 시그니처가 정의되지 않은 경우 (txt 등)
  if (!expectedSignatures || expectedSignatures.length === 0) {
    return true
  }

  // 시그니처 중 하나라도 일치하면 통과
  return expectedSignatures.some(sig =>
    sig.every((byte, index) => buffer[index] === byte)
  )
}
