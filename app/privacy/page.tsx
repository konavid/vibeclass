import CustomerLayout from '@/components/customer/CustomerLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보 처리방침 | 바이브 클래스',
  description: '바이브 클래스의 개인정보 처리방침. 이용자의 개인정보 보호를 위한 수집, 이용, 보관 및 파기 절차를 안내합니다.',
  openGraph: {
    title: '개인정보 처리방침 | 바이브 클래스',
    description: '바이브 클래스의 개인정보 처리방침',
    type: 'website',
    locale: 'ko_KR',
    url: 'https://vibeclass.kr/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <CustomerLayout>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            개인정보 처리방침
          </h1>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 mb-8">
                바이브 클래스(이하 "회사")는 이용자의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호 등에 관한 법률", "개인정보보호법" 등 관련 법령을 준수하고 있습니다.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. 개인정보의 수집 항목 및 수집 방법</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">가. 수집 항목</h3>
              <p className="text-gray-700 mb-2">회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li><strong>필수항목:</strong> 이메일, 이름, 별명, 연락처</li>
                <li><strong>선택항목:</strong> 프로필 이미지</li>
                <li><strong>자동수집항목:</strong> IP 주소, 쿠키, 서비스 이용 기록, 접속 로그</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">나. 수집 방법</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>홈페이지 회원가입 및 서비스 이용 과정에서 이용자가 개인정보 수집에 대해 동의를 하고 직접 정보를 입력하는 경우</li>
                <li>Google 소셜 로그인을 통한 정보 수집</li>
                <li>고객센터를 통한 상담 과정에서 웹페이지, 메일, 전화 등을 통해 수집</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">2. 개인정보의 수집 및 이용 목적</h2>
              <p className="text-gray-700 mb-2">회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다:</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">가. 회원 관리</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>회원제 서비스 이용에 따른 본인확인, 개인 식별</li>
                <li>불량회원의 부정 이용 방지와 비인가 사용 방지</li>
                <li>가입 의사 확인, 연령확인, 불만처리 등 민원처리</li>
                <li>고지사항 전달</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">나. 서비스 제공</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>교육 서비스 제공, 수강 관리</li>
                <li>강의 및 학습 자료 제공</li>
                <li>온라인 수업 진행 (Zoom 등)</li>
                <li>결제 및 환불 처리</li>
                <li>청구서 발송, 요금 결제</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">다. 마케팅 및 광고 활용</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>신규 서비스 개발 및 맞춤 서비스 제공</li>
                <li>이벤트 및 광고성 정보 제공 및 참여기회 제공 (동의를 받은 경우에 한함)</li>
                <li>서비스의 유효성 확인, 접속빈도 파악</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">3. 개인정보의 보유 및 이용기간</h2>
              <p className="text-gray-700 mb-4">
                회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">가. 회사 내부 방침에 의한 정보보유</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>부정이용기록: 1년 (부정이용 방지)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">나. 관련법령에 의한 정보보유</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                <li>웹사이트 방문기록: 3개월 (통신비밀보호법)</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">4. 개인정보의 파기 절차 및 방법</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">가. 파기절차</h3>
              <p className="text-gray-700 mb-4">
                이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">나. 파기방법</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>전자적 파일 형태의 정보: 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
                <li>종이에 출력된 개인정보: 분쇄기로 분쇄하거나 소각</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">5. 개인정보 제공</h2>
              <p className="text-gray-700 mb-6">
                회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>이용자들이 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">6. 수집한 개인정보의 위탁</h2>
              <p className="text-gray-700 mb-4">
                회사는 서비스 향상을 위해서 아래와 같이 개인정보를 위탁하고 있으며, 관계 법령에 따라 위탁계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>결제 처리: 결제 대행 업체 (결제 처리 및 관리)</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">7. 이용자 및 법정대리인의 권리와 그 행사방법</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있습니다.</li>
                <li>이용자는 언제든지 개인정보 수집·이용·제공 등에 대한 동의를 철회할 수 있습니다.</li>
                <li>이용자는 언제든지 회원 탈퇴를 요청할 수 있습니다.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">8. 개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항</h2>
              <p className="text-gray-700 mb-4">
                회사는 이용자의 정보를 수시로 저장하고 찾아내는 '쿠키(cookie)'를 사용합니다. 쿠키는 웹사이트가 귀하의 브라우저에 전송하는 소량의 정보입니다.
              </p>
              <p className="text-gray-700 mb-6">
                이용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 웹브라우저 옵션 설정을 통해 쿠키 허용 여부를 선택할 수 있습니다.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">9. 개인정보의 기술적/관리적 보호 대책</h2>
              <p className="text-gray-700 mb-4">
                회사는 이용자의 개인정보를 처리함에 있어 개인정보가 분실, 도난, 유출, 변조 또는 훼손되지 않도록 안전성 확보를 위하여 다음과 같은 기술적/관리적 대책을 강구하고 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
                <li>비밀번호 암호화: 이용자의 비밀번호는 암호화되어 저장 및 관리되고 있습니다.</li>
                <li>해킹 등에 대비한 대책: 해킹이나 컴퓨터 바이러스 등에 의해 회원의 개인정보가 유출되거나 훼손되는 것을 막기 위해 최선을 다하고 있습니다.</li>
                <li>개인정보처리시스템 접근 제한: 개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여, 변경, 말소를 통하여 개인정보에 대한 접근통제를 위해 필요한 조치를 하고 있습니다.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">10. 개인정보 보호책임자</h2>
              <p className="text-gray-700 mb-4">
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-gray-900 font-semibold mb-2">개인정보 보호책임자</p>
                <ul className="text-gray-700 space-y-1">
                  <li>이메일: hi@vibeclass.kr</li>
                  <li>전화번호: 010-2590-2434</li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">11. 개인정보 처리방침 변경</h2>
              <p className="text-gray-700 mb-6">
                이 개인정보 처리방침은 2025년 1월 1일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  공고일자: 2025년 1월 1일
                  <br />
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
