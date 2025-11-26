---
inclusion: always
---

# Halloween Theme Consistency Guidelines 🎃👻

## Theme Enforcement
When working on any UI components or styling, ensure consistency with our haunted theme:

### Color Palette
- Primary: `#8B5CF6` (purple)
- Secondary: `#F97316` (orange) 
- Accent: `#EF4444` (red)
- Background: `#0F0F23` (dark)
- Text: `#F8FAFC` (light)

### Halloween Vocabulary
Use these terms in variable names, comments, and user-facing text:
- `haunted`, `spooky`, `eerie`, `ghostly`
- `mansion`, `crypt`, `dungeon`, `chamber`
- `spirit`, `phantom`, `specter`, `wraith`
- `cauldron`, `potion`, `spell`, `curse`

### Animation Guidelines
- Use `framer-motion` for all animations
- Respect `prefers-reduced-motion`
- Animations should be smooth (60fps)
- Use easing functions that feel "supernatural"

### Component Naming
- Components: `HauntedMansion`, `SpookyChart`, `GhostlyPanel`
- Props: `hauntedData`, `spookyEffect`, `eerieAnimation`
- Functions: `summonCosts`, `banishErrors`, `conjureReport`

### Emojis to Use
👻 🎃 🦇 💀 🕷️ 🕸️ ⚡ 🔥 🌙 ⭐ 💰 📊 📈 📉

## Code Examples

```tsx
// Good: Halloween-themed naming
const HauntedCostChart = ({ spookyData }: SpookyChartProps) => {
  const [isConjuring, setIsConjuring] = useState(false);
  
  const summonCostData = async () => {
    setIsConjuring(true);
    // ... fetch logic
  };
};

// Bad: Generic naming
const CostChart = ({ data }: ChartProps) => {
  const [loading, setLoading] = useState(false);
};
```