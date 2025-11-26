---
inclusion: manual
---

# Haunted Deployment Checklist 🚀👻

## Pre-Deployment Spells
Before releasing our haunted mansion to the world:

### Frontend Checklist 🎃
- [ ] All components use Halloween theme consistently
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Accessibility tests pass (WCAG 2.1 AA)
- [ ] Performance metrics are within limits:
  - [ ] First Contentful Paint < 2s
  - [ ] Largest Contentful Paint < 4s
  - [ ] Cumulative Layout Shift < 0.1
- [ ] Bundle size is optimized
- [ ] All images are optimized and have alt text
- [ ] Error boundaries handle crashes gracefully
- [ ] Offline functionality works properly

### Backend Checklist 🦇
- [ ] All API endpoints return proper error responses
- [ ] AWS credentials are properly configured
- [ ] Rate limiting is implemented
- [ ] Security headers are set
- [ ] CORS is configured correctly
- [ ] Database connections are pooled
- [ ] Logging is comprehensive but not verbose
- [ ] Health check endpoint responds correctly

### Security Checklist 🔒
- [ ] No hardcoded secrets in code
- [ ] Environment variables are properly set
- [ ] HTTPS is enforced
- [ ] Input validation is comprehensive
- [ ] SQL injection protection is in place
- [ ] XSS protection is enabled
- [ ] CSRF tokens are implemented

### Testing Checklist 🧪
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Load tests show acceptable performance
- [ ] Visual regression tests pass
- [ ] Accessibility tests pass

### Monitoring Checklist 📊
- [ ] Error tracking is configured
- [ ] Performance monitoring is active
- [ ] Uptime monitoring is set up
- [ ] Log aggregation is working
- [ ] Alerts are configured for critical issues

## Deployment Commands
```bash
# Frontend deployment
npm run build
npm run test:e2e
npm run deploy:prod

# Backend deployment  
npm run build
npm run test
npm run deploy:backend
```

## Post-Deployment Verification
- [ ] Health checks pass
- [ ] Critical user flows work
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] Monitoring shows green status

Remember: A well-deployed haunted mansion brings joy, not terror! 🎃✨