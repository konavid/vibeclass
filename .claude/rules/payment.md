# 결제선생 (PaySsam) 설정

https://payssam.kr - 계좌이체, 카드결제 지원

## 환경변수

```env
PAYMENT_TEACHER_API_KEY="API_KEY"
PAYMENT_TEACHER_MEMBER="회원_ID"
PAYMENT_TEACHER_MERCHANT="가맹점_ID"
PAYMENT_TEACHER_API_URL="https://erp-api.payssam.kr/if/bill/send"
PAYMENT_TEACHER_CHECK_URL="https://erp-api.payssam.kr/if/bill/check"
PAYMENT_CALLBACK_URL="https://vibeclass.kr/api/payment/callback"
```

## 결제 흐름

1. 수강신청 → /api/payment/request
2. 결제선생 API → 결제 링크 생성
3. 사용자 결제 완료
4. 결제선생 → /api/payment/callback
5. 수강 등록 완료

## 관련 파일

| 파일 | 설명 |
|------|------|
| `lib/payssam.ts` | API 클라이언트 |
| `lib/payment-utils.ts` | 유틸리티 |
| `app/api/payment/request/route.ts` | 결제 요청 |
| `app/api/payment/callback/route.ts` | 콜백 |
