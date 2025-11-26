---
inclusion: fileMatch
fileMatchPattern: 'backend/src/**/*.ts'
---

# Haunted Backend API Patterns 🦇⚡

## Spooky Server Guidelines
When working on backend services, maintain our haunted theme and best practices:

### API Response Structure
```typescript
// Themed API responses
interface HauntedResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    spookyCode: string; // e.g., 'SPIRIT_NOT_FOUND', 'MANSION_OVERLOADED'
    details?: any;
  };
  metadata?: {
    conjuredAt: string; // timestamp
    spellVersion: string; // API version
    hauntedBy: string; // service name
  };
}

// Example usage
const summonCostData = async (): Promise<HauntedResponse<CostData[]>> => {
  try {
    const hauntedCosts = await fetchFromAWS();
    return {
      success: true,
      data: hauntedCosts,
      metadata: {
        conjuredAt: new Date().toISOString(),
        spellVersion: '1.0.0',
        hauntedBy: 'cost-service'
      }
    };
  } catch (banishedError) {
    return {
      success: false,
      error: {
        message: 'The AWS spirits are not responding',
        spookyCode: 'AWS_SPIRITS_SILENT',
        details: banishedError.message
      }
    };
  }
};
```

### Error Codes Dictionary
```typescript
const SPOOKY_ERROR_CODES = {
  // AWS related
  'AWS_SPIRITS_SILENT': 'AWS API is not responding',
  'CREDENTIALS_CURSED': 'Invalid AWS credentials',
  'PERMISSION_SPELL_FAILED': 'Insufficient AWS permissions',
  
  // Data related
  'ANCIENT_SCROLLS_CORRUPTED': 'Data parsing error',
  'CRYSTAL_BALL_CLOUDY': 'Forecast calculation failed',
  'TREASURE_CHEST_EMPTY': 'No cost data found',
  
  // System related
  'MANSION_OVERLOADED': 'Server overloaded',
  'CRYPT_LOCKED': 'Database connection failed',
  'SPELL_INTERRUPTED': 'Request timeout'
};
```

### Service Naming Conventions
- `awsService.ts` → Functions: `summonCostData()`, `banishOldData()`
- `budgetService.ts` → Functions: `conjureBudget()`, `castBudgetSpell()`
- `exportService.ts` → Functions: `materializeReport()`, `enchantPDF()`

### Logging Patterns
```typescript
// Themed logging
const hauntedLogger = {
  conjure: (message: string, data?: any) => console.log(`👻 ${message}`, data),
  banish: (error: string, details?: any) => console.error(`⚡ ${error}`, details),
  whisper: (debug: string, data?: any) => console.debug(`🕷️ ${debug}`, data)
};

// Usage
hauntedLogger.conjure('Summoning AWS cost data for region', { region: 'us-east-1' });
hauntedLogger.banish('Failed to materialize cost report', error);
```

### Validation Schemas
Use Halloween-themed validation messages:
- Required fields: "This spell requires the {field} ingredient"
- Invalid format: "The {field} rune is malformed"
- Out of range: "The {field} power level exceeds mansion limits"