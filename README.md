# Realtime Analysis and Trading Application

A high-performance, real-time trading application built for sub-300ms execution latency with support for 500+ instruments and 30-40 concurrent strategies.

## 🚀 Technology Stack

### Runtime Environment
- **Primary Runtime**: [Bun](https://bun.sh) - Fastest JS runtime with native TypeScript support
- **Language**: TypeScript 5.x for type safety and maintainability
- **Package Manager**: Bun for ultra-fast package installation and management

### Backend Technologies
- **Framework**: ElysiaJS - High-performance HTTP server built for Bun
- **Database**: PostgreSQL 15+ with TimescaleDB 2.x for time-series optimization
- **DB Driver**: Bun's built-in postgres driver
- **Dependency Injection**: InversifyJS for modularity and testability

### Frontend Technologies
- **Framework**: Svelte 5 with Runes for compiled output and excellent performance
- **Charts**: TradingView Lightweight Charts for financial data visualization
- **UI Library**: Tailwind CSS for utility-first design system
- **Build Tool**: Vite for fast development and optimized production builds

### Development & Operations
- **Containerization**: Docker + Docker Compose for consistent environments
- **Process Manager**: Systemd for production, Bun PM for development
- **Testing**: Bun Test + Playwright for native testing and E2E testing
- **Monitoring**: Prometheus + Grafana for metrics and visualization

## 📊 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Order Execution Latency** | < 300ms | Strategy signal to broker API call |
| **Data Processing Time** | < 50ms | WebSocket message to database write |
| **UI Response Time** | < 100ms | User interaction to visual feedback |
| **Concurrent Strategies** | 30-40 | Active strategy instances |
| **Instrument Capacity** | 500+ | Monitored trading instruments |

## 🔧 System Requirements

- **Runtime**: Bun 1.0+ (latest stable)
- **Node.js**: 20+ (for compatibility with some tools)
- **Docker**: 24.0+ with Docker Compose
- **PostgreSQL**: 15+ with TimescaleDB 2.x extension
- **Memory**: 8GB+ RAM recommended for development
- **Storage**: 50GB+ free space for development environment

## 🛠️ Development Environment Setup

### 1. Bun Runtime Installation

**macOS (via Homebrew):**
```bash
brew install oven-sh/bun/bun
```

**Linux/WSL:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Verify Installation:**
```bash
bun --version
```

### 2. Node.js Installation (for compatibility)

Install Node.js 20+ for compatibility with development tools:
```bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 3. Docker and Docker Compose Setup

**Install Docker Desktop:**
- Download from [docker.com](https://www.docker.com/products/docker-desktop/)
- Follow platform-specific installation instructions
- Ensure Docker Compose is included (v2.0+)

**Verify Installation:**
```bash
docker --version
docker compose version
```

### 4. PostgreSQL and TimescaleDB Setup

The database runs in Docker containers. No local installation required.

## 📦 Package Management and Dependencies

### Core Dependencies Installation

**Clone the repository:**
```bash
git clone <repository-url>
cd trade-bot
```

**Install dependencies:**
```bash
bun install
```

**Install development dependencies:**
```bash
bun install --dev
```

### Key Dependencies

**Production Dependencies:**
```json
{
  "@elysiajs/elysia": "^1.0.0",
  "inversify": "^6.0.0", 
  "reflect-metadata": "^0.1.13",
  "postgres": "^3.4.0",
  "winston": "^3.10.0"
}
```

**Development Dependencies:**
```json
{
  "@types/node": "^20.0.0",
  "playwright": "^1.40.0",
  "typescript": "^5.2.0"
}
```

### Environment Variable Configuration

**Create environment files:**
```bash
# Copy example environment files
cp .env.example .env
cp .env.docker.example .env.docker
```

**Required Environment Variables:**
```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/trading_db"
TIMESCALE_DB_HOST="localhost"
TIMESCALE_DB_PORT="5432"
TIMESCALE_DB_USER="trading_user"
TIMESCALE_DB_PASSWORD="secure_password"
TIMESCALE_DB_NAME="trading_db"

# JWT Configuration  
JWT_SECRET="your-super-secure-jwt-secret-key"
JWT_EXPIRES_IN="24h"

# Security
ENCRYPTION_KEY="32-character-encryption-key-here"

# Development
NODE_ENV="development"
PORT="3000"
```

## 🖥️ Server Setup and Configuration

### Database Connection Setup

**Start PostgreSQL + TimescaleDB with Docker:**
```bash
docker compose up -d postgres
```

**Verify database connection:**
```bash
bun run db:test-connection
```

### Docker Compose Service Orchestration

**Start all services:**
```bash
# Start all services in development mode
docker compose up -d

# View service logs
docker compose logs -f

# Stop all services
docker compose down
```

**Service Architecture:**
- **postgres**: PostgreSQL 15 + TimescaleDB 2.x
- **grafana**: Monitoring dashboard
- **prometheus**: Metrics collection

### Local Development Server Startup

**Backend Server:**
```bash
# Start development server with hot reload
bun run dev

# Start production server
bun run start

# Run specific services
bun run dev:api      # API server only
bun run dev:worker   # Background workers only
```

**Frontend Server:**
```bash
cd frontend
bun run dev     # Development with hot reload
bun run build   # Production build
bun run preview # Preview production build
```

**Access Points:**
- API Server: http://localhost:3000
- Frontend: http://localhost:5173
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

## 👨‍💻 Developer Onboarding Guide

### Step-by-Step Setup Checklist

- [ ] **Prerequisites Installed**
  - [ ] Bun runtime installed and verified
  - [ ] Node.js 20+ installed
  - [ ] Docker Desktop installed and running
  - [ ] Git configured with SSH keys

- [ ] **Project Setup**
  - [ ] Repository cloned
  - [ ] Dependencies installed (`bun install`)
  - [ ] Environment files configured (`.env`, `.env.docker`)
  - [ ] Database services started (`docker compose up -d postgres`)

- [ ] **Development Environment**
  - [ ] Code editor configured (VS Code recommended)
  - [ ] ESLint and Prettier extensions installed
  - [ ] TypeScript language server working
  - [ ] Docker extension installed

- [ ] **Verification**
  - [ ] Database connection test passes
  - [ ] Backend server starts successfully
  - [ ] Frontend builds without errors
  - [ ] Tests run successfully (`bun test`)

### Code Standards and Formatting Setup

**Install recommended VS Code extensions:**
```bash
# Install via VS Code extensions marketplace
- ESLint
- Prettier - Code formatter
- TypeScript and JavaScript Language Features
- Docker
- GitLens
```

**Configure Prettier (`.prettierrc`):**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**ESLint Configuration:**
Pre-configured in the project with custom rules for trading-specific patterns.

### Testing Framework Installation and Usage

**Run Tests:**
```bash
# Run all tests
bun test

# Run specific test files
bun test src/trading/order-manager.test.ts

# Run tests in watch mode
bun test --watch

# Run E2E tests
bun run test:e2e
```

**Test File Organization:**
```
src/
├── trading/
│   ├── order-manager.ts
│   └── order-manager.test.ts     # Unit tests
tests/
├── integration/                  # Integration tests
└── e2e/                         # End-to-end tests
```

**Performance Testing:**
```bash
# Benchmark critical code paths
bun run benchmark

# Memory leak testing
bun run test:memory

# Load testing
bun run test:load
```

### Development Workflow Documentation

**Branch Strategy:**
```bash
# Feature development
git checkout -b feature/story-1-1-readme
git commit -m "feat: add comprehensive README documentation"
git push origin feature/story-1-1-readme
```

**Code Standards:**
- Files: kebab-case (e.g., `order-manager.ts`)
- Classes: PascalCase
- Strategy files: `.strategy.ts` suffix
- Client files: `.client.ts` suffix

**Pre-commit Hooks:**
Automatically run type checking, linting, and formatting before commits.

## 🐛 Troubleshooting

### Common Setup Issues and Solutions

**1. Bun Installation Issues:**
```bash
# Clear Bun cache
rm -rf ~/.bun/cache

# Reinstall Bun
curl -fsSL https://bun.sh/install | bash
```

**2. Database Connection Failures:**
```bash
# Reset Docker containers
docker compose down -v
docker compose up -d postgres

# Check container logs
docker compose logs postgres
```

**3. Port Conflicts:**
```bash
# Find processes using ports
lsof -i :3000
lsof -i :5432

# Kill conflicting processes
kill -9 <PID>
```

**4. TypeScript Compilation Errors:**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
bun install

# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Performance Optimization Tips

**1. Development Performance:**
- Use `bun run dev` for hot reload
- Enable incremental TypeScript compilation
- Use Docker volume caching for faster builds

**2. Memory Usage:**
- Monitor with `bun run monitor`
- Profile with built-in Bun profiler
- Use object pooling for high-frequency operations

**3. Database Performance:**
- Use connection pooling (configured by default)
- Monitor TimescaleDB compression
- Regular VACUUM and ANALYZE operations

### Development Environment Verification

**System Health Check:**
```bash
# Run comprehensive health check
bun run health-check

# Verify all services
bun run verify:all

# Check performance benchmarks
bun run benchmark:quick
```

**Expected Output:**
- ✅ Bun runtime: v1.x.x
- ✅ Database connection: Connected
- ✅ All services: Running
- ✅ Tests: All passing
- ✅ Performance: Within targets

---

## 📞 Support

For technical issues or questions:
- Check the troubleshooting section above
- Review architecture documentation in `docs/architecture/`
- Create an issue in the project repository
- Contact the development team

---

**Happy Trading! 📈**