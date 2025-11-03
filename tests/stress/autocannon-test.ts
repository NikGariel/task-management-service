import autocannon from "autocannon";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const DURATION = parseInt(process.env.DURATION || "30"); // seconds

interface TestConfig {
  connections: number;
  pipelining: number;
  duration: number;
  requests: number;
}

const configs: Record<string, TestConfig> = {
  light: {
    connections: 10,
    pipelining: 1,
    duration: DURATION,
    requests: 0,
  },
  medium: {
    connections: 50,
    pipelining: 2,
    duration: DURATION,
    requests: 0,
  },
  heavy: {
    connections: 100,
    pipelining: 5,
    duration: DURATION,
    requests: 0,
  },
  extreme: {
    connections: 200,
    pipelining: 10,
    duration: DURATION,
    requests: 0,
  },
};

function formatResults(results: autocannon.Result): void {
  console.log("\n" + "=".repeat(60));
  console.log("📊 LOAD TEST RESULTS");
  console.log("=".repeat(60));

  // Autocannon result structure: results object has requests, latency, errors, etc.
  const requests = results.requests || ({} as any);
  const latency = results.latency || ({} as any);

  // Get total requests - can be in different places
  const totalRequests =
    requests.total ||
    (results as any).totalRequests ||
    ((results as any).requests && typeof (results as any).requests === 'number' ? (results as any).requests : 0) ||
    0;

  // Duration in seconds, convert to ms if needed
  const durationMs = results.duration || 0;
  const durationSec = durationMs > 1000 ? durationMs / 1000 : durationMs;

  // Calculate RPS
  const rps = requests.average || (durationSec > 0 && totalRequests > 0 ? totalRequests / durationSec : 0);

  console.log(`\n📈 Throughput:`);
  console.log(`   Requests/sec: ${rps.toFixed(2)}`);
  console.log(`   Latency:`);

  // Latency stats
  const avgLatency = latency.average || latency.mean || 0;
  const minLatency = latency.min || 0;
  const maxLatency = latency.max || 0;
  const p99Latency = latency.p99 || latency["99"] || latency["99th"] || null;
  const p95Latency = latency.p95 || latency["95"] || latency["95th"] || null;

  console.log(`     Average: ${avgLatency.toFixed(2)}ms`);
  console.log(`     Min: ${minLatency.toFixed(2)}ms`);
  console.log(`     Max: ${maxLatency.toFixed(2)}ms`);
  if (p99Latency !== null && p99Latency !== undefined) {
    console.log(`     P99: ${p99Latency.toFixed(2)}ms`);
  }
  if (p95Latency !== null && p95Latency !== undefined) {
    console.log(`     P95: ${p95Latency.toFixed(2)}ms`);
  }

  // Status codes - autocannon stores them as "2xx", "4xx", "5xx" or as numbers
  const status2xx = results["2xx"] || (results as any)["200"] || 0;
  const status4xx = results["4xx"] || 0;
  const status5xx = results["5xx"] || 0;

  // Calculate from statusCodeStats if available
  const statusCodeStats = (results as any).statusCodeStats || {};
  let status2xxFromStats = 0;
  let status4xxFromStats = 0;
  let status5xxFromStats = 0;

  for (const [code, count] of Object.entries(statusCodeStats)) {
    const codeNum = parseInt(code);
    if (codeNum >= 200 && codeNum < 300) {
      status2xxFromStats += count as number;
    } else if (codeNum >= 400 && codeNum < 500) {
      status4xxFromStats += count as number;
    } else if (codeNum >= 500) {
      status5xxFromStats += count as number;
    }
  }

  const final2xx = status2xx || status2xxFromStats || totalRequests;
  const final4xx = status4xx || status4xxFromStats;
  const final5xx = status5xx || status5xxFromStats;

  console.log(`\n⚡ Performance:`);
  console.log(`   Total Requests: ${totalRequests.toLocaleString()}`);
  console.log(`   Successful (2xx): ${final2xx.toLocaleString()}`);
  console.log(`   Client Errors (4xx): ${final4xx.toLocaleString()}`);
  console.log(`   Server Errors (5xx): ${final5xx.toLocaleString()}`);
  console.log(`   Total Failed: ${(final4xx + final5xx).toLocaleString()}`);
  console.log(`   Timeouts: ${(results.timeouts || 0).toLocaleString()}`);

  if (durationSec > 0) {
    console.log(`\n⏱️  Duration: ${durationSec.toFixed(2)}s`);
    console.log(`   Average RPS: ${rps.toFixed(2)}`);
  } else {
    console.log(`\n⏱️  Duration: N/A`);
  }

  console.log("=".repeat(60) + "\n");
}

async function runAutocannonTest(
  endpoint: string,
  method: string,
  body?: object
): Promise<autocannon.Result> {
  const config: TestConfig = configs.medium; // Default to medium

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const instance = autocannon(
      {
        url: `${SERVER_URL}${endpoint}`,
        method: method,
        body: body ? JSON.stringify(body) : undefined,
        headers: body
          ? {
              "Content-Type": "application/json",
            }
          : undefined,
        connections: config.connections,
        pipelining: config.pipelining,
        duration: config.duration,
        requests: config.requests,
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          // Ensure duration is set correctly
          if (result && typeof result === 'object') {
            const actualDuration = Date.now() - startTime;
            if (!result.duration || result.duration === 0) {
              result.duration = actualDuration;
            }

            // Ensure requests object exists
            if (!result.requests) {
              result.requests = { total: 0, average: 0 };
            }

            // Calculate RPS if missing
            if (!result.requests.average && result.duration > 0 && result.requests.total) {
              result.requests.average = (result.requests.total / result.duration) * 1000;
            }
          }
          resolve(result);
        }
      }
    );

    // Progress tracking
    autocannon.track(instance, {
      outputStream: process.stdout,
    });
  });
}

async function runAllTests(): Promise<void> {
  console.log("🚀 Starting Autocannon Load Tests");
  console.log(`📍 Target: ${SERVER_URL}\n`);

  try {
    // Health check
    console.log("1️⃣  Testing Health Endpoint (GET /health)...");
    const healthResults = await runAutocannonTest("/health", "GET");
    formatResults(healthResults);

    // Create tasks
    console.log("2️⃣  Testing Create Task (POST /tasks)...");
    const createBody = {
      title: "Load Test Task",
      description: "This is a load test task",
    };
    const createResults = await runAutocannonTest("/tasks", "POST", createBody);
    formatResults(createResults);

    // Get all tasks
    console.log("3️⃣  Testing Get All Tasks (GET /tasks)...");
    const getAllResults = await runAutocannonTest("/tasks", "GET");
    formatResults(getAllResults);

    // Get tasks with filter
    console.log("4️⃣  Testing Get Tasks with Filter (GET /tasks?status=pending)...");
    const filterResults = await runAutocannonTest("/tasks?status=pending", "GET");
    formatResults(filterResults);

    console.log("✅ All load tests completed!");
  } catch (error) {
    console.error("❌ Error running load tests:", error);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error(`❌ Server is not running at ${SERVER_URL}`);
    console.error("   Please start the server first: bun run dev");
    process.exit(1);
  }

  await runAllTests();
}

main();

