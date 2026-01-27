import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // profileCompleted가 false인 사용자들을 true로 업데이트
    const result = await prisma.user.updateMany({
      where: {
        profileCompleted: false,
      },
      data: {
        profileCompleted: true,
        termsAgreed: true,
        privacyAgreed: true,
      },
    })

    console.log(`${result.count}명의 사용자 프로필 상태를 업데이트했습니다.`)

    // 업데이트된 사용자 목록 확인
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        profileCompleted: true,
      },
    })

    console.log('\n전체 사용자 목록:')
    console.table(users)
  } catch (error) {
    console.error('업데이트 실패:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
