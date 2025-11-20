---
inclusion: fileMatch
fileMatchPattern: '**/aws*.ts'
---

# AWS 통합 가이드라인

## AWS SDK 사용 규칙
- 모든 AWS 클라이언트는 적절한 리전 설정 필요
- Cost Explorer는 반드시 us-east-1 리전 사용
- 에러 핸들링에서 AWS 특정 에러 타입 처리

## 보안 가이드라인
- AWS 자격 증명은 절대 하드코딩 금지
- 환경 변수나 안전한 방법으로만 전달
- IAM 권한은 최소 권한 원칙 적용

## 비용 최적화
- API 호출 최소화를 위한 캐싱 전략
- 불필요한 리전 데이터 필터링
- 글로벌 서비스 구분 처리

## 참조 파일
#[[file:backend/src/types/index.ts]]

## 에러 처리 예시
```typescript
try {
  const result = await costExplorerClient.send(command);
} catch (error: any) {
  if (error.name === 'AccessDeniedException') {
    // 권한 관련 에러 처리
  } else if (error.name === 'ThrottlingException') {
    // 스로틀링 에러 처리
  }
}
```