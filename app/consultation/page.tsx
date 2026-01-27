'use client'

import CustomerLayout from '@/components/customer/CustomerLayout'
import KakaoChannelButton from '@/components/KakaoChannelButton'
import { useEffect } from 'react'
import Card from '@/components/ui/Card'
import Section from '@/components/ui/Section'

export default function ConsultationPage() {
  useEffect(() => {
    // 클라이언트 사이드에서 메타태그 동적 추가
    document.title = '상담 신청 | 바이브 클래스'

    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', '카카오톡 채널을 통해 편리하게 AI 교육 상담을 받으세요. 무료 상담 신청 가능합니다.')
    }
  }, [])
  return (
    <CustomerLayout>
      <Section background="white" padding="md" className="border-b border-gray-200">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          상담 신청
        </h1>
      </Section>

      <div className="bg-gray-50">
        <Section background="none" padding="md" className="max-w-3xl mx-auto">
          <Card padding="lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-full mb-6">
                <svg className="w-12 h-12 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.5 3 2 6.58 2 11c0 2.89 1.86 5.44 4.64 7.03-.18.64-.67 2.38-.77 2.75-.13.5.18.5.38.36.16-.11 2.48-1.67 3.44-2.32.75.14 1.54.21 2.31.21 5.5 0 10-3.58 10-8S17.5 3 12 3z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                카카오톡 상담
              </h2>
              <p className="text-gray-600 mb-8">
                교육 과정, 일정, 가격 등 궁금하신 점을<br/>
                카카오톡으로 편리하게 문의하세요
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <KakaoChannelButton
                variant="primary"
                fullWidth
                className="p-6 text-lg"
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">상담 안내</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>평일 09:00 - 18:00 상담 가능</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>교육 과정, 수강 신청, 결제 문의 가능</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>빠른 답변과 친절한 상담 제공</span>
                </li>
              </ul>
            </div>
          </Card>
        </Section>
      </div>
    </CustomerLayout>
  )
}
