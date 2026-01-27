import CustomerLayout from '@/components/customer/CustomerLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관 | 바이브 클래스',
  description: '바이브 클래스 서비스 이용약관. 회원가입, 서비스 제공, 환불 정책 등 서비스 이용에 관한 전반적인 내용을 안내합니다.',
  openGraph: {
    title: '이용약관 | 바이브 클래스',
    description: '바이브 클래스 서비스 이용약관',
    type: 'website',
    locale: 'ko_KR',
    url: 'https://vibeclass.kr/terms',
  },
}

export default function TermsPage() {
  return (
    <CustomerLayout>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            이용약관
          </h1>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="prose prose-gray max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제1조 (목적)</h2>
              <p className="text-gray-700 mb-6">
                본 약관은 바이브 클래스(이하 "회사")가 제공하는 온라인 교육 플랫폼 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">제2조 (정의)</h2>
              <p className="text-gray-700 mb-2">본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>"서비스"란 회사가 제공하는 온라인 교육 플랫폼 및 관련 부가 서비스를 의미합니다.</li>
                <li>"이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                <li>"회원"이란 회사와 서비스 이용계약을 체결하고 아이디를 부여받은 자를 말합니다.</li>
                <li>"강의"란 회사가 제공하는 교육 콘텐츠를 의미합니다.</li>
              </ol>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">제3조 (약관의 명시 및 개정)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</li>
                <li>회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
                <li>회사가 약관을 개정할 경우 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 공지합니다.</li>
              </ol>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">제4조 (회원가입)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</li>
                <li>회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                    <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                    <li>허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
                  </ul>
                </li>
              </ol>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">제5조 (서비스의 제공 및 변경)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>회사는 다음과 같은 서비스를 제공합니다:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>온라인 교육 강의 제공</li>
                    <li>학습 관리 및 수강 이력 관리</li>
                    <li>교육 상담 서비스</li>
                    <li>기타 회사가 추가 개발하거나 제휴 계약 등을 통해 제공하는 서비스</li>
                  </ul>
                </li>
                <li>회사는 서비스의 내용을 변경할 경우 그 변경사항을 서비스 화면에 공지합니다.</li>
              </ol>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">제6조 (서비스의 중단)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
                <li>제1항에 의한 서비스 중단의 경우 회사는 사전 또는 사후에 이를 공지합니다.</li>
              </ol>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">제7조 (회원탈퇴 및 자격 상실)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>회원은 언제든지 회사에 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.</li>
                <li>회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>가입 신청 시 허위 내용을 등록한 경우</li>
                    <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                    <li>서비스를 이용하여 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                  </ul>
                </li>
              </ol>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">제8조 (회원에 대한 통지)</h2>
              <p className="text-gray-700 mb-6">
                회사가 회원에 대한 통지를 하는 경우 본 약관에 별도 규정이 없는 한 회원이 제공한 전자우편 주소 또는 휴대전화 번호로 할 수 있습니다.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">제9조 (환불 정책)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>수강 시작 전: 전액 환불</li>
                <li>수강 시작 후 1/3 경과 전: 2/3 해당액 환불</li>
                <li>수강 시작 후 1/2 경과 전: 1/2 해당액 환불</li>
                <li>수강 시작 후 1/2 경과 후: 환불 불가</li>
              </ol>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">제10조 (면책조항)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                <li>회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
                <li>회사는 회원이 서비스를 이용하여 기대하는 학습 효과나 성과를 얻지 못한 것에 대하여 책임을 지지 않습니다.</li>
              </ol>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">제11조 (분쟁해결)</h2>
              <p className="text-gray-700 mb-6">
                본 약관에 명시되지 않은 사항은 전자상거래 등에서의 소비자보호에 관한 법률, 약관의 규제에 관한 법률, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 관련 법령의 규정에 따릅니다.
              </p>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  시행일자: 2025년 1월 1일
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
