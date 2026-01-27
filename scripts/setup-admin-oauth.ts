import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('\n=== 현재 Admin 사용자 확인 ===')
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' },
      include: {
        accounts: true,
      }
    })

    if (!admin) {
      console.log('Admin 사용자가 없습니다.')
      return
    }

    console.log('\nAdmin 사용자 정보:')
    console.log(`- ID: ${admin.id}`)
    console.log(`- Email: ${admin.email}`)
    console.log(`- Name: ${admin.name}`)
    console.log(`- Role: ${admin.role}`)
    console.log(`- Profile Completed: ${admin.profileCompleted}`)
    console.log(`- Created: ${admin.createdAt}`)

    console.log('\n연결된 OAuth 계정:')
    if (admin.accounts.length === 0) {
      console.log('연결된 OAuth 계정이 없습니다.')
      console.log('\n⚠️  이 사용자는 Google OAuth로 로그인할 수 없습니다.')
      console.log('\n해결 방법:')
      console.log('1. Google 계정으로 먼저 로그인하세요 (새 사용자가 생성됨)')
      console.log('2. 그 사용자의 이메일을 확인하세요')
      console.log('3. npx tsx scripts/make-user-admin.ts <email> 명령으로 admin 권한을 부여하세요')
    } else {
      console.log('연결된 계정 목록:')
      admin.accounts.forEach(account => {
        console.log(`- Provider: ${account.provider}`)
        console.log(`  Account ID: ${account.providerAccountId}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
