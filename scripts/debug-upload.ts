import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function testR2Upload() {
    // Dynamic import to ensure env vars are loaded
    const { uploadToR2 } = await import('../lib/r2')

    console.log('Testing upload to Cloudflare R2...')
    console.log('Account ID:', process.env.R2_ACCOUNT_ID)
    console.log('Bucket:', process.env.R2_BUCKET_NAME)

    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
        console.error('Missing R2 Credentials')
        return
    }

    const buffer = Buffer.from('Thinking... Hello R2 from VibeClass!')
    const fileName = `debug/test-${Date.now()}.txt`

    console.log('Uploading file:', fileName)

    const result = await uploadToR2(buffer, fileName, 'text/plain')

    if (result.success) {
        console.log('Upload successful!')
        console.log('Public URL:', result.url)
    } else {
        console.error('Upload failed:')
        console.error(result.error)
    }
}

testR2Upload()
