type Metrics = {
  startedAt: number;
  requestsTotal: number;
  requestsByStatus: Record<string, number>;
};

const metrics: Metrics = {
  startedAt: Date.now(),
  requestsTotal: 0,
  requestsByStatus: {}
};

export function incRequest(status: number) {
  metrics.requestsTotal += 1;
  const k = String(status);
  metrics.requestsByStatus[k] = (metrics.requestsByStatus[k] ?? 0) + 1;
}

export function snapshot() {
  return {
    startedAt: metrics.startedAt,
    uptimeMs: Date.now() - metrics.startedAt,
    requestsTotal: metrics.requestsTotal,
    requestsByStatus: metrics.requestsByStatus,
    memory: process.memoryUsage()
  };
}
