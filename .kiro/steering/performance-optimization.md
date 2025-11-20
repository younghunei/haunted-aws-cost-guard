---
inclusion: manual
---

# 🚀 Performance Optimization Spells

## Animation Performance
- Utilize framer-motion's `will-change` property
- Use `transform3d` for GPU acceleration
- Consider `useReducedMotion` for complex animations

## React Optimization
```typescript
// Memoization example
const SpookyComponent = React.memo(({ ghostData }) => {
  const memoizedGhosts = useMemo(() => 
    ghostData.filter(ghost => ghost.isVisible), [ghostData]
  );
  
  return <div>{/* rendering */}</div>;
});
```

## Bundle Optimization
- Code splitting with dynamic imports
- Image optimization (WebP, lazy loading)
- Remove unnecessary dependencies

## Caching Strategy
- AWS API response caching (15 minutes)
- Leverage browser cache
- Consider Service Worker

## Monitoring
- Track Core Web Vitals
- Monitor animation FPS
- Check memory usage