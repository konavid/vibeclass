import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateText } from '@/lib/gemini'

// 타임아웃 설정 (5분)
export const maxDuration = 300

// POST: 강의 제목과 지시사항을 기반으로 구조화된 커리큘럼 생성 (Gemini)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, category, description, instructions } = body

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    console.log('Generating curriculum with Gemini for:', title)

    const systemInstruction = `당신은 전문 커리큘럼 디자이너입니다. 짧고 간결한 한국어 문장으로 커리큘럼을 작성하세요.
- 각 문장은 10-15단어 이하
- 단답형 스타일: "~합니다", "~배웁니다", "~익힙니다"
- 괄호 안 가이드 텍스트 없이 깔끔하게 작성`

    const prompt = `강의 커리큘럼을 작성해주세요.

강의 정보:
- 제목: ${title}
- 카테고리: ${category || 'General'}
${description ? `- 설명: ${description.replace(/<[^>]*>/g, '').substring(0, 300)}` : ''}
${instructions ? `- 지시사항: ${instructions}

중요: 지시사항에 주차, 회차, 시간이 명시되어 있으면 그대로 따르세요.` : ''}

다음 구조로 작성:

총 커리큘럼 개요
강의 전체 구조를 설명합니다.
학습 방향성을 제시합니다.

1주차: [주제]
학습 내용을 설명합니다.
핵심 개념을 배웁니다.
실무 적용을 익힙니다.

(10-12주차까지 작성)

=== 전체 과정 핵심 학습 포인트 ===

1. [핵심 역량 1]
   무엇을 배우는지 설명합니다.

2. [핵심 역량 2]
   핵심 내용을 다룹니다.

(6개 작성)

=== 수강 후 로드맵 ===
실무에 바로 적용할 수 있습니다.
추가 학습 방향을 제시합니다.

요구사항:
- 총 2000-2500 한국어 단어
- 10-12주 분량 (지시사항에 없으면)
- 짧고 간결한 문장`

    const textContent = await generateText({
      prompt,
      systemInstruction,
      maxTokens: 8000,
      temperature: 0.7,
    })

    if (!textContent) {
      throw new Error('No curriculum received from Gemini')
    }

    // 텍스트 정리
    const cleanedContent = textContent
      .replace(/^```[a-z]*\n/gim, '')
      .replace(/\n```$/gm, '')
      .replace(/```/g, '')
      .trim()

    // HTML 포맷팅
    const htmlContent = cleanedContent
      .split('\n\n')
      .map(paragraph => {
        const formatted = paragraph
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('<br>')
        return `<p>${formatted}</p>`
      })
      .join('\n')

    console.log('Curriculum generated successfully (length:', htmlContent.length, ')')

    return NextResponse.json({
      success: true,
      curriculum: htmlContent,
      message: 'AI가 상세한 커리큘럼을 생성했습니다. 자유롭게 수정하세요.'
    })

  } catch (error: any) {
    console.error('Curriculum generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate curriculum'
    }, { status: 500 })
  }
}
