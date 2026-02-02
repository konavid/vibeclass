
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key')
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function testUpload() {
    console.log('Testing upload to Supabase Storage...')
    console.log('URL:', supabaseUrl)
    console.log('Key length:', supabaseServiceKey.length)

    const buffer = Buffer.from('Hello, World!')
    const fileName = `test/${Date.now()}_test.txt`

    const { data, error } = await supabaseAdmin.storage
        .from('uploads')
        .upload(fileName, buffer, {
            contentType: 'text/plain',
            upsert: false
        })

    if (error) {
        console.error('Upload failed with error:', error)
    } else {
        console.log('Upload successful:', data)

        // Clean up
        /*
        const { error: deleteError } = await supabaseAdmin.storage
            .from('uploads')
            .remove([fileName])
        if (deleteError) console.error(' cleanup failed:', deleteError)
        else console.log('Cleanup successful')
        */
    }
}

testUpload()
