# Testing Guide

This project includes both unit tests (Jest + React Testing Library) and end-to-end tests (Cypress).

## Unit Tests

### Running Unit Tests

```bash
# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests once with coverage
npm run test:coverage

# Run tests once
npm test
```

### Test Structure

- Unit tests are located in `src/**/__tests__/` directories
- Test files follow the pattern: `*.test.tsx` or `*.test.ts`
- Components are tested using React Testing Library
- Redux slices are tested using Jest

### Writing Unit Tests

#### Component Tests

```typescript
import { render, screen, fireEvent } from '../../test-utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

#### Redux Slice Tests

```typescript
import authReducer, { loginUser } from '../authSlice';

describe('Auth Slice', () => {
  it('handles login pending', () => {
    const action = { type: loginUser.pending.type };
    const newState = authReducer(initialState, action);
    expect(newState.isLoading).toBe(true);
  });
});
```

## End-to-End Tests

### Running E2E Tests

```bash
# Open Cypress Test Runner (interactive)
npm run cypress:open

# Run tests in headless mode
npm run cypress:run

# Run all E2E tests
npm run test:e2e
```

### E2E Test Structure

- E2E tests are located in `cypress/e2e/`
- Test files follow the pattern: `*.cy.ts`
- Tests use custom commands for common actions

### Writing E2E Tests

```typescript
describe('Authentication', () => {
  it('should login successfully', () => {
    cy.login('admin', 'password');
    cy.url().should('not.include', '/login');
  });
});
```

## Custom Commands

The project includes custom Cypress commands:

- `cy.login(username, password)` - Logs in with credentials
- `cy.logout()` - Logs out the current user

## Test Coverage

The project aims for 70% test coverage across:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Running All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

## Test Environment

- **Unit Tests**: Jest + React Testing Library + jsdom
- **E2E Tests**: Cypress with Chrome browser
- **Coverage**: Istanbul/nyc for coverage reporting

## Best Practices

1. **Unit Tests**: Test component behavior, not implementation
2. **E2E Tests**: Test user workflows and critical paths
3. **Mocking**: Mock external dependencies (API calls, localStorage)
4. **Accessibility**: Test with screen readers and keyboard navigation
5. **Performance**: Keep tests fast and focused

## Debugging Tests

### Unit Tests
```bash
# Run specific test file
npm test -- --testPathPattern=Login.test.tsx

# Run tests with verbose output
npm test -- --verbose
```

### E2E Tests
```bash
# Run specific test file
npx cypress run --spec "cypress/e2e/auth.cy.ts"

# Run with browser dev tools
npx cypress open --config video=false
``` 