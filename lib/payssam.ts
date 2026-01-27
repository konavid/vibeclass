// PaySsam API 클라이언트
// API 문서: https://guide.payssam.kr/ko/articles/API-소개--4ef317dc

interface PaySsamConfig {
  apiKey: string
  apiSecret: string
  baseUrl: string
}

interface CreateBillParams {
  amount: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  productName: string
  description?: string
  callbackUrl?: string
}

interface BillResponse {
  billId: string
  billUrl: string
  amount: number
  status: string
  createdAt: string
}

class PaySsamClient {
  private config: PaySsamConfig

  constructor(config: PaySsamConfig) {
    this.config = config
  }

  private async request(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-API-Secret': this.config.apiSecret,
    }

    const options: RequestInit = {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) }),
    }

    try {
      const response = await fetch(url, options)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'PaySsam API 요청 실패')
      }

      return data
    } catch (error) {
      console.error('PaySsam API 에러:', error)
      throw error
    }
  }

  // 청구서 생성
  async createBill(params: CreateBillParams): Promise<BillResponse> {
    return await this.request('/api/v1/bills', 'POST', params)
  }

  // 청구서 조회
  async getBill(billId: string): Promise<BillResponse> {
    return await this.request(`/api/v1/bills/${billId}`, 'GET')
  }

  // 청구서 취소
  async cancelBill(billId: string): Promise<any> {
    return await this.request(`/api/v1/bills/${billId}/cancel`, 'POST')
  }

  // 현금영수증 발급
  async issueCashReceipt(
    billId: string,
    params: {
      type: 'personal' | 'business'
      identifier: string // 휴대폰번호 또는 사업자번호
    }
  ): Promise<any> {
    return await this.request(
      `/api/v1/bills/${billId}/cash-receipt`,
      'POST',
      params
    )
  }
}

// PaySsam 클라이언트 싱글톤
let paySsamClient: PaySsamClient | null = null

export function getPaySsamClient(): PaySsamClient {
  if (!paySsamClient) {
    const config: PaySsamConfig = {
      apiKey: process.env.PAYSSAM_API_KEY || '',
      apiSecret: process.env.PAYSSAM_API_SECRET || '',
      baseUrl: process.env.PAYSSAM_BASE_URL || 'https://api.payssam.kr',
    }

    if (!config.apiKey || !config.apiSecret) {
      throw new Error('PaySsam API 설정이 없습니다')
    }

    paySsamClient = new PaySsamClient(config)
  }

  return paySsamClient
}

export type { CreateBillParams, BillResponse }
