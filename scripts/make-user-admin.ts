import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error('\n사용법: npx tsx scripts/make-user-admin.ts <email>')
    console.error('예시: npx tsx scripts/make-user-admin.ts user@gmail.com\n')
    process.exit(1)
  }

  try {
    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
      }
    })

    if (!user) {
      console.error(`\n❌ 사용자를 찾을 수 없습니다: ${email}`)
      console.error('먼저 해당 Google 계정으로 로그인하세요.\n')
      process.exit(1)
    }

    console.log('\n=== 사용자 정보 ===')
    console.log(`이름: ${user.name}`)
    console.log(`이메일: ${user.email}`)
    console.log(`현재 역할: ${user.role}`)
    console.log(`OAuth 연결: ${user.accounts.length > 0 ? '✓' : '✗'}`)

    if (user.role === 'admin') {
      console.log('\n✓ 이미 관리자입니다.\n')
      return
    }

    // Admin 권한 부여
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'admin',
        profileCompleted: true,
        termsAgreed: true,
        privacyAgreed: true,
      }
    })

    console.log('\n✅ 관리자 권한이 부여되었습니다!')
    console.log(`역할: ${updatedUser.role}`)
    console.log('\n이제 /admin 페이지에 접근할 수 있습니다.\n')

  } catch (error) {
    console.error('\n오류 발생:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
