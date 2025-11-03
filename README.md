# Task Management API

Backend сервис для управления задачами, построенный на принципах Domain-Driven Design (DDD) и Clean Architecture.

## Архитектура

Проект следует принципам Clean Architecture с четким разделением на слои:

- **Domain Layer** (`src/domain/`): Бизнес-логика, сущности, value objects, интерфейсы репозиториев
- **Application Layer** (`src/application/`): Use cases, DTOs, сервисы приложения, валидация
- **Infrastructure Layer** (`src/infrastructure/`): Реализация репозиториев, база данных, Redis, HTTP handlers

## Технологии

- **Runtime**: Bun.js
- **Framework**: Elysia.js
- **Database**: PostgreSQL с DrizzleORM
- **Caching/Queue**: Redis
- **Containerization**: Docker

## Требования

- Bun.js (последняя версия)
- Docker и Docker Compose (для локальной разработки)

## Установка и запуск

### Локальная разработка (с Docker)

1. Клонируйте репозиторий
2. Установите зависимости:
```bash
bun install
```

3. Запустите инфраструктуру (PostgreSQL и Redis):
```bash
docker-compose up -d postgres redis
```

4. Сгенерируйте миграции базы данных:
```bash
bun run db:generate
```

5. Примените миграции:
```bash
bun run db:migrate
```

6. Запустите приложение:
```bash
bun run dev
```

### Запуск всего стека через Docker Compose

```bash
docker-compose up
```

Это запустит PostgreSQL, Redis и приложение в контейнерах.

## Production Deployment

### Сборка для продакшена

```bash
# Компиляция TypeScript в JavaScript
bun run build

# Запуск в production режиме
bun run start:prod
```

### Production Docker

```bash
# Сборка production образа
docker build -f Dockerfile.prod -t taskdb-app:prod .

# Запуск production стека
docker-compose -f docker-compose.prod.yml up -d

# С применением миграций
docker-compose -f docker-compose.prod.yml up -d postgres redis
docker exec -it taskdb-postgres-prod psql -U postgres -d taskdb -c "SELECT version();"
bun run db:migrate
docker-compose -f docker-compose.prod.yml up -d app
```

## API Endpoints

### Создание задачи
```
POST /tasks
Content-Type: application/json

{
  "title": "Task title",
  "description": "Task description (optional)",
  "dueDate": "2024-12-31T23:59:59Z" // ISO 8601, optional
}
```

### Получение списка задач
```
GET /tasks?status=pending
```

Фильтрация по статусу (optional):
- `pending`
- `in_progress`
- `completed`
- `cancelled`

### Получение задачи по ID
```
GET /tasks/:id
```

### Обновление задачи
```
PUT /tasks/:id
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "status": "completed",
  "dueDate": "2024-12-31T23:59:59Z"
}
```

### Удаление задачи
```
DELETE /tasks/:id
```

## Swagger документация

После запуска приложения доступна Swagger документация:
- URL: http://localhost:3000/swagger

## Асинхронные уведомления

Система автоматически создает уведомления для задач, у которых `dueDate` наступает в течение 24 часов. Уведомления обрабатываются асинхронно через Redis и записываются в файл `notifications.log`.

## Структура проекта

```
src/
├── domain/                    # Domain Layer
│   ├── entities/             # Доменные сущности
│   ├── value-objects/        # Value Objects
│   └── repositories/         # Интерфейсы репозиториев
├── application/              # Application Layer
│   ├── dto/                 # Data Transfer Objects
│   ├── services/            # Application Services
│   ├── validators/          # Валидация
│   └── exceptions/          # Исключения
└── infrastructure/          # Infrastructure Layer
    ├── database/            # Конфигурация БД и схема
    ├── repositories/        # Реализация репозиториев
    ├── redis/               # Redis клиент
    ├── services/            # Инфраструктурные сервисы
    └── http/                # HTTP handlers и middleware
```

## Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskdb
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000
```

## Миграции базы данных

Генерация миграций:
```bash
bun run db:generate
```

Применение миграций:
```bash
bun run db:migrate
```

Push схемы в базу данных (без миграций):
```bash
bun run db:push
```

Pull схемы из базы данных:
```bash
bun run db:pull
```

Проверка миграций на конфликты:
```bash
bun run db:check
```

Drizzle Studio (GUI для БД):
```bash
bun run db:studio
```

## Тестирование

Проект использует встроенный Bun test runner для тестирования.

### Запуск тестов

```bash
# Запуск всех тестов
bun test

# Запуск тестов в watch режиме
bun run test:watch

# Запуск тестов с покрытием
bun run test:coverage
```

### Структура тестов

Тесты организованы по слоям архитектуры:

- **Domain Layer Tests** (`src/domain/**/__tests__/`): Unit тесты для сущностей и value objects
  - `Task.test.ts` - тесты для доменной сущности Task
  - `TaskStatus.test.ts` - тесты для value object TaskStatus
  - `DueDate.test.ts` - тесты для value object DueDate

- **Application Layer Tests** (`src/application/**/__tests__/`): Unit тесты для сервисов и валидаторов
  - `TaskService.test.ts` - тесты для TaskService с моками репозиториев
  - `TaskValidator.test.ts` - тесты для валидации данных

- **Infrastructure Layer Tests** (`src/infrastructure/**/__tests__/`): Тесты для HTTP handlers
  - `TaskController.test.ts` - интеграционные тесты для API endpoints

### Покрытие тестами

Тесты покрывают:
- ✅ Доменные сущности и value objects (100%)
- ✅ Application services и валидаторы
- ✅ HTTP handlers и обработка ошибок
- ✅ Бизнес-логика создания уведомлений

## Build и Production

### Сборка проекта

```bash
# Сборка приложения (компиляция TypeScript)
bun run build

# Проверка сборки без создания bundle
bun run build:check
```

Собранные файлы будут в папке `dist/`.

### Production скрипты

```bash
# Запуск production версии
bun run start:prod

# Или напрямую
NODE_ENV=production bun run dist/index.js
```

### Переменные окружения для production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/taskdb
REDIS_URL=redis://host:6379
PORT=3000
```

## Разработка

Принципы, соблюденные в проекте:
- **SOLID**: Разделение ответственности, инверсия зависимостей
- **DDD**: Доменные сущности, value objects, репозитории
- **Clean Architecture**: Четкое разделение слоев, независимость от фреймворков

## Health Check

Health check endpoint:
```
GET /health
```
