---
inclusion: fileMatch
fileMatchPattern: '*Chart*.tsx'
---

# Haunted Data Visualization Standards 📊👻

## Spooky Chart Guidelines
When creating or modifying chart components, follow these haunted standards:

### Chart Color Schemes
```tsx
// Halloween-themed chart colors
const HAUNTED_COLORS = {
  primary: '#8B5CF6',    // Purple
  secondary: '#F97316',  // Orange  
  danger: '#EF4444',     // Red
  success: '#10B981',    // Green (for savings)
  warning: '#F59E0B',    // Amber
  ghost: '#6B7280'       // Gray (for inactive)
};

// Cost trend colors
const COST_SPELL_COLORS = {
  increasing: '#EF4444',  // Red - costs rising like flames
  decreasing: '#10B981',  // Green - costs falling like autumn leaves
  stable: '#8B5CF6'       // Purple - steady as a ghost
};
```

### Chart Component Naming
- `MonthlyCostChart` → `MonthlyCostCauldron`
- `RegionalCostChart` → `RegionalHauntingMap`
- `CostForecastChart` → `CostCrystalBall`
- `ServiceBreakdown` → `ServiceCrypt`

### Animation Patterns
```tsx
// Smooth, supernatural animations
const chartVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 15,
      staggerChildren: 0.1
    }
  }
};
```

### Data Formatting
- Currency: Always show with spooky formatting `$1,234.56 💰`
- Percentages: Include trend indicators `+15% 📈` or `-8% 📉`
- Large numbers: Use haunted abbreviations `$1.2K`, `$3.4M`, `$5.6B`

### Accessibility for Charts
- Include `aria-label` with data summary
- Provide alternative text descriptions
- Ensure color-blind friendly palettes
- Support keyboard navigation for interactive elements

### Chart Tooltips
```tsx
// Themed tooltip content
const SpookyTooltip = ({ data }) => (
  <div className="bg-gray-900 border border-purple-500 rounded-lg p-3">
    <p className="text-orange-400">👻 Service: {data.service}</p>
    <p className="text-purple-300">💰 Cost: ${data.cost}</p>
    <p className="text-gray-300">📅 Period: {data.period}</p>
  </div>
);
```