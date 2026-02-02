import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'
import { generateText, generateImage, base64ToBuffer } from '@/lib/gemini'
import { uploadToR2 } from '@/lib/r2'

// HTML에서 텍스트만 추출
function extractTextFromHtml(html: string): string {
  if (!html) return ''
  let text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 5000 ? text.substring(0, 5000) + '...' : text
}

// Gemini로 카드뉴스 프롬프트 생성
async function generateCardNewsPrompts(
  title: string,
  content: string,
  instructorName?: string,
  category?: string,
  stylePrompt?: string
): Promise<string[]> {
  const styleDesc = stylePrompt || 'Modern minimalist design with clean lines'

  const prompt = `온라인 강의 마케팅용 8장의 카드뉴스 이미지 프롬프트를 생성해주세요.

강의 정보:
- 제목: ${title}
- 카테고리: ${category || '교육'}
- 강사명: ${instructorName || '전문 강사'}
- 내용 요약: ${content.substring(0, 1000)}

각 카드 구성 (AIDA 프레임워크):
1장: 후킹 - 관심 끄는 질문
2장: 문제 제기 - 타겟의 고민
3장: 해결책 제시 - 강의 소개
4장: 커리큘럼 1 - 핵심 스킬
5장: 커리큘럼 2 - 실습 내용
6장: 성과/결과 - 수강 후 변화
7장: 강사 신뢰도 - 강사 경력
8장: CTA - 행동 유도

프롬프트 요구사항:
- 스타일: ${styleDesc}
- 포맷: 9:16 세로 비율
- 배경: 다크 그라데이션 (네이비~퍼플)
- 타이포그래피: 굵은 흰색 한국어 텍스트
- NO 버튼, NO UI 요소

JSON 배열로만 응답: ["프롬프트1", "프롬프트2", ...]`

  try {
    const response = await generateText({
      prompt,
      maxTokens: 3000,
      temperature: 0.7,
    })

    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const prompts = JSON.parse(jsonMatch[0])
      if (Array.isArray(prompts) && prompts.length >= 8) {
        return prompts.slice(0, 8)
      }
    }
    throw new Error('JSON 파싱 실패')
  } catch (error) {
    console.error('프롬프트 생성 실패, 폴백 사용:', error)
    return generateFallbackPrompts(title, instructorName, styleDesc)
  }
}

// 폴백 프롬프트 (한국어)
function generateFallbackPrompts(title: string, instructorName?: string, styleDesc?: string): string[] {
  const baseStyle = `스타일: ${styleDesc || '모던 미니멀 디자인'}
비율: 9:16 세로형
배경: 다크 그라데이션 (네이비에서 퍼플)
텍스트: 크고 굵은 흰색 한국어 텍스트
버튼이나 UI 요소 없이`

  return [
    `${baseStyle}\n메인 헤드라인: "${title}"\n서브 헤드라인: "지금 시작해야 하는 이유"\n1/8장 - 후킹`,
    `${baseStyle}\n메인 헤드라인: "이런 고민 있으시죠?"\n문제 시각화 아이콘들\n2/8장 - 문제 제기`,
    `${baseStyle}\n메인 헤드라인: "해결책을 찾았습니다!"\n솔루션 컨셉 이미지\n3/8장 - 해결책`,
    `${baseStyle}\n메인 헤드라인: "이런 것을 배웁니다"\n학습 관련 아이콘들\n4/8장 - 커리큘럼`,
    `${baseStyle}\n메인 헤드라인: "실전 프로젝트"\n프로젝트 아이콘들\n5/8장 - 실습`,
    `${baseStyle}\n메인 헤드라인: "수강 후 변화"\n성공 그래픽\n6/8장 - 성과`,
    `${baseStyle}\n메인 헤드라인: "전문 강사 소개"\n서브: "${instructorName || '현업 전문가'}"\n7/8장 - 강사`,
    `${baseStyle}\n메인 헤드라인: "지금 바로 시작하세요!"\nCTA 그래픽\n8/8장 - 행동 유도`
  ]
}

// POST: 프로모션 이미지 생성 (Gemini)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, type, title, content, category, stylePrompt, singleIndex, prompts, clearExisting, getPrompts } = body

    if (!courseId || !type || !title) {
      return NextResponse.json({ success: false, error: 'courseId, type, title are required' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      select: {
        descriptionImages: true,
        curriculumImages: true,
        instructor: {
          select: { name: true, user: { select: { name: true } } }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })
    }

    let currentImages = type === 'description'
      ? (course.descriptionImages as string[] || [])
      : (course.curriculumImages as string[] || [])

    // 기존 이미지 삭제
    if (clearExisting) {
      currentImages = []
      await prisma.course.update({
        where: { id: parseInt(courseId) },
        data: type === 'description' ? { descriptionImages: [] } : { curriculumImages: [] }
      })
    }

    const extractedContent = extractTextFromHtml(content || '')
    const instructorName = course.instructor?.name || course.instructor?.user?.name || ''

    // 프롬프트만 생성하는 모드
    if (getPrompts) {
      const imagePrompts = await generateCardNewsPrompts(title, extractedContent, instructorName, category, stylePrompt)
      return NextResponse.json({ success: true, prompts: imagePrompts })
    }

    // 1장만 생성하는 모드
    if (typeof singleIndex === 'number' && prompts) {
      const prompt = prompts[singleIndex]
      if (!prompt) {
        return NextResponse.json({ success: false, error: 'Invalid prompt index' }, { status: 400 })
      }

      const imageBase64 = await generateImage({ prompt, aspectRatio: '9:16' })
      const buffer = base64ToBuffer(imageBase64)

      const fileName = `image/courses/promo/promo-${courseId}-${type}-${singleIndex}-${Date.now()}.jpg`
      const { success, url } = await uploadToR2(buffer, fileName, 'image/jpeg')

      if (!success || !url) {
        throw new Error('Failed to upload image to R2')
      }

      const newImageUrl = url
      const updatedImages = [...currentImages, newImageUrl]

      await prisma.course.update({
        where: { id: parseInt(courseId) },
        data: type === 'description' ? { descriptionImages: updatedImages } : { curriculumImages: updatedImages }
      })

      return NextResponse.json({
        success: true,
        image: newImageUrl,
        images: updatedImages,
        index: singleIndex,
        message: `이미지 ${singleIndex + 1}번 생성 완료`
      })
    }

    // 전체 생성
    const imagePrompts = await generateCardNewsPrompts(title, extractedContent, instructorName, category, stylePrompt)
    const generatedImages: string[] = []

    for (let i = 0; i < imagePrompts.length; i++) {
      try {
        console.log(`Generating image ${i + 1}/${imagePrompts.length}`)
        const imageBase64 = await generateImage({ prompt: imagePrompts[i], aspectRatio: '9:16' })
        const buffer = base64ToBuffer(imageBase64)

        const fileName = `image/courses/promo/promo-${courseId}-${type}-${i}-${Date.now()}.jpg`
        const { success, url } = await uploadToR2(buffer, fileName, 'image/jpeg')

        if (success && url) {
          generatedImages.push(url)
        }
      } catch (error) {
        console.error(`Error generating image ${i + 1}:`, error)
      }
    }

    if (generatedImages.length === 0) {
      return NextResponse.json({ success: false, error: '이미지 생성에 실패했습니다.' }, { status: 500 })
    }

    await prisma.course.update({
      where: { id: parseInt(courseId) },
      data: type === 'description' ? { descriptionImages: generatedImages } : { curriculumImages: generatedImages }
    })

    return NextResponse.json({
      success: true,
      images: generatedImages,
      message: `AI가 ${generatedImages.length}장의 프로모션 이미지를 생성했습니다.`
    })

  } catch (error: any) {
    console.error('Promo image generation error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate promo images' }, { status: 500 })
  }
}

// DELETE: 이미지 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const type = searchParams.get('type')
    const imageIndex = searchParams.get('imageIndex')

    if (!courseId || !type || imageIndex === null) {
      return NextResponse.json({ success: false, error: 'courseId, type, imageIndex are required' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      select: { descriptionImages: true, curriculumImages: true }
    })

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })
    }

    const currentImages = type === 'description'
      ? (course.descriptionImages as string[] || [])
      : (course.curriculumImages as string[] || [])

    const index = parseInt(imageIndex)
    if (index < 0 || index >= currentImages.length) {
      return NextResponse.json({ success: false, error: 'Invalid image index' }, { status: 400 })
    }

    const updatedImages = currentImages.filter((_, i) => i !== index)

    await prisma.course.update({
      where: { id: parseInt(courseId) },
      data: type === 'description' ? { descriptionImages: updatedImages } : { curriculumImages: updatedImages }
    })

    return NextResponse.json({ success: true, images: updatedImages, message: '이미지가 삭제되었습니다.' })

  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete image' }, { status: 500 })
  }
}
