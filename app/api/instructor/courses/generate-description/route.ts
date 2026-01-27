import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateText } from '@/lib/gemini'

// 타임아웃 설정 (5분)
export const maxDuration = 300

// POST: 강의 제목과 지시사항을 기반으로 목차 스타일 설명 생성 (Gemini)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, category, instructions } = body

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    console.log('Generating description with Gemini for:', title)

    const systemInstruction = `당신은 교육 콘텐츠 전문가입니다. 목차 형식(아웃라인 스타일)으로 간결하게 작성하세요.
- 각 항목은 짧은 구절 (5-10단어 이하)
- 긴 설명 없이 핵심 포인트만
- 총 200-300 한국어 단어 이내`

    const prompt = `강의 설명을 목차 형식으로 작성해주세요.

강의 정보:
- 제목: ${title}
- 카테고리: ${category || 'General'}
${instructions ? `- 지시사항: ${instructions}` : ''}

다음 구조로 작성:

1. 강의 개요
- 핵심 내용 1
- 핵심 내용 2
- 핵심 내용 3

2. 추천 대상
- 대상자 유형 1
- 대상자 유형 2
- 대상자 유형 3
- 대상자 유형 4
- 대상자 유형 5

3. 학습 목표
- 목표 1
- 목표 2
- 목표 3
- 목표 4
- 목표 5
- 목표 6

4. 강의 특징
- 특징 1
- 특징 2
- 특징 3
- 특징 4
- 특징 5

5. 수강 후 기대효과
- 기대효과 1
- 기대효과 2
- 기대효과 3

규칙:
- 목차 형식으로 작성
- 각 항목은 짧은 구절만 (5-10단어)
- 긴 설명 없이 핵심 포인트만
- 최대 300 한국어 단어`

    const textContent = await generateText({
      prompt,
      systemInstruction,
      maxTokens: 1500,
      temperature: 0.7,
    })

    if (!textContent) {
      throw new Error('No content received from Gemini')
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

    console.log('Description generated successfully (length:', htmlContent.length, ')')

    return NextResponse.json({
      success: true,
      description: htmlContent,
      message: 'AI가 간결한 강의 설명을 생성했습니다. 자유롭게 수정하세요.'
    })

  } catch (error: any) {
    console.error('Description generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate description'
    }, { status: 500 })
  }
}
