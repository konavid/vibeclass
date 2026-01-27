import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'admin@edu.com'
  const password = process.argv[3] || 'admin123'

  try {
    console.log('\n=== 어드민 비밀번호 설정 ===\n')

    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('사용자가 없습니다. 새로 생성합니다')
      user = await prisma.user.create({
        data: {
          email,
          name: '관리자',
          role: 'admin',
          profileCompleted: true,
          termsAgreed: true,
          privacyAgreed: true,
        }
      })
    }

    console.log('사용자:', user.name, '-', user.email)

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: 'admin',
        profileCompleted: true,
      }
    })

    console.log('\n✅ 비밀번호 설정 완료!')
    console.log('이메일:', email)
    console.log('비밀번호:', password)
    console.log('')

  } catch (error) {
    console.error('오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
