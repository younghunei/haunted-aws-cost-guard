# Haunted AWS Cost Guard - Project Guidelines

## Project Overview
This project is a web application that provides AWS cost monitoring through an interactive Halloween-themed UI.

## Coding Style Guidelines

### React Components
- Use functional components with TypeScript
- Component names should use PascalCase
- Props interfaces should follow ComponentName + Props pattern
- Use Halloween-themed variable names and comments (e.g., `hauntedMansion`, `spookyEffect`)

### Styling
- Use Tailwind CSS
- Halloween color palette: purple, orange, black, red
- Use framer-motion for animations
- Responsive design is mandatory (mobile-first)

### State Management
- Use Zustand (hauntedStore.ts)
- Separate state into meaningful units
- Proper loading state management for async operations

### API Design
- RESTful API structure
- Error handling is mandatory
- TypeScript type definitions required
- Proper error handling when using AWS SDK

### Testing
- Use React Testing Library for component tests
- Include accessibility tests
- Use Jest for API tests

## Halloween Theme Guidelines
- Use emojis: 👻 🎃 🦇 💀 🕷️ 🕸️ ⚡ 🔥
- Use Halloween-related terms in variable names
- User experience should be spooky but easy to use
- Animations should be smooth and performance-optimized

## Performance Optimization
- Image optimization
- Animation performance monitoring
- Appropriate use of memoization
- Bundle size optimization