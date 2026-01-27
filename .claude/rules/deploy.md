# 배포

## 빠른 배포 명령어

```bash
# 코드만 변경된 경우
ssh vibeclass "cd ~/vibe-class && git pull && npm run build && pm2 restart vibe-class"

# 의존성 변경 시
ssh vibeclass "cd ~/vibe-class && git pull && npm install && npm run build && pm2 restart vibe-class"

# Prisma 스키마 변경 시
ssh vibeclass "cd ~/vibe-class && git pull && npm install && npx prisma generate && npm run build && pm2 restart vibe-class"
```

## 서버 접속
```bash
ssh vibeclass
```

## 로그 확인
```bash
ssh vibeclass "pm2 logs vibe-class"
```
