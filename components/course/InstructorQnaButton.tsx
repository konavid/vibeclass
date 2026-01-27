'use client'

interface InstructorQnaButtonProps {
  instructorName: string
}

export default function InstructorQnaButton({ instructorName }: InstructorQnaButtonProps) {
  const handleClick = () => {
    const qnaSection = document.getElementById('qna-section')
    if (qnaSection) {
      qnaSection.scrollIntoView({ behavior: 'smooth' })
      // Q&A 탭 버튼 클릭
      setTimeout(() => {
        const qnaTab = document.querySelector('[data-tab="qna"]') as HTMLButtonElement
        if (qnaTab) qnaTab.click()
      }, 300)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="mt-4 flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {instructorName} 강사님에게 문의하기
    </button>
  )
}
