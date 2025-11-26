---
inclusion: always
---

# Haunted Error Handling Patterns 👻⚡

## Spooky Error Management
All errors should be handled with our haunted theme while maintaining user experience:

### Error Message Vocabulary
- Use Halloween-themed error messages that are still clear
- Examples:
  - "The spirits are restless... (Network connection failed)"
  - "Our crystal ball is cloudy... (Data loading error)"
  - "The haunted mansion is under maintenance... (Service unavailable)"
  - "This spell requires more power... (Insufficient permissions)"

### Error Handling Patterns

```tsx
// Good: Themed error handling
const summonAwsCosts = async () => {
  try {
    setIsConjuring(true);
    const hauntedData = await fetchCostData();
    return hauntedData;
  } catch (banishedError) {
    const spookyMessage = conjureErrorMessage(banishedError);
    showGhostlyNotification(spookyMessage, 'error');
    logToHauntedCrypt(banishedError);
  } finally {
    setIsConjuring(false);
  }
};

// Error boundary naming
class MansionErrorBoundary extends ErrorBoundary {
  // Handle component crashes gracefully
}
```

### Error Recovery Strategies
1. **Graceful Degradation**: Show demo data when AWS fails
2. **Retry Logic**: "Attempting to reconnect with the spirit realm..."
3. **Offline Support**: "Working in ghost mode (offline)"
4. **User Feedback**: Always explain what went wrong in spooky terms

### Error Types to Handle
- AWS API failures → "The AWS spirits are not responding"
- Network issues → "Lost connection to the ethereal plane"
- Permission errors → "This chamber is protected by ancient spells"
- Data parsing errors → "The ancient scrolls are corrupted"

## Error Component Guidelines
- Use `ErrorBoundary` for component crashes
- Use `ErrorNotification` for user actions
- Use `OfflineIndicator` for network status
- Always provide recovery actions when possible