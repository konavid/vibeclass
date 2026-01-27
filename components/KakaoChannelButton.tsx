'use client'

interface KakaoChannelButtonProps {
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
  className?: string
}

export default function KakaoChannelButton({
  variant = 'primary',
  fullWidth = false,
  className = ''
}: KakaoChannelButtonProps) {

  const handleClick = () => {
    const url = 'http://pf.kakao.com/_iFVpn/chat'
    window.open(url, '_blank')
  }

  const baseClasses = fullWidth ? 'w-full' : ''

  return (
    <button
      onClick={handleClick}
      className={`group relative bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${baseClasses} ${className}`}
    >
      <div className="flex items-center justify-center gap-4 px-8 py-5">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.5 3 2 6.58 2 11c0 2.89 1.86 5.44 4.64 7.03-.18.64-.67 2.38-.77 2.75-.13.5.18.5.38.36.16-.11 2.48-1.67 3.44-2.32.75.14 1.54.21 2.31.21 5.5 0 10-3.58 10-8S17.5 3 12 3z"/>
        </svg>
        <div className="text-left">
          <div className="text-xl font-bold">카카오톡 채널 추가</div>
          <div className="text-sm opacity-90">실시간 상담을 시작하세요</div>
        </div>
        <svg className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
