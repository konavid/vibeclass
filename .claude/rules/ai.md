# AI 기능

Gemini API 사용 (`lib/gemini.ts`)

## 기능

- 강의 커리큘럼 자동 생성
- 강의 설명 자동 생성
- 프로모션 이미지 생성 
- 썸네일 이미지 생성

## 사용법

```typescript
import { generateText, generateImage } from '@/lib/gemini'

// 텍스트 생성
const text = await generateText({ prompt: '...' })

// 이미지 생성
const imageBase64 = await generateImage({
  prompt: '...',
  aspectRatio: '16:9'
})
```
