import React, { useCallback, useMemo, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// In-app Test Runner page (lazy-loaded). Does nothing unless you click Run.
// We dynamically import the runner on-demand to avoid impacting other routes.

type Summary = {
  totalSuites: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number; // ms
};

type SuiteResult = {
  suite: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
};

type TestReport = {
  summary: Summary;
  suites: SuiteResult[];
  timestamp: Date | string;
};

export default function Tests() {
  const [report, setReport] = useState<TestReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const successRate = useMemo(() => {
    if (!report) return 0;
    return report.summary.totalTests > 0
      ? Math.round((report.summary.passed / report.summary.totalTests) * 100)
      : 0;
  }, [report]);

  const loadRunner = useCallback(async () => {
    return await import("@/testing/comprehensive-test-suite");
  }, []);

  const run = useCallback(async (mode: "all" | "critical" | "performance" | "edge") => {
    setIsRunning(true);
    setError(null);
    try {
      const mod = await loadRunner();
      let nextReport: any;
      switch (mode) {
        case "critical":
          nextReport = await mod.runCriticalTests();
          break;
        case "performance":
          nextReport = await mod.runPerformanceTests();
          break;
        case "edge":
          nextReport = await mod.runEdgeCaseTests();
          break;
        default:
          nextReport = await mod.runAllTests();
      }
      setReport(nextReport);
    } catch (e: any) {
      console.error("Test run failed", e);
      setError(e?.message || "Unknown error running tests");
    } finally {
      setIsRunning(false);
    }
  }, [loadRunner]);

  const exportJson = useCallback(async () => {
    if (!report) return;
    const mod = await loadRunner();
    const json = mod.comprehensiveTestRunner.exportReport(report as any, "test-report.json");
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report, loadRunner]);

  return (
    <HelmetProvider>
      <div className="px-4 py-6 md:px-6">
        <Helmet>
          <title>In-app Test Runner</title>
          <meta name="description" content="Run the in-app comprehensive test runner and view results." />
          <link rel="canonical" href="/tests" />
        </Helmet>

        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Test Runner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Execute comprehensive tests in-app. Safe: tests run only when you click.
          </p>
        </header>

        <main>
          <section className="mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Controls</CardTitle>
                {report && (
                  <Badge variant={report.summary.failed === 0 ? "default" : "destructive"}>
                    {report.summary.failed === 0 ? "All Passed" : `${report.summary.failed} Failed`}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={isRunning} onClick={() => run("all")}>Run All</Button>
                  <Button size="sm" variant="secondary" disabled={isRunning} onClick={() => run("critical")}>Run Critical</Button>
                  <Button size="sm" variant="outline" disabled={isRunning} onClick={() => run("performance")}>Run Performance</Button>
                  <Button size="sm" variant="outline" disabled={isRunning} onClick={() => run("edge")}>Run Edge Cases</Button>
                  <Button size="sm" variant="ghost" disabled={!report || isRunning} onClick={exportJson}>Download JSON</Button>
                </div>
                {isRunning && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Running tests…</div>
                    <Progress value={66} />
                  </div>
                )}
                {error && <div className="text-sm text-destructive">{error}</div>}
              </CardContent>
            </Card>
          </section>

          {report && (
            <section className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Total Suites</span>
                    <Badge variant="outline">{report.summary.totalSuites}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Tests</span>
                    <Badge variant="outline">{report.summary.totalTests}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Passed</span>
                    <Badge>{report.summary.passed}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Failed</span>
                    <Badge variant={report.summary.failed === 0 ? "secondary" : "destructive"}>{report.summary.failed}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Skipped</span>
                    <Badge variant="outline">{report.summary.skipped}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Success Rate</span>
                      <span>{successRate}%</span>
                    </div>
                    <Progress value={successRate} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Duration</span>
                    <span>{(report.summary.duration / 1000).toFixed(2)}s</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Suites</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {report.suites.map((s, idx) => (
                    <div key={idx} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{s.suite}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{s.totalTests} tests</Badge>
                          <Badge>{s.passed} passed</Badge>
                          <Badge variant={s.failed === 0 ? "secondary" : "destructive"}>{s.failed} failed</Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {(s.duration / 1000).toFixed(2)}s • {s.skipped} skipped
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          )}
        </main>
      </div>
    </HelmetProvider>
  );
}
