import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'vibeclass'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

// 클라이언트 초기화
export const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
})

/**
 * R2 스토리지에 파일 업로드
 */
export async function uploadToR2(
    file: Buffer | Uint8Array,
    key: string,
    contentType: string
): Promise<{ success: boolean; url?: string; error?: any }> {
    try {
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: file,
            ContentType: contentType,
        })

        await r2Client.send(command)

        // 공개 URL 생성 (R2_PUBLIC_URL이 설정되어 있어야 함)
        // 예: https://pub-xxxx.r2.dev 또는 커스텀 도메인
        // 끝에 슬래시 처리
        const baseUrl = R2_PUBLIC_URL?.replace(/\/$/, '')
        const publicUrl = baseUrl
            ? `${baseUrl}/${key}`
            : undefined

        return { success: true, url: publicUrl }
    } catch (error) {
        console.error('R2 Upload Error:', error)
        return { success: false, error }
    }
}

/**
 * R2 스토리지에서 파일 삭제
 */
export async function deleteFromR2(key: string) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        })
        await r2Client.send(command)
        return { success: true }
    } catch (error) {
        console.error('R2 Delete Error:', error)
        return { success: false, error }
    }
}
