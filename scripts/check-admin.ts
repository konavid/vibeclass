import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // admin 사용자 찾기
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })

    console.log('\n=== Admin Users ===')
    if (admins.length === 0) {
      console.log('No admin users found.')
      console.log('\nCreating an admin user for testing...')

      // 테스트용 admin 사용자 생성
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@teotou.com',
          name: 'Admin',
          role: 'admin',
          profileCompleted: true,
          termsAgreed: true,
          privacyAgreed: true,
        }
      })

      console.log('\nCreated admin user:')
      console.log(newAdmin)
    } else {
      console.log(`Found ${admins.length} admin user(s):`)
      admins.forEach(admin => {
        console.log(`- ${admin.name} (${admin.email}) - Created: ${admin.createdAt}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
