import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany({
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('\n=== 전체 사용자 목록 ===\n')
    console.log(`총 ${users.length}명의 사용자가 있습니다.\n`)

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`)
      console.log(`   - 역할: ${user.role}`)
      console.log(`   - 프로필 완성: ${user.profileCompleted ? '✓' : '✗'}`)
      console.log(`   - 생성일: ${user.createdAt.toLocaleDateString('ko-KR')}`)

      if (user.accounts.length > 0) {
        console.log(`   - OAuth 연결: ${user.accounts.map(a => a.provider).join(', ')}`)
      } else {
        console.log(`   - OAuth 연결: 없음`)
      }
      console.log('')
    })

    const admins = users.filter(u => u.role === 'admin')
    const withOAuth = users.filter(u => u.accounts.length > 0)

    console.log('=== 요약 ===')
    console.log(`관리자: ${admins.length}명`)
    console.log(`OAuth 연결된 사용자: ${withOAuth.length}명`)
    console.log('')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
