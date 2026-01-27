import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        phone: true,
        profileCompleted: true,
        termsAgreed: true,
        privacyAgreed: true,
        marketingConsent: true,
        createdAt: true,
      },
    })

    console.log('최근 사용자 5명:')
    console.table(users)
  } catch (error) {
    console.error('조회 실패:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
