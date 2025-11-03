/**
 * Custom load test using Bun's native capabilities
 * Provides detailed metrics and analysis
 */

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

interface LoadTestConfig {
  name: string;
  connections: number;
  requestsPerConnection: number;
  thinkTime: number; // ms between requests
  rampUp: number; // connections per second
}

interface Metrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    errors: number;
  };
  latency: {
    min: number;
    max: number;
    average: number;
    p50: number;
    p95: number;
    p99: number;
    values: number[];
  };
  rps: {
    current: number;
    average: number;
    peak: number;
  };
  statusCodes: Record<number, number>;
  startTime: number;
  endTime?: number;
}

const CONFIGS: Record<string, LoadTestConfig> = {
  light: {
    name: "Light Load",
    connections: 10,
    requestsPerConnection: 100,
    thinkTime: 100,
    rampUp: 2,
  },
  medium: {
    name: "Medium Load",
    connections: 50,
    requestsPerConnection: 200,
    thinkTime: 50,
    rampUp: 5,
  },
  heavy: {
    name: "Heavy Load",
    connections: 100,
    requestsPerConnection: 500,
    thinkTime: 10,
    rampUp: 10,
  },
};

async function makeRequest(url: string, method: string, body?: object): Promise<{
  latency: number;
  statusCode: number;
  success: boolean;
}> {
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method,
      headers: body
        ? {
            "Content-Type": "application/json",
          }
        : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const latency = performance.now() - startTime;
    const success = response.ok;

    return {
      latency,
      statusCode: response.status,
      success,
    };
  } catch (error) {
    const latency = performance.now() - startTime;
    return {
      latency,
      statusCode: 0,
      success: false,
    };
  }
}

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

function calculateMetrics(allResults: Array<{
  latency: number;
  statusCode: number;
  success: boolean;
}>): Metrics["latency"] {
  const latencies = allResults.map((r) => r.latency).sort((a, b) => a - b);

  if (latencies.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      values: [],
    };
  }

  const sum = latencies.reduce((acc, val) => acc + val, 0);

  return {
    min: latencies[0],
    max: latencies[latencies.length - 1],
    average: sum / latencies.length,
    p50: calculatePercentile(latencies, 50),
    p95: calculatePercentile(latencies, 95),
    p99: calculatePercentile(latencies, 99),
    values: latencies,
  };
}

async function runConnection(
  config: LoadTestConfig,
  endpoint: string,
  method: string,
  body: object | undefined,
  results: Array<{ latency: number; statusCode: number; success: boolean }>,
  metrics: Metrics
): Promise<void> {
  for (let i = 0; i < config.requestsPerConnection; i++) {
    const result = await makeRequest(`${SERVER_URL}${endpoint}`, method, body);

    // Update metrics atomically
    metrics.requests.total++;
    if (result.success) {
      metrics.requests.successful++;
    } else {
      metrics.requests.failed++;
      if (result.statusCode === 0) {
        metrics.requests.errors++;
      }
    }

    metrics.statusCodes[result.statusCode] = (metrics.statusCodes[result.statusCode] || 0) + 1;
    results.push(result);

    // Think time
    if (config.thinkTime > 0 && i < config.requestsPerConnection - 1) {
      await Bun.sleep(config.thinkTime);
    }
  }
}

async function runLoadTest(
  config: LoadTestConfig,
  endpoint: string,
  method: string,
  body?: object
): Promise<Metrics> {
  const metrics: Metrics = {
    requests: {
      total: 0,
      successful: 0,
      failed: 0,
      errors: 0,
    },
    latency: {
      min: 0,
      max: 0,
      average: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      values: [],
    },
    rps: {
      current: 0,
      average: 0,
      peak: 0,
    },
    statusCodes: {},
    startTime: performance.now(),
  };

  const allResults: Array<{ latency: number; statusCode: number; success: boolean }> = [];

  console.log(`\n🚀 Starting ${config.name}`);
  console.log(`   Connections: ${config.connections}`);
  console.log(`   Requests per connection: ${config.requestsPerConnection}`);
  console.log(`   Total requests: ${config.connections * config.requestsPerConnection}`);
  console.log(`   Endpoint: ${method} ${endpoint}\n`);

  // Ramp up connections
  const connectionPromises: Promise<void>[] = [];
  for (let i = 0; i < config.connections; i++) {
    if (i > 0 && config.rampUp > 0) {
      await Bun.sleep(1000 / config.rampUp);
    }

    connectionPromises.push(
      runConnection(config, endpoint, method, body, allResults, metrics)
    );
  }

  // Wait for all connections to complete
  await Promise.all(connectionPromises);

  metrics.endTime = performance.now();
  const duration = (metrics.endTime - metrics.startTime) / 1000; // seconds

  // Calculate final metrics
  metrics.latency = calculateMetrics(allResults);
  metrics.rps.average = metrics.requests.total / duration;
  metrics.rps.peak = Math.max(
    ...Array.from({ length: Math.floor(duration) }, (_, i) => {
      const start = i;
      const end = i + 1;
      return allResults.filter((r, idx) => {
        const time = (idx / allResults.length) * duration;
        return time >= start && time < end;
      }).length;
    }),
    0
  );

  return metrics;
}

function printMetrics(metrics: Metrics, endpoint: string): void {
  const duration = metrics.endTime
    ? (metrics.endTime - metrics.startTime) / 1000
    : 0;

  console.log("\n" + "=".repeat(70));
  console.log(`📊 LOAD TEST RESULTS: ${endpoint}`);
  console.log("=".repeat(70));

  console.log(`\n📈 Throughput:`);
  console.log(`   Requests/sec (average): ${metrics.rps.average.toFixed(2)}`);
  console.log(`   Requests/sec (peak): ${metrics.rps.peak.toFixed(2)}`);
  console.log(`   Total requests: ${metrics.requests.total}`);

  console.log(`\n⏱️  Latency:`);
  console.log(`   Average: ${metrics.latency.average.toFixed(2)}ms`);
  console.log(`   Min: ${metrics.latency.min.toFixed(2)}ms`);
  console.log(`   Max: ${metrics.latency.max.toFixed(2)}ms`);
  console.log(`   P50: ${metrics.latency.p50.toFixed(2)}ms`);
  console.log(`   P95: ${metrics.latency.p95.toFixed(2)}ms`);
  console.log(`   P99: ${metrics.latency.p99.toFixed(2)}ms`);

  console.log(`\n✅ Success Rate:`);
  const successRate = (metrics.requests.successful / metrics.requests.total) * 100;
  console.log(`   Successful: ${metrics.requests.successful} (${successRate.toFixed(2)}%)`);
  console.log(`   Failed: ${metrics.requests.failed} (${((metrics.requests.failed / metrics.requests.total) * 100).toFixed(2)}%)`);
  console.log(`   Errors: ${metrics.requests.errors}`);

  console.log(`\n📊 Status Codes:`);
  Object.entries(metrics.statusCodes)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([code, count]) => {
      console.log(`   ${code}: ${count}`);
    });

  console.log(`\n⏰ Duration: ${duration.toFixed(2)}s`);
  console.log("=".repeat(70) + "\n");
}

async function checkServer(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  let loadType = "medium";

  // Parse arguments
  for (const arg of args) {
    if (arg === "--light") loadType = "light";
    else if (arg === "--medium") loadType = "medium";
    else if (arg === "--heavy") loadType = "heavy";
    else if (arg.startsWith("--")) {
      loadType = arg.replace("--", "");
    }
  }

  const config = CONFIGS[loadType];
  if (!config) {
    console.error(`❌ Unknown load type: ${loadType}`);
    console.error(`   Available: ${Object.keys(CONFIGS).join(", ")}`);
    process.exit(1);
  }

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error(`❌ Server is not running at ${SERVER_URL}`);
    console.error("   Please start the server first: bun run dev");
    process.exit(1);
  }

  console.log(`🎯 Using configuration: ${config.name}`);

  // Test scenarios
  const scenarios = [
    { name: "Health Check", endpoint: "/health", method: "GET", body: undefined },
    {
      name: "Create Task",
      endpoint: "/tasks",
      method: "POST",
      body: { title: "Load Test Task", description: "Testing under load" },
    },
    { name: "Get All Tasks", endpoint: "/tasks", method: "GET", body: undefined },
    { name: "Get Tasks (Filtered)", endpoint: "/tasks?status=pending", method: "GET", body: undefined },
  ];

  for (const scenario of scenarios) {
    const metrics = await runLoadTest(
      config,
      scenario.endpoint,
      scenario.method,
      scenario.body
    );
    printMetrics(metrics, scenario.name);
  }

  console.log("✅ All load tests completed!");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});

