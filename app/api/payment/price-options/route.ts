import { NextResponse } from 'next/server'
import { getPriceOptions } from '@/lib/payment-utils'

export async function GET() {
  try {
    const options = getPriceOptions()

    return NextResponse.json({
      success: true,
      options: options,
      currency: 'KRW',
      mode: process.env.OPEN_SPECIAL_MODE === 'true' ? 'special' : 'normal'
    })

  } catch (error: any) {
    console.error('Price options error:', error)
    return NextResponse.json(
      { success: false, error: '가격 옵션 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
