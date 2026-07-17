# Contributing to Aerisyn

We welcome contributions to **Aerisyn**! Please follow these guidelines to ensure a smooth collaboration process.

---

## Code of Conduct
By participating in this project, you agree to abide by our [Code of Conduct](file:///c:/Users/karth/Downloads/Code-Review-Bot%20%281%29/Code-Review-Bot/CODE_OF_CONDUCT.md).

---

## Development Workflow

### 1. Requirements
Ensure you have the following installed:
- Node.js v24.x+
- pnpm v11.13.1+
- Docker Desktop

### 2. Fork and Branching
1. Fork the repository on GitHub.
2. Create a feature branch from the main branch:
   ```bash
   git checkout -b feature/your-awesome-feature
   ```

### 3. Code Standards & Quality
We enforce strict TypeScript configurations and Prettier formatting styles.
- **Type Checking**: Run `npx pnpm typecheck` to ensure no compiler warnings exist.
- **Build Verification**: Run `npx pnpm build` to compile all packages before committing.

### 4. Pull Request Requirements
- Keep your changes focused. If you are fixing a bug and adding a feature, submit them as separate Pull Requests.
- Ensure the PR builds successfully in the CI pipeline.
- Provide a summary of changes and reference any related GitHub issues.
