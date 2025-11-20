---
inclusion: fileMatch
fileMatchPattern: "**/*.test.{ts,tsx}"
---

# 👻 Haunted Testing Guidelines 🎃

## Testing Principles

- All components must include accessibility tests
- Test Halloween theme elements and animations
- Error states and loading states testing is mandatory

## Test Naming Conventions

- Use Halloween terminology in test descriptions
- Example: "should summon ghosts when budget exceeds limit"
- Example: "should cast spells on service rooms correctly"

## React Component Testing

```typescript
// Accessibility test example
expect(
  screen.getByRole("button", { name: /haunted mansion/i })
).toBeInTheDocument();

// Animation test
expect(ghostElement).toHaveStyle("opacity: 0.2");
```

## API Testing

- AWS service mocking is mandatory
- Include error scenario testing
- Verify caching behavior

## Performance Testing

- Animation performance monitoring
- Memory leak detection
- Bundle size checks
