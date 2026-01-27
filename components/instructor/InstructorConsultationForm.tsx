'use client'

import KakaoChannelButton from '@/components/KakaoChannelButton'

interface InstructorConsultationFormProps {
  instructorId: number
}

export default function InstructorConsultationForm({
  instructorId,
}: InstructorConsultationFormProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-4">
          <svg className="w-10 h-10 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.5 3 2 6.58 2 11c0 2.89 1.86 5.44 4.64 7.03-.18.64-.67 2.38-.77 2.75-.13.5.18.5.38.36.16-.11 2.48-1.67 3.44-2.32.75.14 1.54.21 2.31.21 5.5 0 10-3.58 10-8S17.5 3 12 3z"/>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          카카오톡으로 상담하기
        </h3>
        <p className="text-gray-600 text-sm">
          강사에게 궁금한 점을 카카오톡으로 편리하게 문의하세요
        </p>
      </div>

      <KakaoChannelButton
        variant="primary"
        fullWidth
        className="py-4"
      />

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          평일 09:00 - 18:00 상담 가능
        </p>
      </div>
    </div>
  )
}
