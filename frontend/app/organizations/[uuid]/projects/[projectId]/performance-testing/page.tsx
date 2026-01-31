"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/layout/user-nav";
import {
    Zap,
    Gauge,
    TrendingUp,
    TrendingDown,
    Users,
    Activity,
    Timer,
    Play,
    BarChart3,
    LineChart,
    AlertTriangle,
    CheckCircle,
    Clock,
    Home,
    RefreshCw,
    List,
    Plus,
    ChevronLeft,
    ChevronRight,
    Shield,
    Globe,
    History as HistoryIcon,
    Info,
    Trash2,
} from "lucide-react";
import { CircuitLogoIcon } from "@/components/ui/CircuitLogoIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    PerformanceTestWizard,
    PerformanceGauge,
    CoreWebVitalsChart,
    LatencyDistributionChart,
    RealTimeMetricsChart,
    VirtualUsersChart,
    ThroughputChart,
    ScoreBreakdownChart,
    TestComparison,
    demoTestResults,
    ReportExport,
    demoReportData,
    HistoricalTrendChart,
    generateDemoTrendData,
    PerformanceTestList,
    LighthouseReport,
} from "@/components/performance";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const parseDuration = (value: string | number): number => {
    if (typeof value === "number") return value;
    if (!value) return 0;

    const str = value.toString().toLowerCase().trim();
    if (!isNaN(Number(str))) return parseFloat(str);

    if (str.endsWith("ms")) return parseFloat(str.replace("ms", "")) / 1000;
    if (str.endsWith("s")) return parseFloat(str.replace("s", ""));
    if (str.endsWith("m")) return parseFloat(str.replace("m", "")) * 60;
    if (str.endsWith("h")) return parseFloat(str.replace("h", "")) * 3600;
    if (str.endsWith("d")) return parseFloat(str.replace("d", "")) * 86400;

    return parseFloat(str) || 0;
};

export default function PerformanceTestingPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const uuid = params.uuid as string;

    const [activeModule, setActiveModule] = useState<
        | "overview"
        | "tests"
        | "lighthouse"
        | "load"
        | "stress"
        | "spike"
        | "soak"
        | "volume"
        | "scalability"
        | "capacity"
        | "results"
    >("overview");
    const [lhTargetUrl, setLhTargetUrl] = useState("");
    const [loadTargetUrl, setLoadTargetUrl] = useState("");
    const [stressTargetUrl, setStressTargetUrl] = useState("");
    const [spikeTargetUrl, setSpikeTargetUrl] = useState("");
    const [soakTargetUrl, setSoakTargetUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [lighthouseResult, setLighthouseResult] = useState<any>(null);
    const [loadTestResult, setLoadTestResult] = useState<any>(null);
    const [isLoadTestModalOpen, setIsLoadTestModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLighthouseLoading, setIsLighthouseLoading] = useState(false);
    const [isLoadLoading, setIsLoadLoading] = useState(false);
    const [isStressLoading, setIsStressLoading] = useState(false);
    const [isSpikeLoading, setIsSpikeLoading] = useState(false);
    const [isSoakLoading, setIsSoakLoading] = useState(false);
    const [testToEdit, setTestToEdit] = useState<any>(null);
    const [showAdvancedLoad, setShowAdvancedLoad] = useState(false);

    // Lighthouse Options State
    const [lhDevice, setLhDevice] = useState<"mobile" | "desktop">("mobile");
    const [lhMode, setLhMode] = useState<"navigation" | "timespan" | "snapshot">(
        "navigation",
    );
    const [lhCategories, setLhCategories] = useState({
        performance: true,
        accessibility: true,
        bestPractices: true,
        seo: true,
    });
    const [lighthouseHistory, setLighthouseHistory] = useState<any[]>([]);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
        null,
    );

    // Stats from API
    const [stats, setStats] = useState({
        total_tests: 0,
        avg_performance_score: null as number | null,
        pass_rate: 0,
        active_alerts: 0,
    });

    useEffect(() => {
        fetchDashboardData();
        fetchLighthouseHistory();
    }, [projectId]);

    const fetchLighthouseHistory = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(
                `${API_URL}/api/v1/performance/tests?project_id=${projectId}&page=1&page_size=20`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    credentials: "include",
                },
            );
            if (response.ok) {
                const data = await response.json();
                // Filter for lighthouse tests
                const lhTests = (data.items || []).filter(
                    (t: any) =>
                        t.test_type === "lighthouse" || t.test_type === "pagespeed",
                );
                setLighthouseHistory(lhTests);
            }
        } catch (error) {
            console.error("Failed to fetch lighthouse history:", error);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const headers: Record<string, string> = token
                ? { Authorization: `Bearer ${token}` }
                : {};

            const statsResponse = await fetch(
                `${API_URL}/api/v1/performance/dashboard/${projectId}/stats`,
                {
                    credentials: "include",
                    headers,
                },
            );
            if (statsResponse.ok) {
                const data = await statsResponse.json();
                setStats({
                    total_tests: data.total_tests || 0,
                    avg_performance_score: data.avg_performance_score,
                    pass_rate: data.pass_rate || 0,
                    active_alerts: data.active_alerts || 0,
                });
            }
        } catch (error) {
            console.error("Failed to fetch performance data:", error);
        } finally {
            setLoading(false);
        }
    };

    const pollTestStatus = async (testId: string) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(
                `${API_URL}/api/v1/performance/tests/${testId}`,
                {
                    credentials: "include",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                },
            );

            if (response.ok) {
                const test = await response.json();

                if (test.status === "completed") {
                    setProgress(100);
                    await handleTestExecutionComplete(testId);
                    setIsLoading(false);
                    if (test.test_type === "lighthouse" || test.test_type === "pagespeed")
                        setIsLighthouseLoading(false);
                    else if (test.test_type === "load") setIsLoadLoading(false);
                    else if (test.test_type === "stress") setIsStressLoading(false);
                    else if (test.test_type === "spike") setIsSpikeLoading(false);
                    else if (test.test_type === "endurance" || test.test_type === "soak")
                        setIsSoakLoading(false);
                } else if (test.status === "failed" || test.status === "cancelled") {
                    setIsLoading(false);
                    if (test.test_type === "lighthouse" || test.test_type === "pagespeed")
                        setIsLighthouseLoading(false);
                    else if (test.test_type === "load") setIsLoadLoading(false);
                    else if (test.test_type === "stress") setIsStressLoading(false);
                    else if (test.test_type === "spike") setIsSpikeLoading(false);
                    else if (test.test_type === "endurance" || test.test_type === "soak")
                        setIsSoakLoading(false);
                    console.error("Test failed:", test.error_message);
                    // Optionally show error toast here
                } else {
                    // Update progress if available (fake it if < 90)
                    const serverProgress = test.progress_percentage || 0;
                    setProgress((prev) =>
                        Math.max(prev, serverProgress, prev < 90 ? prev + 5 : prev),
                    );

                    // NEW: Update real-time metrics even while running
                    if (
                        ["load", "stress", "spike", "endurance", "soak"].includes(
                            test.test_type,
                        )
                    ) {
                        const metrics = test.metrics || {};
                        if (metrics.rps_timeline && metrics.rps_timeline.length > 0) {
                            setLoadTestResult({
                                type: test.test_type,
                                p50: metrics.latency_p50,
                                p75: metrics.latency_p75,
                                p90: metrics.latency_p90,
                                p95: metrics.latency_p95,
                                p99: metrics.latency_p99,
                                max: metrics.latency_max,
                                avgRps: metrics.requests_per_second,
                                successRate: 100 - (metrics.error_rate || 0),
                                totalRequests: metrics.total_requests_made,
                                timeline: metrics.rps_timeline.map((p: any, idx: number) => ({
                                    timestamp: p.timestamp,
                                    rps: p.value,
                                    latency: metrics.latency_timeline?.[idx]?.value || 0,
                                    errors: metrics.errors_timeline?.[idx]?.value || 0,
                                })),
                                vuTimeline: metrics.virtual_users_timeline
                                    ? metrics.virtual_users_timeline.map((p: any) => ({
                                        timestamp: p.timestamp || "0s",
                                        activeVUs:
                                            typeof p.value === "number" ? p.value : p.vus || 0,
                                        targetVUs: test.virtual_users || 50,
                                    }))
                                    : [],
                            });
                        }
                    }

                    // Poll again
                    setTimeout(() => pollTestStatus(testId), 2000);
                }
            } else {
                setIsLoading(false);
                setIsLighthouseLoading(false);
                setIsLoadLoading(false);
                setIsStressLoading(false);
                setIsSpikeLoading(false);
                setIsSoakLoading(false);
            }
        } catch (error) {
            console.error("Polling failed:", error);
            setIsLoading(false);
            setIsLighthouseLoading(false);
            setIsLoadLoading(false);
            setIsStressLoading(false);
            setIsSpikeLoading(false);
            setIsSoakLoading(false);
        }
    };

    const handleLighthouseScan = async () => {
        if (!lhTargetUrl) return;
        setIsLighthouseLoading(true);
        setIsLoading(true);
        setProgress(0);
        setLighthouseResult(null);
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(
                `${API_URL}/api/v1/performance/lighthouse?project_id=${projectId}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    body: JSON.stringify({
                        target_url: lhTargetUrl,
                        device_type: lhDevice,
                        mode: lhMode,
                        categories: lhCategories,
                    }),
                },
            );
            if (response.ok) {
                const data = await response.json();
                if (
                    data.status === "pending" ||
                    data.status === "running" ||
                    data.status === "queued"
                ) {
                    // Start polling
                    pollTestStatus(data.id);
                } else {
                    // Immediate result (fallback)
                    const metrics = data.metrics || {};
                    setLighthouseResult({
                        performance: Math.round((metrics.performance_score || 0) * 100),
                        accessibility: Math.round((metrics.accessibility_score || 0) * 100),
                        bestPractices: Math.round(
                            (metrics.best_practices_score || 0) * 100,
                        ),
                        seo: Math.round((metrics.seo_score || 0) * 100),
                        lcp: metrics.largest_contentful_paint || 0,
                        fid: metrics.first_input_delay || 0,
                        cls: metrics.cumulative_layout_shift || 0,
                        fcp: metrics.first_contentful_paint || 0,
                        ttfb: metrics.time_to_first_byte || 0,
                        opportunities: metrics.opportunities || [],
                        diagnostics: metrics.diagnostics || [],
                        raw_response: metrics.raw_response,
                    });
                    setIsLoading(false);
                    setIsLighthouseLoading(false);
                    fetchDashboardData();
                }
            } else {
                console.error("Lighthouse scan failed:", response.statusText);
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Lighthouse scan failed:", error);
            setIsLoading(false);
            setIsLighthouseLoading(false);
        }
    };

    const handleTestCreated = async (
        testConfig: any,
        shouldRun: boolean = true,
    ) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(
                `${API_URL}/api/v1/performance/tests?project_id=${projectId}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    body: JSON.stringify(testConfig),
                },
            );
            if (response.ok) {
                const test = await response.json();
                setShowWizard(false);
                fetchDashboardData();
                setRefreshTrigger((prev) => prev + 1);

                if (shouldRun) {
                    // Immediately trigger execution
                    const execResponse = await fetch(
                        `${API_URL}/api/v1/performance/tests/${test.id}/execute`,
                        {
                            method: "POST",
                            credentials: "include",
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                        },
                    );

                    if (execResponse.ok) {
                        toast.success("Test created and started");
                        handleTestRunStarted(test.id, test.test_type);
                    } else {
                        toast.success("Test created successfully");
                    }
                } else {
                    toast.success("Test configuration saved");
                }
            } else {
                const error = await response.json().catch(() => ({}));
                const detail = error.detail;
                if (Array.isArray(detail)) {
                    toast.error(detail[0]?.msg || "Failed to create test");
                } else if (typeof detail === 'object' && detail !== null) {
                    toast.error(detail.msg || JSON.stringify(detail));
                } else {
                    toast.error(detail || "Failed to create test");
                }
            }
        } catch (error) {
            console.error("Failed to create test:", error);
            toast.error("An unexpected error occurred");
        }
    };

    const handleUpdateTest = async (
        testConfig: any,
        shouldRun: boolean = true,
    ) => {
        if (!testToEdit) return;
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(
                `${API_URL}/api/v1/performance/tests/${testToEdit.id}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    body: JSON.stringify(testConfig),
                },
            );
            if (response.ok) {
                const test = await response.json();
                setShowWizard(false);
                setTestToEdit(null);
                fetchDashboardData();
                setRefreshTrigger((prev) => prev + 1);

                if (shouldRun) {
                    // Immediately trigger execution
                    const execResponse = await fetch(
                        `${API_URL}/api/v1/performance/tests/${test.id}/execute`,
                        {
                            method: "POST",
                            credentials: "include",
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                        },
                    );

                    if (execResponse.ok) {
                        toast.success("Test updated and started");
                        handleTestRunStarted(test.id, test.test_type);
                    } else {
                        toast.success("Test updated successfully");
                    }
                } else {
                    toast.success("Test configuration updated");
                }
            } else {
                const error = await response.json().catch(() => ({}));
                const detail = error.detail;
                if (Array.isArray(detail)) {
                    toast.error(detail[0]?.msg || "Failed to update test");
                } else if (typeof detail === 'object' && detail !== null) {
                    toast.error(detail.msg || JSON.stringify(detail));
                } else {
                    toast.error(detail || "Failed to update test");
                }
            }
        } catch (error) {
            console.error("Failed to update test:", error);
            toast.error("An unexpected error occurred");
        }
    };

    const handleTestRunStarted = async (testId: string, testType: string) => {
        setIsLoading(true);

        // Fetch actual test configuration to populate the form
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(
                `${API_URL}/api/v1/performance/tests/${testId}`,
                {
                    credentials: "include",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                },
            );

            if (response.ok) {
                const test = await response.json();

                // Populate the specific configuration states
                const url = test.target_url || "";
                const method = test.target_method || "GET";
                const stages = test.stages || (test.virtual_users ? [
                    {
                        duration: test.duration_seconds ? `${test.duration_seconds}s` : "1m",
                        target: test.virtual_users
                    }
                ] : []);

                if (testType === "load") {
                    setLoadTargetUrl(url);
                    setLoadTestConfig(prev => ({ ...prev, method }));
                    if (stages.length > 0) setLoadTestStages(stages);
                    setLoadTestType(test.stages ? "stages" : "simple");
                } else if (testType === "stress") {
                    setStressTargetUrl(url);
                    setStressTestMethod(method);
                    if (stages.length > 0) setStressTestStages(stages);
                } else if (testType === "spike") {
                    setSpikeTargetUrl(url);
                    setSpikeTestMethod(method);
                    if (stages.length > 0) setSpikeTestStages(stages);
                } else if (testType === "soak" || testType === "endurance") {
                    setSoakTargetUrl(url);
                    setSoakTestMethod(method);
                    if (stages.length > 0) setSoakTestStages(stages);
                }
            }
        } catch (error) {
            console.error("Failed to fetch test details for sync:", error);
        }

        if (testType === "lighthouse") setIsLighthouseLoading(true);
        else if (testType === "load") setIsLoadLoading(true);
        else if (testType === "stress") setIsStressLoading(true);
        else if (testType === "spike") setIsSpikeLoading(true);
        else if (testType === "soak" || testType === "endurance")
            setIsSoakLoading(true);

        setProgress(5);

        // Switch to the relevant tab to show results
        if (testType === "load") {
            setLoadTestResult(null);
            setActiveModule("load");
            pollTestStatus(testId);
        } else if (testType === "lighthouse") {
            setLighthouseResult(null);
            setActiveModule("lighthouse");
            pollTestStatus(testId);
        } else if (testType === "stress") {
            setLoadTestResult(null);
            setActiveModule("stress");
            pollTestStatus(testId); // Use same polling for stress
        } else if (testType === "spike") {
            setLoadTestResult(null);
            setActiveModule("spike");
            pollTestStatus(testId);
        } else if (testType === "soak" || testType === "endurance") {
            setLoadTestResult(null);
            setActiveModule("soak");
            pollTestStatus(testId);
        }
    };

    // Load test state
    const [loadTestConfig, setLoadTestConfig] = useState<{
        virtualUsers: number | string;
        duration: number | string;
        rampUp: number | string;
        rampDown: number | string;
        thinkTime: number | string;
        method?: "GET" | "POST" | "PUT" | "DELETE";
    }>({
        virtualUsers: "",
        duration: "",
        rampUp: "",
        rampDown: "",
        thinkTime: "",
        method: "GET",
    });
    const [loadTestType, setLoadTestType] = useState<"simple" | "stages">(
        "simple",
    );
    const [loadTestStages, setLoadTestStages] = useState<
        Array<{ duration: string; target: number }>
    >([{ duration: "1m", target: 50 }]);

    const [isRunningLoadTest, setIsRunningLoadTest] = useState(false);

    const handleLoadTest = async () => {
        if (!loadTargetUrl) return;
        setIsLoadLoading(true);
        setIsLoading(true);
        setIsRunningLoadTest(true);
        setLoadTestResult(null);
        setProgress(0);
        setRefreshTrigger((prev) => prev + 1); // Refresh saved tests list

        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(
                `${API_URL}/api/v1/performance/load-test?project_id=${projectId}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    body: JSON.stringify({
                        target_url: loadTargetUrl,
                        target_method: loadTestConfig.method || "GET",
                        target_headers: {},
                        virtual_users:
                            loadTestType === "simple"
                                ? Number(loadTestConfig.virtualUsers) || 50
                                : undefined,
                        duration_seconds:
                            loadTestType === "simple"
                                ? parseDuration(loadTestConfig.duration) || 60
                                : undefined,
                        ramp_up_seconds:
                            loadTestType === "simple"
                                ? parseDuration(loadTestConfig.rampUp) || 10
                                : undefined,
                        ramp_down_seconds:
                            loadTestType === "simple"
                                ? parseDuration(loadTestConfig.rampDown) || 10
                                : undefined,
                        think_time: parseDuration(loadTestConfig.thinkTime) || 0,
                        stages:
                            loadTestType === "stages"
                                ? loadTestStages.map((s) => ({
                                    duration: s.duration,
                                    target: Number(s.target),
                                }))
                                : undefined,
                    }),
                },
            );

            if (response.ok) {
                const data = await response.json();
                // Start polling instead of showing fake immediate result
                pollTestStatus(data.id);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("Load test failed:", response.statusText, errorData);

                // Extract meaningful error message
                let errorMessage = "Load test failed";
                if (errorData.detail) {
                    if (typeof errorData.detail === "string") {
                        errorMessage = errorData.detail;
                    } else if (Array.isArray(errorData.detail)) {
                        // Pydantic validation errors
                        errorMessage = errorData.detail
                            .map((err: any) => `${err.loc?.join(".") || "Field"}: ${err.msg}`)
                            .join(", ");
                    } else {
                        errorMessage = JSON.stringify(errorData.detail);
                    }
                }

                setIsLoading(false);
                toast.error(errorMessage);
            }
        } catch (error: any) {
            console.error("Load test failed:", error);
            setIsLoading(false);
            toast.error(error.message || "Failed to start load test");
        } finally {
            setIsRunningLoadTest(false);
        }
    };

    // Stress test state - K6 style stages
    const [stressTestStages, setStressTestStages] = useState<
        Array<{ duration: string; target: number }>
    >([
        { duration: "30s", target: 100 },
        { duration: "1m", target: 200 },
        { duration: "1m", target: 500 },
        { duration: "2m", target: 500 },
        { duration: "30s", target: 0 },
    ]);
    const [stressTestMethod, setStressTestMethod] = useState<string>("GET");
    const [isRunningStressTest, setIsRunningStressTest] = useState(false);

    const handleStressTest = async () => {
        if (!stressTargetUrl) return;
        setIsStressLoading(true);
        setIsLoading(true);
        setIsRunningStressTest(true);
        setLoadTestResult(null);
        setProgress(0);

        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(
                `${API_URL}/api/v1/performance/stress-test?project_id=${projectId}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    body: JSON.stringify({
                        target_url: stressTargetUrl,
                        target_method: stressTestMethod,
                        target_headers: {},
                        stages: stressTestStages.map((s) => ({
                            duration: s.duration,
                            target: Number(s.target),
                        })),
                    }),
                },
            );

            if (response.ok) {
                const data = await response.json();
                pollTestStatus(data.id);
            } else {
                setIsLoading(false);
                toast.error("Failed to start stress test");
            }
        } catch (error: any) {
            console.error("Stress test failed:", error);
            setIsLoading(false);
            toast.error(error.message || "Failed to start stress test");
        } finally {
            setIsRunningStressTest(false);
        }
    };

    // Spike test state - K6 style stages
    const [spikeTestStages, setSpikeTestStages] = useState<
        Array<{ duration: string; target: number }>
    >([
        { duration: "1m", target: 50 },
        { duration: "10s", target: 1000 },
        { duration: "2m", target: 1000 },
        { duration: "10s", target: 50 },
        { duration: "1m", target: 50 },
    ]);
    const [spikeTestMethod, setSpikeTestMethod] = useState<string>("GET");
    const [isRunningSpikeTest, setIsRunningSpikeTest] = useState(false);

    const handleSpikeTest = async () => {
        if (!spikeTargetUrl) return;
        setIsSpikeLoading(true);
        setIsLoading(true);
        setIsRunningSpikeTest(true);
        setProgress(0);

        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(
                `${API_URL}/api/v1/performance/spike-test?project_id=${projectId}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    body: JSON.stringify({
                        target_url: spikeTargetUrl,
                        target_method: spikeTestMethod,
                        target_headers: {},
                        stages: spikeTestStages.map((s) => ({
                            duration: s.duration,
                            target: Number(s.target),
                        })),
                    }),
                },
            );

            if (response.ok) {
                const data = await response.json();
                pollTestStatus(data.id);
            } else {
                setIsLoading(false);
                toast.error("Failed to start spike test");
            }
        } catch (error: any) {
            console.error("Spike test failed:", error);
            setIsLoading(false);
            toast.error(error.message || "Failed to start spike test");
        } finally {
            setIsRunningSpikeTest(false);
        }
    };

    // Soak test state - K6 style stages
    const [soakTestStages, setSoakTestStages] = useState<
        Array<{ duration: string; target: number }>
    >([
        { duration: "5m", target: 100 },
        { duration: "4h", target: 100 },
        { duration: "5m", target: 0 },
    ]);
    const [soakTestMethod, setSoakTestMethod] = useState<string>("GET");
    const [isRunningSoakTest, setIsRunningSoakTest] = useState(false);

    const handleSoakTest = async () => {
        if (!soakTargetUrl) return;
        setIsSoakLoading(true);
        setIsLoading(true);
        setIsRunningSoakTest(true);
        setProgress(0);

        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(
                `${API_URL}/api/v1/performance/soak-test?project_id=${projectId}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    body: JSON.stringify({
                        target_url: soakTargetUrl,
                        target_method: soakTestMethod,
                        target_headers: {},
                        stages: soakTestStages.map((s) => ({
                            duration: s.duration,
                            target: Number(s.target),
                        })),
                    }),
                },
            );

            if (response.ok) {
                const data = await response.json();
                pollTestStatus(data.id);
            } else {
                setIsLoading(false);
                toast.error("Failed to start soak test");
            }
        } catch (error: any) {
            console.error("Soak test failed:", error);
            setIsLoading(false);
            toast.error(error.message || "Failed to start soak test");
        } finally {
            setIsRunningSoakTest(false);
        }
    };

    const handleTestExecutionComplete = async (testId: string) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(
                `${API_URL}/api/v1/performance/tests/${testId}`,
                {
                    method: "GET",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    credentials: "include",
                },
            );

            if (response.ok) {
                const test = await response.json();
                const metrics = test.metrics || {};

                // Update stats
                fetchDashboardData();

                if (test.test_type === "lighthouse" || test.test_type === "pagespeed") {
                    setLighthouseResult({
                        performance: metrics.performance_score || 0,
                        accessibility: metrics.accessibility_score || 0,
                        bestPractices: metrics.best_practices_score || 0,
                        seo: metrics.seo_score || 0,
                        lcp: metrics.largest_contentful_paint || 0,
                        fid: metrics.first_input_delay || 0,
                        cls: metrics.cumulative_layout_shift || 0,
                        fcp: metrics.first_contentful_paint || 0,
                        ttfb: metrics.time_to_first_byte || 0,
                        opportunities: metrics.opportunities || [],
                        diagnostics: metrics.diagnostics || [],
                        raw_response: metrics.raw_response,
                    });
                    setLhTargetUrl(test.target_url);
                    setSelectedHistoryId(testId);
                    setActiveModule("lighthouse");
                    fetchLighthouseHistory();
                } else if (
                    ["load", "stress", "spike", "endurance", "soak"].includes(
                        test.test_type,
                    )
                ) {
                    setLoadTestResult({
                        type: test.test_type,
                        p50: metrics.latency_p50,
                        p75: metrics.latency_p75,
                        p90: metrics.latency_p90,
                        p95: metrics.latency_p95,
                        p99: metrics.latency_p99,
                        max: metrics.latency_max,
                        timeline:
                            metrics.rps_timeline?.map((p: any, idx: number) => ({
                                timestamp: p.timestamp,
                                rps: p.value,
                                latency: metrics.latency_timeline?.[idx]?.value || 0,
                                errors: metrics.errors_timeline?.[idx]?.value || 0,
                            })) || [],
                        vuTimeline: metrics.virtual_users_timeline
                            ? metrics.virtual_users_timeline.map((p: any) => ({
                                timestamp: p.timestamp || "0s",
                                activeVUs: typeof p.value === "number" ? p.value : p.vus || 0,
                                targetVUs: test.virtual_users || 50,
                            }))
                            : [],
                        totalRequests: metrics.total_requests_made,
                        successRate: 100 - (metrics.error_rate || 0),
                        avgRps: metrics.requests_per_second,
                    });

                    // Map test type to module
                    let moduleName = "load";
                    if (test.test_type === "stress") {
                        moduleName = "stress";
                        setStressTargetUrl(test.target_url);
                    } else if (test.test_type === "spike") {
                        moduleName = "spike";
                        setSpikeTargetUrl(test.target_url);
                    } else if (
                        test.test_type === "endurance" ||
                        test.test_type === "soak"
                    ) {
                        moduleName = "soak";
                        setSoakTargetUrl(test.target_url);
                    } else {
                        setLoadTargetUrl(test.target_url);
                    }

                    setActiveModule(moduleName as any);
                } else {
                    setActiveModule("results");
                }
            }
        } catch (error) {
            console.error("Failed to fetch test details:", error);
        }
    };

    const loadLighthouseReport = async (testId: string) => {
        setIsLoading(true);
        setIsLighthouseLoading(true);
        setSelectedHistoryId(testId);
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(
                `${API_URL}/api/v1/performance/tests/${testId}`,
                {
                    method: "GET",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    credentials: "include",
                },
            );

            if (response.ok) {
                const test = await response.json();
                console.log("Test details response:", test);
                const metrics = test.metrics || {};
                console.log("Metric raw_response:", metrics.raw_response);

                setLighthouseResult({
                    performance: metrics.performance_score || 0,
                    accessibility: metrics.accessibility_score || 0,
                    bestPractices: metrics.best_practices_score || 0,
                    seo: metrics.seo_score || 0,
                    lcp: metrics.largest_contentful_paint || 0,
                    fid: metrics.first_input_delay || 0,
                    cls: metrics.cumulative_layout_shift || 0,
                    fcp: metrics.first_contentful_paint || 0,
                    ttfb: metrics.time_to_first_byte || 0,
                    opportunities: metrics.opportunities || [],
                    diagnostics: metrics.diagnostics || [],
                    raw_response: metrics.raw_response,
                });
                setLhTargetUrl(test.target_url);
                if (test.device_type) setLhDevice(test.device_type);
                if (test.audit_mode) setLhMode(test.audit_mode as any);

                if (test.categories) {
                    const cats =
                        typeof test.categories === "string"
                            ? JSON.parse(test.categories)
                            : test.categories;
                    if (Array.isArray(cats)) {
                        const newCats: any = {
                            performance: cats.includes("performance"),
                            accessibility: cats.includes("accessibility"),
                            bestPractices:
                                cats.includes("best-practices") ||
                                cats.includes("bestPractices"),
                            seo: cats.includes("seo"),
                        };
                        setLhCategories(newCats);
                    } else if (typeof cats === "object") {
                        setLhCategories({
                            performance: !!cats.performance,
                            accessibility: !!cats.accessibility,
                            bestPractices: !!(cats.bestPractices || cats["best-practices"]),
                            seo: !!cats.seo,
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load lighthouse report:", error);
        } finally {
            setIsLoading(false);
            setIsLighthouseLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Top Bar with Logo and Profile */}
            <div className="border-b border-gray-200 bg-white">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CircuitLogoIcon className="w-8 h-8" />
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                            Cogni<span className="text-primary">Test</span>
                        </h1>
                    </div>
                    <UserNav />
                </div>
            </div>

            {/* Breadcrumbs Bar */}
            <div className="px-6 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                    <button
                        onClick={() =>
                            router.push(`/organizations/${uuid}/projects/${projectId}`)
                        }
                        className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5"
                    >
                        <Home className="w-4 h-4" />
                        <span>Home</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-semibold">
                        Performance Testing
                    </span>
                </div>
            </div>

            {/* Horizontal Tab Navigation */}
            <div className="border-b border-gray-300 bg-gradient-to-r from-slate-50 via-gray-50 to-stone-50">
                <div className="px-6 py-3 flex items-center gap-4 overflow-x-auto">
                    <button
                        onClick={() => setActiveModule("overview")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === "overview"
                            ? "text-primary bg-white border-b-2 border-primary shadow-sm"
                            : "text-gray-600 hover:text-primary hover:bg-white/50"
                            }`}
                    >
                        <Gauge className="w-4 h-4" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveModule("tests")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === "tests"
                            ? "text-primary bg-white border-b-2 border-primary shadow-sm"
                            : "text-gray-600 hover:text-primary hover:bg-white/50"
                            }`}
                    >
                        <List className="w-4 h-4" />
                        Saved Tests
                    </button>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setActiveModule("lighthouse")}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === "lighthouse"
                                        ? "text-primary bg-white border-b-2 border-primary shadow-sm"
                                        : "text-gray-600 hover:text-primary hover:bg-white/50"
                                        }`}
                                >
                                    <Zap className="w-4 h-4" />
                                    Lighthouse
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Checks how fast a webpage loads and how good the user
                                    experience is.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setActiveModule("load")}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === "load"
                                        ? "text-primary bg-white border-b-2 border-primary shadow-sm"
                                        : "text-gray-600 hover:text-primary hover:bg-white/50"
                                        }`}
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    Load Test
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Tests how the system performs when many users use it at the
                                    same time.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setActiveModule("stress")}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === "stress"
                                        ? "text-primary bg-white border-b-2 border-primary shadow-sm"
                                        : "text-gray-600 hover:text-primary hover:bg-white/50"
                                        }`}
                                >
                                    <Activity className="w-4 h-4" />
                                    Stress Test
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Tests how much load the system can handle before it starts to
                                    fail.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setActiveModule("spike")}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === "spike"
                                        ? "text-primary bg-white border-b-2 border-primary shadow-sm"
                                        : "text-gray-600 hover:text-primary hover:bg-white/50"
                                        }`}
                                >
                                    <Zap className="w-4 h-4" />
                                    Spike Test
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Tests how the system reacts when traffic suddenly increases.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setActiveModule("soak")}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === "soak"
                                        ? "text-primary bg-white border-b-2 border-primary shadow-sm"
                                        : "text-gray-600 hover:text-primary hover:bg-white/50"
                                        }`}
                                >
                                    <Clock className="w-4 h-4" />
                                    Soak Test
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Tests how the system performs over a long time to find
                                    slowdowns or memory issues.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <button
                        onClick={() => setActiveModule("results")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${activeModule === "results"
                            ? "text-primary bg-white border-b-2 border-primary shadow-sm"
                            : "text-gray-600 hover:text-primary hover:bg-white/50"
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Results
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto px-6 py-6">
                {/* Overview Tab */}
                {activeModule === "overview" && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Performance Score
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">
                                            {stats.avg_performance_score !== null
                                                ? stats.avg_performance_score
                                                : "—"}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Average score</p>
                                    </div>
                                    <Gauge className="w-10 h-10 text-teal-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Total Tests
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">
                                            {stats.total_tests}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Run your first test
                                        </p>
                                    </div>
                                    <TrendingUp className="w-10 h-10 text-purple-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Pass Rate
                                        </p>
                                        <p className="text-3xl font-bold text-green-600 mt-1">
                                            {stats.pass_rate}%
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Thresholds met</p>
                                    </div>
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-6 border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Active Alerts
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">
                                            {stats.active_alerts}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">No alerts</p>
                                    </div>
                                    <AlertTriangle className="w-10 h-10 text-orange-500" />
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div
                                className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-teal-300 transition-colors"
                                onClick={() => setActiveModule("lighthouse")}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            Lighthouse Audit
                                        </h3>
                                        <p className="text-sm text-gray-500">Core Web Vitals</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-purple-300 transition-colors"
                                onClick={() => setActiveModule("load")}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Load Test</h3>
                                        <p className="text-sm text-gray-500">Concurrent users</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-orange-300 transition-colors"
                                onClick={() => setActiveModule("stress")}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <Activity className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Stress Test</h3>
                                        <p className="text-sm text-gray-500">Find breaking point</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-red-300 transition-colors"
                                onClick={() => setActiveModule("spike")}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Spike Test</h3>
                                        <p className="text-sm text-gray-500">Test sudden bursts</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
                                onClick={() => setActiveModule("soak")}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Soak Test</h3>
                                        <p className="text-sm text-gray-500">
                                            Long duration monitoring
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
                                onClick={() => setActiveModule("results")}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <BarChart3 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            View Results
                                        </h3>
                                        <p className="text-sm text-gray-500">Historical data</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Get Started Banner */}
                        <div className="bg-gradient-to-r from-brand-700 to-brand-600 rounded-xl p-8 text-white shadow-lg">
                            <h2 className="text-2xl font-bold mb-2">
                                Enterprise Performance Testing
                            </h2>
                            <p className="text-teal-50 mb-4 max-w-2xl">
                                Outperform JMeter, k6, and BlazeMeter with AI-powered
                                performance testing, beautiful dashboards, and zero
                                configuration.
                            </p>
                            <div className="flex gap-4">
                                <Button
                                    className="bg-white bg-none text-brand-700 hover:bg-gray-50 border-0 shadow-md"
                                    onClick={() => setActiveModule("lighthouse")}
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Run Lighthouse Audit
                                </Button>
                                <Button
                                    variant="outline"
                                    className="bg-transparent border-white text-white hover:bg-white/10 hover:text-white"
                                    onClick={() => setActiveModule("load")}
                                >
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Start Load Test
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tests Tab */}
                {activeModule === "tests" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Performance Tests
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Manage and run your saved test configurations
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowWizard(true)}
                                className="bg-teal-600 hover:bg-teal-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Test
                            </Button>
                        </div>

                        <PerformanceTestList
                            projectId={projectId}
                            refreshTrigger={refreshTrigger}
                            onTestExecuted={handleTestRunStarted}
                            onEditTest={async (test) => {
                                // Fetch actual test configuration to ensure full sync in Wizard
                                try {
                                    const token = localStorage.getItem("access_token");
                                    const response = await fetch(
                                        `${API_URL}/api/v1/performance/tests/${test.id || test.uuid}`,
                                        {
                                            credentials: "include",
                                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                                        },
                                    );

                                    if (response.ok) {
                                        const fullTest = await response.json();
                                        setTestToEdit(fullTest);
                                    } else {
                                        setTestToEdit(test);
                                    }
                                } catch (error) {
                                    console.error("Failed to fetch test details for wizard:", error);
                                    setTestToEdit(test);
                                }
                                setShowWizard(true);
                            }}
                        />
                    </div>
                )}

                {/* Lighthouse Tab */}
                {activeModule === "lighthouse" && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Lighthouse Audit
                            </h2>
                            <p className="text-sm text-gray-500">
                                Checks how fast a webpage loads and how good the user experience
                                is.
                            </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 border shadow-lg shadow-teal-500/5 border-teal-50/50">
                            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 leading-none">
                                        Configure Lighthouse Audit
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Full performance, accessibility, and SEO analysis
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    {/* URL Input */}
                                    <div className="md:col-span-12">
                                        <Label
                                            htmlFor="lighthouse-url"
                                            className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block"
                                        >
                                            Target URL
                                        </Label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Globe className="h-4 w-4 text-gray-500 group-focus-within:text-teal-600 transition-colors" />
                                            </div>
                                            <Input
                                                id="lighthouse-url"
                                                placeholder="https://example.com"
                                                value={lhTargetUrl}
                                                onChange={(e) => setLhTargetUrl(e.target.value)}
                                                className="pl-10 h-12 text-base font-medium bg-white border-2 border-gray-300 focus:bg-white focus:border-teal-700 focus:ring-teal-700/10 transition-all rounded-xl shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-12 pt-6 border-t border-gray-100">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-4 block">
                                            Select Audit Mode
                                        </Label>
                                        <RadioGroup
                                            defaultValue="navigation"
                                            value={lhMode}
                                            onValueChange={(val: any) => setLhMode(val)}
                                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                        >
                                            <div
                                                className={cn(
                                                    "flex items-start space-x-3 p-4 rounded-2xl border transition-all cursor-pointer",
                                                    lhMode === "navigation"
                                                        ? "bg-teal-50/50 border-teal-200 shadow-sm"
                                                        : "bg-white border-gray-200 hover:border-gray-300",
                                                )}
                                            >
                                                <RadioGroupItem
                                                    value="navigation"
                                                    id="mode-nav"
                                                    className="mt-1"
                                                />
                                                <Label htmlFor="mode-nav" className="cursor-pointer">
                                                    <span className="text-sm font-bold text-gray-900 block">
                                                        Navigation
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium block mt-1">
                                                        Full page load analysis (standard)
                                                    </span>
                                                </Label>
                                            </div>
                                            <div
                                                className={cn(
                                                    "flex items-start space-x-3 p-4 rounded-2xl border transition-all cursor-pointer",
                                                    lhMode === "timespan"
                                                        ? "bg-teal-50/50 border-teal-200 shadow-sm"
                                                        : "bg-white border-gray-200 hover:border-gray-300",
                                                )}
                                            >
                                                <RadioGroupItem
                                                    value="timespan"
                                                    id="mode-time"
                                                    className="mt-1"
                                                />
                                                <Label htmlFor="mode-time" className="cursor-pointer">
                                                    <span className="text-sm font-bold text-gray-900 block">
                                                        Timespan
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium block mt-1">
                                                        Capturing interactions over time
                                                    </span>
                                                </Label>
                                            </div>
                                            <div
                                                className={cn(
                                                    "flex items-start space-x-3 p-4 rounded-2xl border transition-all cursor-pointer",
                                                    lhMode === "snapshot"
                                                        ? "bg-teal-50/50 border-teal-200 shadow-sm"
                                                        : "bg-white border-gray-200 hover:border-gray-300",
                                                )}
                                            >
                                                <RadioGroupItem
                                                    value="snapshot"
                                                    id="mode-snap"
                                                    className="mt-1"
                                                />
                                                <Label htmlFor="mode-snap" className="cursor-pointer">
                                                    <span className="text-sm font-bold text-gray-900 block">
                                                        Snapshot
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium block mt-1">
                                                        Analyze current application state
                                                    </span>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="md:col-span-12 bg-gray-50 p-4 rounded-2xl border border-gray-300">
                                        <Label className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-3 block">
                                            Device Profile
                                        </Label>
                                        <RadioGroup
                                            defaultValue="mobile"
                                            value={lhDevice}
                                            onValueChange={(val: any) => setLhDevice(val)}
                                            className="flex items-center gap-6"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="mobile" id="lh-mobile" />
                                                <Label
                                                    htmlFor="lh-mobile"
                                                    className="text-sm font-bold text-gray-700 cursor-pointer"
                                                >
                                                    Mobile
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="desktop" id="lh-desktop" />
                                                <Label
                                                    htmlFor="lh-desktop"
                                                    className="text-sm font-bold text-gray-700 cursor-pointer"
                                                >
                                                    Desktop
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="md:col-span-12 pt-6 border-t border-gray-100">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-4 block">
                                            Audit Categories
                                        </Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-teal-200 transition-all">
                                                <Checkbox
                                                    id="cat-perf"
                                                    checked={lhCategories.performance}
                                                    onCheckedChange={(checked) =>
                                                        setLhCategories((prev) => ({
                                                            ...prev,
                                                            performance: checked,
                                                        }))
                                                    }
                                                />
                                                <Label
                                                    htmlFor="cat-perf"
                                                    className="text-xs font-bold text-gray-700 cursor-pointer"
                                                >
                                                    Performance
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-teal-200 transition-all">
                                                <Checkbox
                                                    id="cat-acc"
                                                    checked={lhCategories.accessibility}
                                                    onCheckedChange={(checked) =>
                                                        setLhCategories((prev) => ({
                                                            ...prev,
                                                            accessibility: checked,
                                                        }))
                                                    }
                                                />
                                                <Label
                                                    htmlFor="cat-acc"
                                                    className="text-xs font-bold text-gray-700 cursor-pointer"
                                                >
                                                    Accessibility
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-teal-200 transition-all">
                                                <Checkbox
                                                    id="cat-best"
                                                    checked={lhCategories.bestPractices}
                                                    onCheckedChange={(checked) =>
                                                        setLhCategories((prev) => ({
                                                            ...prev,
                                                            bestPractices: checked,
                                                        }))
                                                    }
                                                />
                                                <Label
                                                    htmlFor="cat-best"
                                                    className="text-xs font-bold text-gray-700 cursor-pointer"
                                                >
                                                    Best Practices
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-teal-200 transition-all">
                                                <Checkbox
                                                    id="cat-seo"
                                                    checked={lhCategories.seo}
                                                    onCheckedChange={(checked) =>
                                                        setLhCategories((prev) => ({
                                                            ...prev,
                                                            seo: checked,
                                                        }))
                                                    }
                                                />
                                                <Label
                                                    htmlFor="cat-seo"
                                                    className="text-xs font-bold text-gray-700 cursor-pointer"
                                                >
                                                    SEO
                                                </Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-12 pt-8">
                                        <Button
                                            className="h-14 w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl shadow-lg shadow-teal-600/20 font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] group relative overflow-hidden"
                                            onClick={handleLighthouseScan}
                                            disabled={isLighthouseLoading || !lhTargetUrl}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-teal-700 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="relative z-10 flex items-center justify-center">
                                                {isLighthouseLoading ? (
                                                    <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                                                ) : (
                                                    <Play className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                                                )}
                                                {isLighthouseLoading
                                                    ? "ANALYZING..."
                                                    : lhMode === "navigation"
                                                        ? "INITIATE PAGE AUDIT"
                                                        : lhMode === "timespan"
                                                            ? "START TIMESPAN"
                                                            : "ANALYZE PAGE STATE"}
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Core Web Vitals Explanation (Moved inside main content if needed, but keeping it here for now) */}

                        {/* Results or Placeholder with History Sidebar */}
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* History Sidebar */}
                            {lighthouseHistory.length > 0 && (
                                <div className="w-full md:w-64 flex-shrink-0">
                                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full sticky top-6">
                                        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                <HistoryIcon className="w-4 h-4 text-teal-600" />
                                                Audit History
                                            </h3>
                                            <span className="text-[10px] text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full font-medium">
                                                {lighthouseHistory.length}
                                            </span>
                                        </div>
                                        <div className="overflow-y-auto max-h-[800px] divide-y divide-gray-100">
                                            {lighthouseHistory.map((item) => {
                                                const date = new Date(item.created_at);
                                                const isSelected = selectedHistoryId === item.id;
                                                let hostname = "Unknown";
                                                try {
                                                    hostname = new URL(item.target_url).hostname;
                                                } catch (e) {
                                                    hostname = item.target_url;
                                                }

                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => loadLighthouseReport(item.id)}
                                                        className={cn(
                                                            "w-full text-left p-3 hover:bg-gray-50 transition-all flex flex-col gap-1 border-l-4",
                                                            isSelected
                                                                ? "bg-teal-50 border-l-teal-600"
                                                                : "border-l-transparent",
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "text-xs font-semibold truncate",
                                                                isSelected ? "text-teal-700" : "text-gray-900",
                                                            )}
                                                        >
                                                            {item.name || hostname}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 flex items-center justify-between">
                                                            <span>
                                                                {date.toLocaleDateString([], {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                })}
                                                            </span>
                                                            <span className="font-mono">
                                                                {date.toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Main Results Area */}
                            <div className="flex-1 min-w-0">
                                {lighthouseResult ? (
                                    <LighthouseReport data={lighthouseResult.raw_response} />
                                ) : (
                                    <div className="bg-white rounded-xl p-12 border shadow-sm text-center">
                                        <Zap className="w-20 h-20 text-teal-100 mx-auto mb-6" />
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            Run Your First Audit
                                        </h3>
                                        <p className="text-gray-500 max-w-sm mx-auto mb-8">
                                            Enter a URL above and click "Analyze" to see performance,
                                            accessibility, best practices, and SEO scores.
                                        </p>
                                        {!isLighthouseLoading && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-8 pt-8 border-t">
                                                <div className="text-center">
                                                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3">
                                                        <TrendingUp className="w-5 h-5 text-teal-600" />
                                                    </div>
                                                    <h4 className="text-xs font-bold text-gray-900">
                                                        Performance
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        Optimize speed and responsiveness
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                                                        <Shield className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <h4 className="text-xs font-bold text-gray-900">
                                                        Accessibility
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        Ensure site works for everyone
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
                                                        <Globe className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <h4 className="text-xs font-bold text-gray-900">
                                                        SEO
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        Improve search engine ranking
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isLighthouseLoading && !lighthouseResult && (
                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <RefreshCw className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-spin" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    Running Audit...
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Analyzing performance for {lhTargetUrl}
                                </p>
                                <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div
                                        className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-400 mt-2">
                                    {progress}% completed
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Load Test Tab */}
                {activeModule === "load" && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Load Testing
                            </h2>
                            <p className="text-sm text-gray-500">
                                Simulate concurrent users and measure performance under load
                            </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 border shadow-lg shadow-purple-500/5 border-purple-50/50">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-none">
                                            Configure Load Test
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Simulate concurrent users and measure performance
                                        </p>
                                    </div>
                                </div>
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => setLoadTestType("simple")}
                                        className={cn(
                                            "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                                            loadTestType === "simple"
                                                ? "bg-white text-purple-600 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700",
                                        )}
                                    >
                                        SIMPLE
                                    </button>
                                    <button
                                        onClick={() => setLoadTestType("stages")}
                                        className={cn(
                                            "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                                            loadTestType === "stages"
                                                ? "bg-white text-purple-600 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700",
                                        )}
                                    >
                                        STAGES
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        {/* URL Input */}
                                        <div className="md:col-span-12">
                                            <Label
                                                htmlFor="load-url"
                                                className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block"
                                            >
                                                Target URL
                                            </Label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Globe className="h-4 w-4 text-gray-500 group-focus-within:text-purple-600 transition-colors" />
                                                </div>
                                                <Input
                                                    id="load-url"
                                                    value={loadTargetUrl}
                                                    onChange={(e) => setLoadTargetUrl(e.target.value)}
                                                    placeholder="https://api.example.com/endpoint"
                                                    className="pl-10 h-12 text-base font-medium bg-white border-2 border-gray-300 focus:bg-white focus:border-purple-700 focus:ring-purple-700/10 transition-all rounded-xl shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-12 border-t border-gray-100 pt-6">
                                            {loadTestType === "simple" ? (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                            Method
                                                        </Label>
                                                        <Select
                                                            defaultValue="GET"
                                                            value={loadTestConfig.method || "GET"}
                                                            onValueChange={(val) =>
                                                                setLoadTestConfig((prev) => ({
                                                                    ...prev,
                                                                    method: val as any,
                                                                }))
                                                            }
                                                        >
                                                            <SelectTrigger className="h-12 rounded-xl bg-white border-2 border-gray-300 shadow-sm text-sm font-medium">
                                                                {loadTestConfig.method || "GET"}
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="GET">
                                                                    <span className="font-bold text-xs text-emerald-600">
                                                                        GET
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="POST">
                                                                    <span className="font-bold text-xs text-blue-600">
                                                                        POST
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="PUT">
                                                                    <span className="font-bold text-xs text-amber-600">
                                                                        PUT
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="DELETE">
                                                                    <span className="font-bold text-xs text-red-600">
                                                                        DELETE
                                                                    </span>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div>
                                                        <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                            Virtual Users
                                                        </Label>
                                                        <div className="relative">
                                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            <Input
                                                                type="number"
                                                                value={loadTestConfig.virtualUsers}
                                                                onChange={(e) =>
                                                                    setLoadTestConfig((prev) => ({
                                                                        ...prev,
                                                                        virtualUsers:
                                                                            e.target.value === ""
                                                                                ? ""
                                                                                : parseInt(e.target.value),
                                                                    }))
                                                                }
                                                                className={cn(
                                                                    "pl-10 h-12 text-sm font-medium bg-white border-2 border-gray-300 rounded-xl shadow-sm",
                                                                    (Number(loadTestConfig.virtualUsers) > 10000 ||
                                                                        Number(loadTestConfig.virtualUsers) < 1) &&
                                                                        loadTestConfig.virtualUsers !== ""
                                                                        ? "border-red-500 focus-visible:ring-red-500"
                                                                        : "",
                                                                )}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                            Duration
                                                        </Label>
                                                        <div className="relative">
                                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            <Input
                                                                type="text"
                                                                value={loadTestConfig.duration}
                                                                onChange={(e) =>
                                                                    setLoadTestConfig((prev) => ({
                                                                        ...prev,
                                                                        duration: e.target.value,
                                                                    }))
                                                                }
                                                                className={cn(
                                                                    "pl-10 h-12 text-sm font-medium bg-white border-2 border-gray-300 rounded-xl shadow-sm",
                                                                    (parseDuration(loadTestConfig.duration) >
                                                                        3600 ||
                                                                        parseDuration(loadTestConfig.duration) <
                                                                        1) &&
                                                                        loadTestConfig.duration !== ""
                                                                        ? "border-red-500 focus-visible:ring-red-500"
                                                                        : "",
                                                                )}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* Method dropdown for stages mode */}
                                                    <div className="mb-4">
                                                        <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                            Method
                                                        </Label>
                                                        <Select
                                                            defaultValue="GET"
                                                            value={loadTestConfig.method || "GET"}
                                                            onValueChange={(val) =>
                                                                setLoadTestConfig((prev) => ({
                                                                    ...prev,
                                                                    method: val as any,
                                                                }))
                                                            }
                                                        >
                                                            <SelectTrigger className="h-12 w-full md:w-48 rounded-xl bg-white border-2 border-gray-300 shadow-sm text-sm font-medium">
                                                                {loadTestConfig.method || "GET"}
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="GET">
                                                                    <span className="font-bold text-xs text-emerald-600">
                                                                        GET
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="POST">
                                                                    <span className="font-bold text-xs text-blue-600">
                                                                        POST
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="PUT">
                                                                    <span className="font-bold text-xs text-amber-600">
                                                                        PUT
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="DELETE">
                                                                    <span className="font-bold text-xs text-red-600">
                                                                        DELETE
                                                                    </span>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="flex items-center justify-between mb-2">
                                                        <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                                                            Stages
                                                        </Label>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setLoadTestStages([
                                                                    ...loadTestStages,
                                                                    { duration: "1m", target: 50 },
                                                                ])
                                                            }
                                                            className="h-8 px-3 rounded-lg border-purple-200 text-purple-600 hover:bg-purple-50 text-[10px] font-bold"
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" /> ADD STAGE
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-3 pr-[44px] mb-2 px-3">
                                                        <div className="w-6 shrink-0" />
                                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Duration</div>
                                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Target VUs</div>
                                                        </div>
                                                    </div>
                                                    <div className="max-h-[200px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                                        {loadTestStages.map((stage, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group"
                                                            >
                                                                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                                    {index + 1}
                                                                </div>
                                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                                    <div className="relative">
                                                                        <Timer className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                                        <Input
                                                                            value={stage.duration}
                                                                            onChange={(e) => {
                                                                                const newStages = [...loadTestStages];
                                                                                newStages[index].duration =
                                                                                    e.target.value;
                                                                                setLoadTestStages(newStages);
                                                                            }}
                                                                            className="pl-8 h-10 text-xs font-medium bg-white border-gray-200 rounded-lg"
                                                                            placeholder="Duration (e.g. 1m)"
                                                                        />
                                                                    </div>
                                                                    <div className="relative">
                                                                        <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                                        <Input
                                                                            type="number"
                                                                            value={stage.target}
                                                                            onChange={(e) => {
                                                                                const newStages = [...loadTestStages];
                                                                                newStages[index].target =
                                                                                    parseInt(e.target.value) || 0;
                                                                                setLoadTestStages(newStages);
                                                                            }}
                                                                            className="pl-8 h-10 text-xs font-medium bg-white border-gray-200 rounded-lg"
                                                                            placeholder="Target VUs"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        setLoadTestStages(
                                                                            loadTestStages.filter(
                                                                                (_, i) => i !== index,
                                                                            ),
                                                                        )
                                                                    }
                                                                    className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {loadTestType === "simple" && (
                                            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                                                <div>
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                        Ramp Up
                                                    </Label>
                                                    <div className="relative">
                                                        <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <Input
                                                            type="text"
                                                            value={loadTestConfig.rampUp}
                                                            onChange={(e) =>
                                                                setLoadTestConfig((prev) => ({
                                                                    ...prev,
                                                                    rampUp: e.target.value,
                                                                }))
                                                            }
                                                            className={cn(
                                                                "pl-10 h-12 text-sm font-medium bg-white border-2 border-gray-300 rounded-xl shadow-sm",
                                                                (parseDuration(loadTestConfig.rampUp) > 300 ||
                                                                    parseDuration(loadTestConfig.rampUp) < 0) &&
                                                                    loadTestConfig.rampUp !== ""
                                                                    ? "border-red-500 focus-visible:ring-red-500"
                                                                    : "",
                                                            )}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                                {showAdvancedLoad && (
                                                    <>
                                                        <div>
                                                            <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                                Ramp Down
                                                            </Label>
                                                            <div className="relative">
                                                                <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                <Input
                                                                    type="text"
                                                                    value={loadTestConfig.rampDown}
                                                                    onChange={(e) =>
                                                                        setLoadTestConfig((prev) => ({
                                                                            ...prev,
                                                                            rampDown: e.target.value,
                                                                        }))
                                                                    }
                                                                    className={cn(
                                                                        "pl-10 h-12 text-sm font-medium bg-white border-2 border-gray-300 rounded-xl shadow-sm",
                                                                        (parseDuration(loadTestConfig.rampDown) >
                                                                            300 ||
                                                                            parseDuration(loadTestConfig.rampDown) <
                                                                            0) &&
                                                                            loadTestConfig.rampDown !== ""
                                                                            ? "border-red-500 focus-visible:ring-red-500"
                                                                            : "",
                                                                    )}
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-2 block">
                                                                Think Time
                                                            </Label>
                                                            <div className="relative">
                                                                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                <Input
                                                                    type="text"
                                                                    value={loadTestConfig.thinkTime}
                                                                    onChange={(e) =>
                                                                        setLoadTestConfig((prev) => ({
                                                                            ...prev,
                                                                            thinkTime: e.target.value,
                                                                        }))
                                                                    }
                                                                    className={cn(
                                                                        "pl-10 h-12 text-sm font-medium bg-white border-2 border-gray-300 rounded-xl shadow-sm",
                                                                        (parseDuration(loadTestConfig.thinkTime) >
                                                                            60 ||
                                                                            parseDuration(loadTestConfig.thinkTime) <
                                                                            0) &&
                                                                            loadTestConfig.thinkTime !== ""
                                                                            ? "border-red-500 focus-visible:ring-red-500"
                                                                            : "",
                                                                    )}
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                                <div className="flex items-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setShowAdvancedLoad(!showAdvancedLoad)
                                                        }
                                                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 w-full hover:text-purple-600 hover:bg-purple-50 transition-all rounded-xl border border-dashed border-gray-200 h-12"
                                                    >
                                                        {showAdvancedLoad
                                                            ? "HIDE OPTIONS"
                                                            : "SHOW ADVANCED"}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="md:col-span-12 pt-8">
                                            <Button
                                                onClick={handleLoadTest}
                                                disabled={
                                                    !loadTargetUrl ||
                                                    isLoadLoading ||
                                                    (loadTestType === "simple" &&
                                                        (Number(loadTestConfig.virtualUsers) < 1 ||
                                                            Number(loadTestConfig.virtualUsers) > 10000 ||
                                                            parseDuration(loadTestConfig.duration) < 1 ||
                                                            parseDuration(loadTestConfig.duration) > 3600)) ||
                                                    (loadTestType === "stages" &&
                                                        loadTestStages.length === 0)
                                                }
                                                className="h-14 w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-lg shadow-purple-600/20 font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] group relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <div className="relative z-10 flex items-center justify-center">
                                                    {isLoadLoading ? (
                                                        <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                                                    ) : (
                                                        <Play className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                                                    )}
                                                    {isLoadLoading
                                                        ? "EXECUTING TEST..."
                                                        : "INITIATE LOAD TEST"}
                                                </div>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Load Profile Preview for Load Test */}
                        <div className="bg-white rounded-xl p-6 border shadow-lg shadow-purple-500/5 border-purple-50/50">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    Live Load Profile Preview
                                </h4>
                                <div className="px-2 py-1 rounded bg-purple-100 text-purple-600 text-[8px] font-bold uppercase">
                                    Dynamic
                                </div>
                            </div>
                            <div className="min-h-[250px] relative">
                                <VirtualUsersChart
                                    data={
                                        loadTestType === "simple"
                                            ? [
                                                {
                                                    timestamp: "Start",
                                                    activeVUs: 0,
                                                    targetVUs: 0,
                                                },
                                                {
                                                    timestamp: "Ramp Up",
                                                    activeVUs: 0,
                                                    targetVUs:
                                                        Number(loadTestConfig.virtualUsers) || 0,
                                                },
                                                {
                                                    timestamp: "Steady",
                                                    activeVUs:
                                                        Number(loadTestConfig.virtualUsers) || 0,
                                                    targetVUs:
                                                        Number(loadTestConfig.virtualUsers) || 0,
                                                },
                                                {
                                                    timestamp: "End",
                                                    activeVUs: 0,
                                                    targetVUs: 0,
                                                },
                                            ]
                                            : [
                                                {
                                                    timestamp: "Start",
                                                    activeVUs: 0,
                                                    targetVUs: 0,
                                                },
                                                ...loadTestStages.map((s, i) => ({
                                                    timestamp: `S${i + 1}`,
                                                    activeVUs: s.target,
                                                    targetVUs: s.target,
                                                })),
                                            ]
                                    }
                                />
                            </div>
                            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">
                                            Max Concurrency
                                        </p>
                                        <p className="text-xl font-black text-gray-900">
                                            {loadTestType === "simple"
                                                ? loadTestConfig.virtualUsers
                                                : Math.max(
                                                    ...loadTestStages.map((s) => s.target),
                                                    0,
                                                )}
                                        </p>
                                    </div>
                                    <div className="w-px h-8 bg-gray-100" />
                                    <div className="flex-1">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">
                                            Estimated Duration
                                        </p>
                                        <p className="text-xl font-black text-gray-900">
                                            {loadTestType === "simple"
                                                ? `${(parseDuration(loadTestConfig.duration) || 0) + (parseDuration(loadTestConfig.rampUp) || 0) + (parseDuration(loadTestConfig.rampDown) || 0)}s`
                                                : `${loadTestStages.reduce((acc, s) => acc + (parseDuration(s.duration) || 0), 0)}s`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar for Load Test */}
                        {isLoadLoading && activeModule === "load" && (
                            <div className="bg-white rounded-xl p-8 border border-purple-100 shadow-sm text-center">
                                <RefreshCw className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    Executing Load Test...
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Simulating {loadTestConfig.virtualUsers} users on{" "}
                                    {loadTargetUrl}
                                </p>
                                <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-400 mt-2">
                                    {progress}% completed
                                </p>
                            </div>
                        )
                        }

                        {/* Metrics display */}
                        {loadTestResult && loadTestResult.type === "load" && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            Requests/sec
                                        </h4>
                                        <p className="text-2xl font-bold text-purple-600 mt-1">
                                            {loadTestResult?.avgRps
                                                ? loadTestResult.avgRps.toFixed(1)
                                                : "..."}
                                        </p>
                                        <p className="text-xs text-gray-500">Throughput</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            P95 Latency
                                        </h4>
                                        <p className="text-2xl font-bold text-purple-600 mt-1">
                                            {loadTestResult?.p95 ? `${loadTestResult.p95}ms` : "..."}
                                        </p>
                                        <p className="text-xs text-gray-500">95th percentile</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            Success Rate
                                        </h4>
                                        <p
                                            className={`text-2xl font-bold mt-1 ${loadTestResult?.successRate && loadTestResult.successRate > 99 ? "text-green-600" : loadTestResult?.successRate ? "text-amber-600" : "text-gray-600"}`}
                                        >
                                            {loadTestResult?.successRate
                                                ? `${loadTestResult.successRate.toFixed(1)}%`
                                                : "..."}
                                        </p>
                                        <p className="text-xs text-gray-500">Success rate</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            Total Requests
                                        </h4>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {loadTestResult?.totalRequests
                                                ? loadTestResult.totalRequests.toLocaleString()
                                                : "..."}
                                        </p>
                                        <p className="text-xs text-gray-500">Completed</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <LatencyDistributionChart
                                        p50={loadTestResult.p50}
                                        p75={loadTestResult.p75}
                                        p90={loadTestResult.p90}
                                        p95={loadTestResult.p95}
                                        p99={loadTestResult.p99}
                                        max={loadTestResult.max}
                                    />
                                    <RealTimeMetricsChart data={loadTestResult.timeline} />
                                    <VirtualUsersChart data={loadTestResult.vuTimeline} />
                                </div>
                            </>
                        )}

                        {
                            (!loadTestResult || loadTestResult.type !== "load") && !isLoadLoading && (
                                <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                    <LineChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        Real-time Metrics
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Start a load test to see live performance charts.
                                    </p>
                                </div>
                            )
                        }
                    </div>
                )}

                {/* Stress Test Tab */}
                {activeModule === "stress" && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Stress Testing
                            </h2>
                            <p className="text-sm text-gray-500">
                                Tests how much load the system can handle before it starts to
                                fail.
                            </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 border shadow-lg shadow-orange-500/5 border-orange-50/50">
                            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                                <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 leading-none">
                                        Configure Stress Test
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Identify system breaking point under load
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    {/* URL Input */}
                                    <div className="md:col-span-12">
                                        <Label
                                            htmlFor="stress-url"
                                            className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block"
                                        >
                                            Target URL
                                        </Label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Globe className="h-4 w-4 text-gray-500 group-focus-within:text-orange-600 transition-colors" />
                                            </div>
                                            <Input
                                                id="stress-url"
                                                value={stressTargetUrl}
                                                onChange={(e) => setStressTargetUrl(e.target.value)}
                                                placeholder="https://api.example.com/stress-endpoint"
                                                className="pl-10 h-12 text-base font-medium bg-white border-2 border-gray-300 focus:bg-white focus:border-orange-700 focus:ring-orange-700/10 transition-all rounded-xl shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-12 pt-6 border-t border-gray-100">
                                        {/* Method dropdown */}
                                        <div className="mb-4">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                Method
                                            </Label>
                                            <Select
                                                defaultValue="GET"
                                                value={stressTestMethod}
                                                onValueChange={(val) => setStressTestMethod(val)}
                                            >
                                                <SelectTrigger className="h-12 w-full md:w-48 rounded-xl bg-white border-2 border-gray-300 shadow-sm text-sm font-medium">
                                                    {stressTestMethod}
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="GET">
                                                        <span className="font-bold text-xs text-emerald-600">GET</span>
                                                    </SelectItem>
                                                    <SelectItem value="POST">
                                                        <span className="font-bold text-xs text-blue-600">POST</span>
                                                    </SelectItem>
                                                    <SelectItem value="PUT">
                                                        <span className="font-bold text-xs text-amber-600">PUT</span>
                                                    </SelectItem>
                                                    <SelectItem value="DELETE">
                                                        <span className="font-bold text-xs text-red-600">DELETE</span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between mb-4">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                                                Stages
                                            </Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setStressTestStages([
                                                        ...stressTestStages,
                                                        { duration: "1m", target: 100 },
                                                    ])
                                                }
                                                className="h-8 px-3 rounded-lg border-orange-200 text-orange-600 hover:bg-orange-50 text-[10px] font-bold"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> ADD STAGE
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-3 pr-[44px] mb-2 px-3">
                                            <div className="w-6 shrink-0" />
                                            <div className="flex-1 grid grid-cols-2 gap-3">
                                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Duration</div>
                                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Target VUs</div>
                                            </div>
                                        </div>
                                        <div className="max-h-[250px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                            {stressTestStages.map((stage, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                                        <div className="relative">
                                                            <Timer className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                            <Input
                                                                value={stage.duration}
                                                                onChange={(e) => {
                                                                    const newStages = [...stressTestStages];
                                                                    newStages[index].duration = e.target.value;
                                                                    setStressTestStages(newStages);
                                                                }}
                                                                className="pl-8 h-10 text-xs font-medium bg-white border-gray-200 rounded-lg"
                                                                placeholder="Duration (e.g. 1m)"
                                                            />
                                                        </div>
                                                        <div className="relative">
                                                            <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                            <Input
                                                                type="number"
                                                                value={stage.target}
                                                                onChange={(e) => {
                                                                    const newStages = [...stressTestStages];
                                                                    newStages[index].target = parseInt(e.target.value) || 0;
                                                                    setStressTestStages(newStages);
                                                                }}
                                                                className="pl-8 h-10 text-xs font-medium bg-white border-gray-200 rounded-lg"
                                                                placeholder="Target VUs"
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setStressTestStages(
                                                                stressTestStages.filter((_, i) => i !== index)
                                                            )
                                                        }
                                                        className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-3">
                                            Each stage defines a duration and target VUs. Stress test gradually increases load.
                                        </p>
                                    </div>

                                    <div className="md:col-span-12 pt-8">
                                        <Button
                                            onClick={handleStressTest}
                                            disabled={
                                                !stressTargetUrl ||
                                                isStressLoading ||
                                                stressTestStages.length === 0
                                            }
                                            className="h-14 w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl shadow-lg shadow-orange-600/20 font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-orange-700 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="relative z-10 flex items-center justify-center">
                                                {isStressLoading ? (
                                                    <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                                                ) : (
                                                    <Play className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                                                )}
                                                {isStressLoading
                                                    ? "EXECUTING TEST..."
                                                    : "INITIATE STRESS TEST"}
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Load Profile Preview for Stress Test */}
                        <div className="bg-white rounded-xl p-6 border shadow-lg shadow-orange-500/5 border-orange-50/50">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    Live Load Profile Preview
                                </h4>
                                <div className="px-2 py-1 rounded bg-orange-100 text-orange-600 text-[8px] font-bold uppercase">
                                    Dynamic
                                </div>
                            </div>
                            <div className="min-h-[250px] relative">
                                <VirtualUsersChart
                                    data={[
                                        {
                                            timestamp: "Start",
                                            activeVUs: 0,
                                            targetVUs: 0,
                                        },
                                        ...stressTestStages.map((s, i) => ({
                                            timestamp: `S${i + 1}`,
                                            activeVUs: s.target,
                                            targetVUs: s.target,
                                        })),
                                    ]}
                                />
                            </div>
                            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">
                                            Max Concurrency
                                        </p>
                                        <p className="text-xl font-black text-gray-900">
                                            {Math.max(
                                                ...stressTestStages.map((s) => s.target),
                                                0,
                                            )}
                                        </p>
                                    </div>
                                    <div className="w-px h-8 bg-gray-100" />
                                    <div className="flex-1">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">
                                            Estimated Duration
                                        </p>
                                        <p className="text-xl font-black text-gray-900">
                                            {stressTestStages.reduce((acc, s) => acc + (parseDuration(s.duration) || 0), 0)}s
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar for Stress Test */}
                        {isStressLoading && activeModule === "stress" && (
                            <div className="bg-white rounded-xl p-8 border border-orange-100 shadow-sm text-center">
                                <RefreshCw className="w-16 h-16 text-orange-600 mx-auto mb-4 animate-spin" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    Executing Stress Test...
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Running {stressTestStages.length} stages with max{" "}
                                    {Math.max(...stressTestStages.map(s => s.target))} VUs
                                </p>
                                <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-orange-600 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-400 mt-2">
                                    {progress}% completed
                                </p>
                            </div>
                        )}



                        {/* Metrics display */}
                        {loadTestResult && loadTestResult.type === "stress" && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            Requests/sec
                                        </h4>
                                        <p className="text-2xl font-bold text-orange-600 mt-1">
                                            {loadTestResult?.avgRps
                                                ? loadTestResult.avgRps.toFixed(1)
                                                : "..."}
                                        </p>
                                        <p className="text-xs text-gray-500">Throughput</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            P95 Latency
                                        </h4>
                                        <p className="text-2xl font-bold text-orange-600 mt-1">
                                            {loadTestResult?.p95 ? `${loadTestResult.p95}ms` : "..."}
                                        </p>
                                        <p className="text-xs text-gray-500">95th percentile</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            Success Rate
                                        </h4>
                                        <p
                                            className={`text-2xl font-bold mt-1 ${loadTestResult?.successRate && loadTestResult.successRate > 99 ? "text-green-600" : loadTestResult?.successRate ? "text-amber-600" : "text-gray-600"}`}
                                        >
                                            {loadTestResult?.successRate
                                                ? `${loadTestResult.successRate.toFixed(1)}%`
                                                : "..."}
                                        </p>
                                        <p className="text-xs text-gray-500">Success rate</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            Total Requests
                                        </h4>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {loadTestResult?.totalRequests
                                                ? loadTestResult.totalRequests.toLocaleString()
                                                : "..."}
                                        </p>
                                        <p className="text-xs text-gray-500">Completed</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <LatencyDistributionChart
                                        p50={loadTestResult.p50}
                                        p75={loadTestResult.p75}
                                        p90={loadTestResult.p90}
                                        p95={loadTestResult.p95}
                                        p99={loadTestResult.p99}
                                        max={loadTestResult.max}
                                    />
                                    <RealTimeMetricsChart data={loadTestResult.timeline} />
                                    <VirtualUsersChart data={loadTestResult.vuTimeline} />
                                </div>
                            </>
                        )}

                        {/* Chart placeholder */}
                        {(!loadTestResult || loadTestResult.type !== "stress") && !isStressLoading && (
                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    Breaking Point Analysis
                                </h3>
                                <p className="text-gray-500">
                                    Start a stress test to identify system limits.
                                </p>
                            </div>
                        )}
                    </div>
                )
                }

                {/* Spike Test Tab */}
                {
                    activeModule === "spike" && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Spike Testing
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Tests how the system reacts when traffic suddenly increases.
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border shadow-lg shadow-red-500/5 border-red-50/50">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                                    <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-none">
                                            Configure Spike Test
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Test system reaction to sudden traffic surges
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        {/* URL Input */}
                                        <div className="md:col-span-12">
                                            <Label
                                                htmlFor="spike-url"
                                                className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block"
                                            >
                                                Target URL
                                            </Label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Globe className="h-4 w-4 text-gray-500 group-focus-within:text-red-600 transition-colors" />
                                                </div>
                                                <Input
                                                    id="spike-url"
                                                    value={spikeTargetUrl}
                                                    onChange={(e) => setSpikeTargetUrl(e.target.value)}
                                                    placeholder="https://api.example.com/endpoint"
                                                    className="pl-10 h-12 text-base font-medium bg-white border-2 border-gray-300 focus:bg-white focus:border-red-700 focus:ring-red-700/10 transition-all rounded-xl shadow-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-12 pt-6 border-t border-gray-100">
                                            {/* Method dropdown */}
                                            <div className="mb-4">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                    Method
                                                </Label>
                                                <Select
                                                    defaultValue="GET"
                                                    value={spikeTestMethod}
                                                    onValueChange={(val) => setSpikeTestMethod(val)}
                                                >
                                                    <SelectTrigger className="h-12 w-full md:w-48 rounded-xl bg-white border-2 border-gray-300 shadow-sm text-sm font-medium">
                                                        {spikeTestMethod}
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="GET">
                                                            <span className="font-bold text-xs text-emerald-600">GET</span>
                                                        </SelectItem>
                                                        <SelectItem value="POST">
                                                            <span className="font-bold text-xs text-blue-600">POST</span>
                                                        </SelectItem>
                                                        <SelectItem value="PUT">
                                                            <span className="font-bold text-xs text-amber-600">PUT</span>
                                                        </SelectItem>
                                                        <SelectItem value="DELETE">
                                                            <span className="font-bold text-xs text-red-600">DELETE</span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex items-center justify-between mb-4">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                                                    Stages
                                                </Label>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setSpikeTestStages([
                                                            ...spikeTestStages,
                                                            { duration: "30s", target: 100 },
                                                        ])
                                                    }
                                                    className="h-8 px-3 rounded-lg border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> ADD STAGE
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-3 pr-[44px] mb-2 px-3">
                                                <div className="w-6 shrink-0" />
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Duration</div>
                                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Target VUs</div>
                                                </div>
                                            </div>
                                            <div className="max-h-[250px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                                {spikeTestStages.map((stage, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group"
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                                            <div className="relative">
                                                                <Timer className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                                <Input
                                                                    value={stage.duration}
                                                                    onChange={(e) => {
                                                                        const newStages = [...spikeTestStages];
                                                                        newStages[index].duration = e.target.value;
                                                                        setSpikeTestStages(newStages);
                                                                    }}
                                                                    className="pl-8 h-10 text-xs font-medium bg-white border-gray-200 rounded-lg"
                                                                    placeholder="Duration (e.g. 10s)"
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                                <Input
                                                                    type="number"
                                                                    value={stage.target}
                                                                    onChange={(e) => {
                                                                        const newStages = [...spikeTestStages];
                                                                        newStages[index].target = parseInt(e.target.value) || 0;
                                                                        setSpikeTestStages(newStages);
                                                                    }}
                                                                    className="pl-8 h-10 text-xs font-medium bg-white border-gray-200 rounded-lg"
                                                                    placeholder="Target VUs"
                                                                />
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                setSpikeTestStages(
                                                                    spikeTestStages.filter((_, i) => i !== index)
                                                                )
                                                            }
                                                            className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-3">
                                                Spike test: Normal load → sudden spike → hold → return. Define stages to control traffic bursts.
                                            </p>
                                        </div>

                                        <div className="md:col-span-12 pt-8">
                                            <Button
                                                onClick={handleSpikeTest}
                                                disabled={
                                                    !spikeTargetUrl ||
                                                    isSpikeLoading ||
                                                    spikeTestStages.length === 0
                                                }
                                                className="h-14 w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg shadow-red-600/20 font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] group relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <div className="relative z-10 flex items-center justify-center">
                                                    {isSpikeLoading ? (
                                                        <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                                                    ) : (
                                                        <Zap className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                                                    )}
                                                    {isSpikeLoading
                                                        ? "EXECUTING TEST..."
                                                        : "INITIATE SPIKE TEST"}
                                                </div>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Load Profile Preview for Spike Test */}
                            <div className="bg-white rounded-xl p-6 border shadow-lg shadow-red-500/5 border-red-50/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                        Live Load Profile Preview
                                    </h4>
                                    <div className="px-2 py-1 rounded bg-red-100 text-red-600 text-[8px] font-bold uppercase">
                                        Dynamic
                                    </div>
                                </div>
                                <div className="min-h-[250px] relative">
                                    <VirtualUsersChart
                                        data={[
                                            {
                                                timestamp: "Start",
                                                activeVUs: 0,
                                                targetVUs: 0,
                                            },
                                            ...spikeTestStages.map((s, i) => ({
                                                timestamp: `S${i + 1}`,
                                                activeVUs: s.target,
                                                targetVUs: s.target,
                                            })),
                                        ]}
                                    />
                                </div>
                                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">
                                                Max Concurrency
                                            </p>
                                            <p className="text-xl font-black text-gray-900">
                                                {Math.max(
                                                    ...spikeTestStages.map((s) => s.target),
                                                    0,
                                                )}
                                            </p>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100" />
                                        <div className="flex-1">
                                            <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">
                                                Estimated Duration
                                            </p>
                                            <p className="text-xl font-black text-gray-900">
                                                {spikeTestStages.reduce((acc, s) => acc + (parseDuration(s.duration) || 0), 0)}s
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar for Spike Test */}
                            {isSpikeLoading && activeModule === "spike" && (
                                <div className="bg-white rounded-xl p-8 border border-red-100 shadow-sm text-center">
                                    <RefreshCw className="w-16 h-16 text-red-600 mx-auto mb-4 animate-spin" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        Executing Spike Test...
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Running {spikeTestStages.length} stages with max{" "}
                                        {Math.max(...spikeTestStages.map(s => s.target))} VUs
                                    </p>
                                    <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-red-600 h-2.5 rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}


                            {/* Metrics display */}
                            {loadTestResult && loadTestResult.type === "spike" && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-white rounded-xl p-4 border shadow-sm">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                Requests/sec
                                            </h4>
                                            <p className="text-2xl font-bold text-red-600 mt-1">
                                                {loadTestResult?.avgRps
                                                    ? loadTestResult.avgRps.toFixed(1)
                                                    : "..."}
                                            </p>
                                            <p className="text-xs text-gray-500">Throughput</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border shadow-sm">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                P95 Latency
                                            </h4>
                                            <p className="text-2xl font-bold text-red-600 mt-1">
                                                {loadTestResult?.p95 ? `${loadTestResult.p95}ms` : "..."}
                                            </p>
                                            <p className="text-xs text-gray-500">95th percentile</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border shadow-sm">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                Success Rate
                                            </h4>
                                            <p
                                                className={`text-2xl font-bold mt-1 ${loadTestResult?.successRate && loadTestResult.successRate > 99 ? "text-green-600" : loadTestResult?.successRate ? "text-amber-600" : "text-gray-600"}`}
                                            >
                                                {loadTestResult?.successRate
                                                    ? `${loadTestResult.successRate.toFixed(1)}%`
                                                    : "..."}
                                            </p>
                                            <p className="text-xs text-gray-500">Success rate</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border shadow-sm">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                Total Requests
                                            </h4>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                                {loadTestResult?.totalRequests
                                                    ? loadTestResult.totalRequests.toLocaleString()
                                                    : "..."}
                                            </p>
                                            <p className="text-xs text-gray-500">Completed</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <LatencyDistributionChart
                                            p50={loadTestResult.p50}
                                            p75={loadTestResult.p75}
                                            p90={loadTestResult.p90}
                                            p95={loadTestResult.p95}
                                            p99={loadTestResult.p99}
                                            max={loadTestResult.max}
                                        />
                                        <RealTimeMetricsChart data={loadTestResult.timeline} />
                                        <VirtualUsersChart data={loadTestResult.vuTimeline} />
                                    </div>
                                </>
                            )}

                            {/* Chart placeholder */}
                            {(!loadTestResult || loadTestResult.type !== "spike") && !isSpikeLoading && (
                                <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                    <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        Spike Analysis
                                    </h3>
                                    <p className="text-gray-500">
                                        Start a spike test to analyze system stability.
                                    </p>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Soak Test Tab */}
                {
                    activeModule === "soak" && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Soak Testing
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Tests how the system performs over a long time to find slowdowns
                                    or memory issues
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border shadow-lg shadow-indigo-500/5 border-indigo-50/50">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-900 flex items-center justify-center text-white shadow-lg shadow-indigo-900/30">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-none">
                                            Configure Soak Test
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Monitor system health over extended periods
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        {/* URL Input */}
                                        <div className="md:col-span-12">
                                            <Label
                                                htmlFor="endurance-url"
                                                className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block"
                                            >
                                                Target URL
                                            </Label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Globe className="h-4 w-4 text-gray-500 group-focus-within:text-indigo-600 transition-colors" />
                                                </div>
                                                <Input
                                                    id="endurance-url"
                                                    value={soakTargetUrl}
                                                    onChange={(e) => setSoakTargetUrl(e.target.value)}
                                                    placeholder="https://api.example.com/endpoint"
                                                    className="pl-10 h-12 text-base font-medium bg-white border-2 border-gray-300 focus:bg-white focus:border-indigo-700 focus:ring-indigo-700/10 transition-all rounded-xl shadow-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-12 pt-6 border-t border-gray-100">
                                            {/* Method dropdown */}
                                            <div className="mb-4">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                    Method
                                                </Label>
                                                <Select
                                                    defaultValue="GET"
                                                    value={soakTestMethod}
                                                    onValueChange={(val) => setSoakTestMethod(val)}
                                                >
                                                    <SelectTrigger className="h-12 w-full md:w-48 rounded-xl bg-white border-2 border-gray-300 shadow-sm text-sm font-medium">
                                                        {soakTestMethod}
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="GET">
                                                            <span className="font-bold text-xs text-emerald-600">GET</span>
                                                        </SelectItem>
                                                        <SelectItem value="POST">
                                                            <span className="font-bold text-xs text-blue-600">POST</span>
                                                        </SelectItem>
                                                        <SelectItem value="PUT">
                                                            <span className="font-bold text-xs text-amber-600">PUT</span>
                                                        </SelectItem>
                                                        <SelectItem value="DELETE">
                                                            <span className="font-bold text-xs text-red-600">DELETE</span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex items-center justify-between mb-4">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                                                    Stages
                                                </Label>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setSoakTestStages([
                                                            ...soakTestStages,
                                                            { duration: "30m", target: 100 },
                                                        ])
                                                    }
                                                    className="h-8 px-3 rounded-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-[10px] font-bold"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> ADD STAGE
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-3 pr-[44px] mb-2 px-3">
                                                <div className="w-6 shrink-0" />
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Duration</div>
                                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Target VUs</div>
                                                </div>
                                            </div>
                                            <div className="max-h-[250px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                                {soakTestStages.map((stage, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group"
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                                            <div className="relative">
                                                                <Timer className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                                <Input
                                                                    value={stage.duration}
                                                                    onChange={(e) => {
                                                                        const newStages = [...soakTestStages];
                                                                        newStages[index].duration = e.target.value;
                                                                        setSoakTestStages(newStages);
                                                                    }}
                                                                    className="pl-8 h-10 text-xs font-medium bg-white border-gray-200 rounded-lg"
                                                                    placeholder="Duration (e.g. 4h)"
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                                <Input
                                                                    type="number"
                                                                    value={stage.target}
                                                                    onChange={(e) => {
                                                                        const newStages = [...soakTestStages];
                                                                        newStages[index].target = parseInt(e.target.value) || 0;
                                                                        setSoakTestStages(newStages);
                                                                    }}
                                                                    className="pl-8 h-10 text-xs font-medium bg-white border-gray-200 rounded-lg"
                                                                    placeholder="Target VUs"
                                                                />
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                setSoakTestStages(
                                                                    soakTestStages.filter((_, i) => i !== index)
                                                                )
                                                            }
                                                            className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-3">
                                                Soak test: Maintain steady load for extended periods. Use hours (h) for duration to test endurance.
                                            </p>
                                        </div>

                                        <div className="md:col-span-12 pt-8">
                                            <Button
                                                onClick={handleSoakTest}
                                                disabled={
                                                    !soakTargetUrl ||
                                                    isSoakLoading ||
                                                    soakTestStages.length === 0
                                                }
                                                className="h-14 w-full bg-indigo-900 hover:bg-slate-900 text-white rounded-2xl shadow-lg shadow-indigo-900/20 font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] group relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <div className="relative z-10 flex items-center justify-center">
                                                    {isSoakLoading ? (
                                                        <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                                                    ) : (
                                                        <Play className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                                                    )}
                                                    {isSoakLoading
                                                        ? "EXECUTING TEST..."
                                                        : "INITIATE SOAK TEST"}
                                                </div>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Load Profile Preview for Soak Test */}
                            <div className="bg-white rounded-xl p-6 border shadow-lg shadow-indigo-500/5 border-indigo-50/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                        Live Load Profile Preview
                                    </h4>
                                    <div className="px-2 py-1 rounded bg-indigo-100 text-indigo-600 text-[8px] font-bold uppercase">
                                        Dynamic
                                    </div>
                                </div>
                                <div className="min-h-[250px] relative">
                                    <VirtualUsersChart
                                        data={[
                                            {
                                                timestamp: "Start",
                                                activeVUs: 0,
                                                targetVUs: 0,
                                            },
                                            ...soakTestStages.map((s, i) => ({
                                                timestamp: `S${i + 1}`,
                                                activeVUs: s.target,
                                                targetVUs: s.target,
                                            })),
                                        ]}
                                    />
                                </div>
                                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">
                                                Max Concurrency
                                            </p>
                                            <p className="text-xl font-black text-gray-900">
                                                {Math.max(
                                                    ...soakTestStages.map((s) => s.target),
                                                    0,
                                                )}
                                            </p>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100" />
                                        <div className="flex-1">
                                            <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">
                                                Estimated Duration
                                            </p>
                                            <p className="text-xl font-black text-gray-900">
                                                {soakTestStages.reduce((acc, s) => acc + (parseDuration(s.duration) || 0), 0)}s
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar for Soak Test */}
                            {isSoakLoading && activeModule === "soak" && (
                                <div className="bg-white rounded-xl p-8 border border-indigo-100 shadow-sm text-center">
                                    <RefreshCw className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        Executing Soak Test...
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Running {soakTestStages.length} stages with max{" "}
                                        {Math.max(...soakTestStages.map(s => s.target))} VUs
                                    </p>
                                    <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2">
                                        {progress}% completed
                                    </p>
                                </div>
                            )}



                            {/* Metrics display */}
                            {loadTestResult && (loadTestResult.type === "soak" || loadTestResult.type === "endurance") && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-white rounded-xl p-4 border shadow-sm">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                Requests/sec
                                            </h4>
                                            <p className="text-2xl font-bold text-indigo-600 mt-1">
                                                {loadTestResult?.avgRps
                                                    ? loadTestResult.avgRps.toFixed(1)
                                                    : "..."}
                                            </p>
                                            <p className="text-xs text-gray-500">Throughput</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border shadow-sm">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                P95 Latency
                                            </h4>
                                            <p className="text-2xl font-bold text-indigo-600 mt-1">
                                                {loadTestResult?.p95 ? `${loadTestResult.p95}ms` : "..."}
                                            </p>
                                            <p className="text-xs text-gray-500">95th percentile</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border shadow-sm">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                Success Rate
                                            </h4>
                                            <p
                                                className={`text-2xl font-bold mt-1 ${loadTestResult?.successRate && loadTestResult.successRate > 99 ? "text-green-600" : loadTestResult?.successRate ? "text-amber-600" : "text-gray-600"}`}
                                            >
                                                {loadTestResult?.successRate
                                                    ? `${loadTestResult.successRate.toFixed(1)}%`
                                                    : "..."}
                                            </p>
                                            <p className="text-xs text-gray-500">Success rate</p>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border shadow-sm">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                Total Requests
                                            </h4>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                                {loadTestResult?.totalRequests
                                                    ? loadTestResult.totalRequests.toLocaleString()
                                                    : "..."}
                                            </p>
                                            <p className="text-xs text-gray-500">Completed</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <LatencyDistributionChart
                                            p50={loadTestResult.p50}
                                            p75={loadTestResult.p75}
                                            p90={loadTestResult.p90}
                                            p95={loadTestResult.p95}
                                            p99={loadTestResult.p99}
                                            max={loadTestResult.max}
                                        />
                                        <RealTimeMetricsChart data={loadTestResult.timeline} />
                                        <VirtualUsersChart data={loadTestResult.vuTimeline} />
                                    </div>
                                </>
                            )}

                            {!loadTestResult && !isSoakLoading && (
                                <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        Soak Analysis
                                    </h3>
                                    <p className="text-gray-500">
                                        Start a soak test to monitor system health over time.
                                    </p>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Volume Test Tab */}
                {
                    activeModule === "volume" && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Volume Testing
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Test performance with large data volumes in the database
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border shadow-lg shadow-blue-500/5 border-blue-50/50">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                                        <BarChart3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-none">
                                            Configure Volume Test
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Test performance with large data volumes
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        {/* URL Input */}
                                        <div className="md:col-span-12">
                                            <Label
                                                htmlFor="volume-url"
                                                className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block"
                                            >
                                                Target URL
                                            </Label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Globe className="h-4 w-4 text-gray-500 group-focus-within:text-blue-600 transition-colors" />
                                                </div>
                                                <Input
                                                    id="volume-url"
                                                    placeholder="https://api.example.com/endpoint"
                                                    className="pl-10 h-12 text-base font-medium bg-white border-2 border-gray-300 focus:bg-white focus:border-blue-700 focus:ring-blue-700/10 transition-all rounded-xl shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                                            <div>
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                    Data Volume (records)
                                                </Label>
                                                <div className="relative">
                                                    <List className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input
                                                        type="number"
                                                        defaultValue="1000000"
                                                        className="pl-10 h-12 text-sm font-medium bg-white border-2 border-gray-300 rounded-xl shadow-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                    Concurrent Users
                                                </Label>
                                                <div className="relative">
                                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input
                                                        type="number"
                                                        defaultValue="100"
                                                        className="pl-10 h-12 text-sm font-medium bg-white border-2 border-gray-300 rounded-xl shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-12 pt-8">
                                            <Button className="h-14 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/20 font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] group relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <div className="relative z-10 flex items-center justify-center">
                                                    <BarChart3 className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                                                    INITIATE VOLUME TEST
                                                </div>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    Data Volume Analysis
                                </h3>
                                <p className="text-gray-500">
                                    Start a volume test to measure data handling performance.
                                </p>
                            </div>
                        </div>
                    )
                }

                {/* Scalability Test Tab */}
                {
                    activeModule === "scalability" && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Scalability Testing
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Determine the system's ability to handle increasing loads
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border shadow-lg shadow-green-500/5 border-green-50/50">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                                    <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-600/30">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-none">
                                            Configure Scalability Test
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Determine system growth capacity
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        {/* URL Input */}
                                        <div className="md:col-span-12">
                                            <Label
                                                htmlFor="scalability-url"
                                                className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block"
                                            >
                                                Target URL
                                            </Label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Globe className="h-4 w-4 text-gray-500 group-focus-within:text-green-600 transition-colors" />
                                                </div>
                                                <Input
                                                    id="scalability-url"
                                                    placeholder="https://api.example.com/endpoint"
                                                    className="pl-10 h-12 text-base font-medium bg-white border-2 border-gray-300 focus:bg-white focus:border-green-700 focus:ring-green-700/10 transition-all rounded-xl shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                                            <div>
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                    Start Load
                                                </Label>
                                                <div className="relative">
                                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input
                                                        type="number"
                                                        defaultValue="10"
                                                        className="pl-10 h-12 text-sm font-medium bg-white border-2 border-gray-300 rounded-xl shadow-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                    Max Load
                                                </Label>
                                                <div className="relative">
                                                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input
                                                        type="number"
                                                        defaultValue="10000"
                                                        className="pl-10 h-12 text-sm font-medium bg-white border-2 border-gray-300 rounded-xl shadow-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                    Increment
                                                </Label>
                                                <div className="relative">
                                                    <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input
                                                        type="number"
                                                        defaultValue="100"
                                                        className="pl-10 h-12 text-sm font-medium bg-white border-2 border-gray-300 rounded-xl shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-12 pt-8">
                                            <Button className="h-14 w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg shadow-green-600/20 font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] group relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <div className="relative z-10 flex items-center justify-center">
                                                    <TrendingUp className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                                                    INITIATE SCALABILITY TEST
                                                </div>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    Scaling Analysis
                                </h3>
                                <p className="text-gray-500">
                                    Start a scalability test to measure growth capacity.
                                </p>
                            </div>
                        </div>
                    )
                }

                {/* Capacity Test Tab */}
                {
                    activeModule === "capacity" && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Capacity Testing
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Find the maximum load your system can handle
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border shadow-lg shadow-cyan-500/5 border-cyan-50/50">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
                                        <Gauge className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-none">
                                            Configure Capacity Test
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Identify system limits before degradation
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        {/* URL Input */}
                                        <div className="md:col-span-12">
                                            <Label
                                                htmlFor="capacity-url"
                                                className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block"
                                            >
                                                Target URL
                                            </Label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Globe className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-600 transition-colors" />
                                                </div>
                                                <Input
                                                    id="capacity-url"
                                                    placeholder="https://api.example.com/endpoint"
                                                    className="pl-10 h-12 text-base font-medium bg-white border-2 border-gray-300 focus:bg-white focus:border-cyan-700 focus:ring-cyan-700/10 transition-all rounded-xl shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                                            <div>
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                    Performance Threshold
                                                </Label>
                                                <div className="relative">
                                                    <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input
                                                        type="number"
                                                        defaultValue="500"
                                                        placeholder="0"
                                                        className="pl-10 h-12 text-sm font-medium bg-white border-2 border-gray-300 rounded-xl shadow-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-2 block">
                                                    Error Rate Limit (%)
                                                </Label>
                                                <div className="relative">
                                                    <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input
                                                        type="number"
                                                        defaultValue="1"
                                                        max="100"
                                                        className="pl-10 h-12 text-sm font-medium bg-white border-2 border-gray-300 rounded-xl shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-12 pt-8">
                                            <Button className="h-14 w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl shadow-lg shadow-cyan-600/20 font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] group relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-700 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <div className="relative z-10 flex items-center justify-center">
                                                    <Gauge className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                                                    INITIATE CAPACITY TEST
                                                </div>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
                                <Gauge className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    Capacity Limits
                                </h3>
                                <p className="text-gray-500">
                                    Start a capacity test to identify system limits.
                                </p>
                            </div>
                        </div>
                    )
                }

                {/* Results Tab */}
                {
                    activeModule === "results" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Test Results & History
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        View past test runs, trends, and comparisons
                                    </p>
                                </div>
                                <ReportExport data={demoReportData} />
                            </div>

                            {/* Test Comparison */}
                            <TestComparison tests={demoTestResults} />

                            {/* Historical Trend */}
                            <HistoricalTrendChart
                                data={generateDemoTrendData(60)}
                                title="Performance History"
                            />

                            {/* Recent Tests */}
                            <div className="bg-white rounded-xl border shadow-sm">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Recent Test Runs
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {demoTestResults.map((test) => (
                                        <div
                                            key={test.id}
                                            className="p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${test.testType === "lighthouse"
                                                            ? "bg-teal-100"
                                                            : test.testType === "load"
                                                                ? "bg-purple-100"
                                                                : "bg-orange-100"
                                                            }`}
                                                    >
                                                        {test.testType === "lighthouse" ? (
                                                            <Zap className={`w-5 h-5 text-teal-600`} />
                                                        ) : test.testType === "load" ? (
                                                            <TrendingUp className={`w-5 h-5 text-purple-600`} />
                                                        ) : (
                                                            <Activity className={`w-5 h-5 text-orange-600`} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {test.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(test.timestamp).toLocaleDateString()} at{" "}
                                                            {new Date(test.timestamp).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {test.metrics.performance !== undefined && (
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">Score</p>
                                                            <p
                                                                className={`text-lg font-bold ${test.metrics.performance >= 90
                                                                    ? "text-green-600"
                                                                    : test.metrics.performance >= 50
                                                                        ? "text-amber-600"
                                                                        : "text-red-600"
                                                                    }`}
                                                            >
                                                                {test.metrics.performance}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {test.metrics.rps !== undefined && (
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">RPS</p>
                                                            <p className="text-lg font-bold text-purple-600">
                                                                {test.metrics.rps}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <Button variant="ghost" size="sm">
                                                        View
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Create Test Wizard Dialog */}
                <Dialog open={showWizard} onOpenChange={setShowWizard}>
                    <DialogContent className="max-w-2xl p-0 overflow-hidden">
                        <DialogTitle className="sr-only">
                            Create Performance Test
                        </DialogTitle>
                        <PerformanceTestWizard
                            projectId={projectId}
                            editMode={!!testToEdit}
                            initialData={testToEdit}
                            onComplete={testToEdit ? handleUpdateTest : handleTestCreated}
                            onCancel={() => {
                                setShowWizard(false);
                                setTestToEdit(null);
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div >
        </div >
    );
}
