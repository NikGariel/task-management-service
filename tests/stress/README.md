# Load Testing

Нагрузочные тесты для оценки производительности приложения.

## Доступные инструменты

### 1. Custom Bun Load Test (`load-test.ts`)

Кастомный инструмент для нагрузочного тестирования на основе Bun с детальной аналитикой.

**Особенности:**
- Подробные метрики (latency, RPS, percentiles)
- Рампа подключений (ramp-up)
- Think time между запросами
- Детальная статистика по статус кодам

**Запуск:**

```bash
# Легкая нагрузка (10 connections, 100 req/conn)
bun run stress:light

# Средняя нагрузка (50 connections, 200 req/conn)
bun run stress:medium

# Тяжелая нагрузка (100 connections, 500 req/conn)
bun run stress:heavy

# Или напрямую
bun run stress
```

### 2. Autocannon Load Test (`autocannon-test.ts`)

Использует популярную библиотеку autocannon для нагрузочного тестирования.

**Запуск:**

```bash
bun run stress:autocannon
```

## Переменные окружения

- `SERVER_URL` - URL сервера (по умолчанию: `http://localhost:3000`)
- `DURATION` - Длительность теста в секундах для autocannon (по умолчанию: `30`)

Пример:

```bash
SERVER_URL=http://localhost:3000 DURATION=60 bun run stress:autocannon
```

## Метрики

### Custom Bun Load Test

- **RPS (Requests Per Second)**
  - Average - средний RPS за весь тест
  - Peak - пиковый RPS

- **Latency (Latency)**
  - Average - средняя задержка
  - Min/Max - минимальная/максимальная задержка
  - P50/P95/P99 - перцентили задержки

- **Success Rate**
  - Успешные запросы (2xx)
  - Неудачные запросы (4xx, 5xx)
  - Ошибки подключения

- **Status Codes**
  - Распределение по HTTP статус кодам

### Autocannon

- Throughput (Requests/sec)
- Latency (average, min, max, p95, p99)
- Total Requests
- Success/Failure rates
- Timeouts

## Сценарии тестирования

1. **Health Check** - проверка доступности сервера
2. **Create Task** - создание задач под нагрузкой
3. **Get All Tasks** - получение списка задач
4. **Get Tasks (Filtered)** - получение с фильтрацией

## Рекомендации

1. **Перед тестированием:**
   - Убедитесь, что сервер запущен
   - Проверьте, что база данных и Redis доступны
   - Закройте ненужные приложения для максимальной точности

2. **Интерпретация результатов:**
   - RPS > 1000 - отличная производительность
   - Latency P95 < 100ms - хорошая отзывчивость
   - Success Rate > 99% - стабильность системы

3. **При проблемах:**
   - Высокая задержка - проверьте производительность БД
   - Много ошибок - проверьте логи сервера
   - Низкий RPS - возможно узкое место в инфраструктуре

