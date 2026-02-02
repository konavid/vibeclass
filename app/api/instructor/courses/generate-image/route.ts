import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateImage, base64ToBuffer } from '@/lib/gemini'
import { uploadToR2 } from '@/lib/r2'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'

// 강의 주제에 맞는 이미지 스타일 정의
interface ImageStyle {
  scene: string
  elements: string
  colors: string
  mood: string
}

function getImageStyleForTopic(title: string, category: string): ImageStyle {
  if (/python|파이썬/i.test(title)) {
    return {
      scene: 'Abstract 3D visualization of Python programming',
      elements: 'floating Python snake logo, colorful code blocks, data structures',
      colors: 'vibrant blue (#3776AB) and golden yellow (#FFD43B)',
      mood: 'dynamic, modern, technical'
    }
  }
  if (/javascript|자바스크립트|js/i.test(title)) {
    return {
      scene: 'Modern web development concept art',
      elements: 'JavaScript logo, browser windows, DOM tree visualization',
      colors: 'bright yellow (#F7DF1E) and dark charcoal (#323330)',
      mood: 'energetic, web-focused, interactive'
    }
  }
  if (/react|리액트/i.test(title)) {
    return {
      scene: 'React ecosystem abstract visualization',
      elements: 'spinning React atom logo, component hierarchy, virtual DOM tree',
      colors: 'cyan (#61DAFB) and deep navy (#20232A)',
      mood: 'clean, component-based, modular'
    }
  }
  if (/ai|인공지능|gpt|chatgpt|claude/i.test(title)) {
    return {
      scene: 'Futuristic AI and machine learning concept',
      elements: 'glowing neural network, AI brain visualization, digital synapses',
      colors: 'electric purple (#8B5CF6) and neon blue (#3B82F6)',
      mood: 'futuristic, intelligent, innovative'
    }
  }
  if (/바이브코딩|vibe|코딩/i.test(title)) {
    return {
      scene: 'Creative coding and digital art fusion',
      elements: 'colorful generative art patterns, code morphing into art',
      colors: 'rainbow gradient with purple, pink, and blue dominant',
      mood: 'creative, artistic, playful, vibrant'
    }
  }
  if (/스마트스토어|쇼핑몰|셀러/i.test(title)) {
    return {
      scene: 'E-commerce success and online business',
      elements: 'floating product boxes, shopping cart icons, sales growth charts',
      colors: 'fresh green (#10B981) and clean white',
      mood: 'professional, successful, growth-oriented'
    }
  }
  if (/마케팅|광고/i.test(title)) {
    return {
      scene: 'Digital marketing and advertising concept',
      elements: 'social media icons, megaphone, growth arrows',
      colors: 'vibrant orange (#F97316) and energetic red (#EF4444)',
      mood: 'dynamic, strategic, impactful'
    }
  }
  if (/프로그래밍|개발/i.test(category)) {
    return {
      scene: 'Modern software development',
      elements: 'code editor screens, terminal windows, git branches',
      colors: 'developer blue (#3B82F6) and terminal green (#10B981)',
      mood: 'technical, modern, professional'
    }
  }
  if (/비즈니스/i.test(category)) {
    return {
      scene: 'Business success and entrepreneurship',
      elements: 'business charts, growth metrics, professional workspace',
      colors: 'professional navy (#1E3A8A) and success gold (#F59E0B)',
      mood: 'professional, successful, ambitious'
    }
  }
  if (/디자인/i.test(category)) {
    return {
      scene: 'Creative design and visual arts',
      elements: 'color palettes, design tools, creative layouts',
      colors: 'creative violet (#7C3AED) and artistic pink (#EC4899)',
      mood: 'creative, artistic, inspiring'
    }
  }
  return {
    scene: 'Modern online education and digital learning',
    elements: 'floating books, digital screens, lightbulb ideas',
    colors: 'education indigo (#6366F1) and wisdom purple (#A855F7)',
    mood: 'educational, inspiring, modern'
  }
}

// POST: 강의 제목/설명을 기반으로 이미지 생성 (Gemini)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, category, profileImage, profileImageUrl } = body
    const profileImg = profileImage || profileImageUrl

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const imageStyle = getImageStyleForTopic(title, category || '')

    let imageBase64: string
    let profileBase64: string | undefined
    let profileMimeType: string | undefined

    // 프로필 이미지가 있으면 base64로 변환
    if (profileImg) {
      try {
        let profileBuffer: Buffer

        if (profileImg.startsWith('http')) {
          const response = await fetch(profileImg)
          const arrayBuffer = await response.arrayBuffer()
          profileBuffer = Buffer.from(arrayBuffer)
        } else {
          const localPath = path.join(process.cwd(), 'public', profileImg)
          profileBuffer = await fs.readFile(localPath)
        }

        profileBase64 = profileBuffer.toString('base64')
        profileMimeType = profileImg.includes('.png') ? 'image/png' : 'image/jpeg'
      } catch (e) {
        console.error('Failed to load profile image:', e)
      }
    }

    // 프로필 이미지가 있으면 Gemini에 함께 전달
    if (profileBase64) {
      const prompt = `Create a professional online course thumbnail with the instructor's photo.

IMPORTANT: Use the provided instructor photo and place it on the LEFT side of the image.
- The instructor should appear as a professional half-body shot
- Remove the background of the instructor photo and blend naturally
- The instructor should look confident and professional

Background design (on the RIGHT side):
- ${imageStyle.scene}
- ${imageStyle.elements}
- Colors: ${imageStyle.colors}
- Colorful code snippets, rainbow wave effects, geometric shapes

Title text "${title}" (Korean):
- Place on the RIGHT side of the image
- Large, bold white text with black outline/shadow
- Professional typography, easy to read

Style: Modern, professional educational thumbnail like popular online courses.
16:9 aspect ratio. High quality, vibrant colors.`

      console.log('Generating thumbnail with instructor photo for:', title)

      imageBase64 = await generateImage({
        prompt,
        aspectRatio: '16:9',
        referenceImage: profileBase64,
        referenceImageMimeType: profileMimeType,
      })
    } else {
      // 프로필 이미지가 없으면 배경만 생성
      const prompt = `Create a professional online course thumbnail.

Background design:
- ${imageStyle.scene}
- ${imageStyle.elements}
- Colors: ${imageStyle.colors}
- Colorful code snippets, geometric shapes, modern design

Title text "${title}" (Korean):
- Large, bold white text with black outline/shadow
- Centered or on the right side
- Professional typography

Style: Modern, professional educational thumbnail.
No people, no faces. 16:9 aspect ratio.`

      console.log('Generating thumbnail without instructor photo for:', title)

      imageBase64 = await generateImage({
        prompt,
        aspectRatio: '16:9',
      })
    }

    // Base64를 Buffer로 변환
    const buffer = base64ToBuffer(imageBase64)

    // 이미지 리사이즈
    const resizedBuffer = await sharp(buffer)
      .resize(1200, 675, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 90 })
      .toBuffer()

    // R2 Storage에 업로드
    const fileName = `image/courses/thumb-${Date.now()}.jpg`

    // R2에 저장
    const { success, url, error: uploadError } = await uploadToR2(resizedBuffer, fileName, 'image/jpeg')

    if (!success || uploadError) {
      console.error('R2 upload error:', uploadError)
      throw new Error('Failed to upload image to storage')
    }

    const imageUrl = url
    console.log('Image uploaded to R2:', imageUrl)

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'AI가 이미지를 생성했습니다.'
    })

  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate image'
    }, { status: 500 })
  }
}
