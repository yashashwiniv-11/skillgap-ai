"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Skill {
  name: string;
  category: string;
  confidence: number;
}

interface UploadResponse {
  filename: string;
  extracted_text: string;
  char_count: number;
  skills: Skill[];
}

interface LearningItem {
  skill: string;
  resource: string;
}

interface GapResult {
  target_role: string;
  match_score: number;
  critical: { has: string[]; missing: string[] };
  important: { has: string[]; missing: string[] };
  nice_to_have: { has: string[]; missing: string[] };
  learning_path: LearningItem[];
}

interface HistoryItem {
  id: string;
  date: string;
  filename: string;
  target_role: string;
  match_score: number;
  skills_count: number;
  gapResult: GapResult;
  skills: Skill[];
}

interface User {
  id: number;
  email: string;
  full_name?: string | null;
}

interface Job {
  title: string;
  company: string;
  location: string;
  type: string;
  skills: string[];
  link: string;
}

const ROLES = [
  "Data Scientist",
  "Full Stack Developer",
  "Machine Learning Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "DevOps Engineer",
  "AI Engineer",
  "Mobile Developer",
  "Cloud Engineer",
  "Cybersecurity Analyst",
  "Product Manager",
];

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [gapResult, setGapResult] = useState<GapResult | null>(null);
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem("skillgap_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }

    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }

    const savedDark = localStorage.getItem("darkMode");
    if (savedDark === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const saveToHistory = (gap: GapResult, skills: Skill[], filename: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      filename,
      target_role: gap.target_role,
      match_score: gap.match_score,
      skills_count: skills.length,
      gapResult: gap,
      skills,
    };
    const updated = [newItem, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem("skillgap_history", JSON.stringify(updated));
  };

  const fetchJobs = async (role: string) => {
    setJobsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/profiles/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_role: role }),
      });
      if (!response.ok) throw new Error("Failed to fetch jobs");
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Job fetch error:", err);
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setGapResult(null);
    setJobs([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/profiles/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data: UploadResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError("Failed to upload or extract skills. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkillGap = async () => {
    if (!result) return;
    setGapLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/profiles/skill-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: result.skills,
          target_role: targetRole,
        }),
      });
      if (!response.ok) throw new Error("Skill gap analysis failed");
      const data: GapResult = await response.json();
      setGapResult(data);
      saveToHistory(data, result.skills, result.filename);
      fetchJobs(targetRole);
    } catch (err) {
      setError("Failed to analyze skill gap.");
    } finally {
      setGapLoading(false);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResult({
      filename: item.filename,
      extracted_text: "",
      char_count: 0,
      skills: item.skills,
    });
    setGapResult(item.gapResult);
    setTargetRole(item.target_role);
    setShowHistory(false);
    fetchJobs(item.target_role);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("skillgap_history");
  };

  const downloadReport = async () => {
    if (!result || !gapResult) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    let y = 20;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;

    const addText = (text: string, fontSize = 11, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, maxWidth);
      if (y + lines.length * lineHeight > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(lines, margin, y);
      y += lines.length * lineHeight + 2;
    };

    addText("SKILLGAP AI - CAREER ANALYSIS REPORT", 16, true);
    y += 4;

    addText(`Resume: ${result.filename}`);
    addText(`Target Role: ${gapResult.target_role}`);
    addText(`Match Score: ${gapResult.match_score}%`, 11, true);
    y += 4;

    addText("EXTRACTED SKILLS", 13, true);
    result.skills.forEach((s) => {
      addText(`• ${s.name} (${s.category}) - ${Math.round(s.confidence * 100)}%`);
    });
    y += 4;

    addText("CRITICAL SKILLS", 13, true);
    addText(`You have: ${gapResult.critical.has.join(", ") || "None"}`);
    addText(`Missing: ${gapResult.critical.missing.join(", ") || "None"}`);
    y += 4;

    addText("IMPORTANT SKILLS", 13, true);
    addText(`You have: ${gapResult.important.has.join(", ") || "None"}`);
    addText(`Missing: ${gapResult.important.missing.join(", ") || "None"}`);
    y += 4;

    if (gapResult.learning_path.length > 0) {
      addText("LEARNING PATH", 13, true);
      gapResult.learning_path.forEach((item) => {
        addText(`• ${item.skill}`, 11, true);
        addText(`  ${item.resource}`, 10);
      });
    }

    y += 6;
    addText("Generated by SkillGap AI", 10);

    doc.save(`SkillGap_Report_${gapResult.target_role.replace(/\s+/g, "_")}.pdf`);
  };

  const getCategoryStats = () => {
    if (!result) return [];
    const counts: Record<string, number> = {};
    result.skills.forEach((s) => {
      const cat = s.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "programming":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700";
      case "framework":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700";
      case "tool":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700";
      case "soft skill":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700";
      case "domain":
        return "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700";
      case "cloud":
        return "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600";
    }
  };

  const getBarColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "programming": return "bg-blue-500";
      case "framework": return "bg-purple-500";
      case "tool": return "bg-emerald-500";
      case "soft skill": return "bg-amber-500";
      case "domain": return "bg-pink-500";
      case "cloud": return "bg-cyan-500";
      default: return "bg-slate-500";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const categoryStats = getCategoryStats();
  const maxCount = categoryStats.length > 0 ? Math.max(...categoryStats.map((c) => c.count)) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 py-12 px-4 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="text-center space-y-3">
          <div className="flex justify-end mb-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDarkMode}
              className="border-slate-200 dark:border-slate-600 dark:text-slate-200"
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </Button>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Hi, <span className="font-medium">{user.full_name || user.email}</span>
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="dark:border-slate-600 dark:text-slate-200">
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/auth")}
                className="border-indigo-200 text-indigo-700 dark:border-indigo-500 dark:text-indigo-300"
              >
                Login / Sign Up
              </Button>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            SkillGap AI
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Upload your resume → Extract skills → Analyze skill gaps → Get personalized learning path
          </p>

          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-300 dark:hover:bg-slate-800"
            >
              {showHistory ? "Hide History" : `View History (${history.length})`}
            </Button>
          </div>
        </div>

        {/* HISTORY */}
        {showHistory && (
          <Card className="shadow-xl border-0 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="dark:text-white">Analysis History</CardTitle>
                <CardDescription className="dark:text-slate-400">Your last 10 analyses</CardDescription>
              </div>
              {history.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearHistory} className="text-red-600 border-red-200">
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-slate-500 text-sm dark:text-slate-400">No history yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600"
                      onClick={() => loadHistoryItem(item)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{item.target_role}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{item.filename}</p>
                          <p className="text-xs text-slate-400 mt-1">{item.date}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${getScoreColor(item.match_score)}`}>
                            {item.match_score}%
                          </p>
                          <p className="text-xs text-slate-400">{item.skills_count} skills</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* UPLOAD */}
        <Card className="shadow-xl border-0 overflow-hidden dark:bg-slate-800">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardHeader>
            <CardTitle className="text-xl dark:text-white">1. Upload Resume</CardTitle>
            <CardDescription className="dark:text-slate-400">Supports PDF and TXT files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume" className="dark:text-slate-200">Choose your resume</Label>
              <Input
                id="resume"
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              {file && <p className="text-sm text-slate-500 dark:text-slate-400">Selected: {file.name}</p>}
            </div>

            <Button
              onClick={handleUpload}
              disabled={loading || !file}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              size="lg"
            >
              {loading ? "Analyzing Resume..." : "Extract Skills with AI"}
            </Button>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SKILLS + CHART */}
        {result && (
          <>
            <Card className="shadow-xl border-0 dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="dark:text-white">
                  Extracted Skills
                  <span className="ml-2 text-base font-normal text-slate-500 dark:text-slate-400">
                    ({result.skills.length} found)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.skills.map((skill, index) => (
                    <div
                      key={index}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getCategoryColor(skill.category)}`}
                    >
                      {skill.name}
                      <span className="ml-1.5 text-xs opacity-70">
                        {Math.round(skill.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Skill Category Distribution</CardTitle>
                <CardDescription className="dark:text-slate-400">Breakdown of your skills by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryStats.map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                        <span className="text-slate-500 dark:text-slate-400">{cat.count} skills</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-700 ${getBarColor(cat.name)}`}
                          style={{ width: `${(cat.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* SKILL GAP */}
        {result && (
          <Card className="shadow-xl border-0 dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-xl dark:text-white">2. Skill Gap Analysis</CardTitle>
              <CardDescription className="dark:text-slate-400">Select your target role to see missing skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="dark:text-slate-200">Target Role</Label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleSkillGap}
                disabled={gapLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                size="lg"
              >
                {gapLoading ? "Analyzing Gaps..." : "Analyze Skill Gap"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* RESULTS */}
        {gapResult && (
          <div className="space-y-6">
            <Card className="shadow-xl border-0 overflow-hidden dark:bg-slate-800">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 dark:text-white">
                  <span>Match Score for {gapResult.target_role}</span>
                  <span className={`text-4xl font-bold ${getScoreColor(gapResult.match_score)}`}>
                    {gapResult.match_score}%
                  </span>
                </CardTitle>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 mt-2">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                    style={{ width: `${gapResult.match_score}%` }}
                  />
                </div>
              </CardHeader>
            </Card>

            <Card className="shadow-xl border-0 dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-rose-600 dark:text-rose-400">Critical Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">You have:</p>
                  <div className="flex flex-wrap gap-2">
                    {gapResult.critical.has.length > 0 ? (
                      gapResult.critical.has.map((s) => (
                        <span key={s} className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mb-2">Missing:</p>
                  <div className="flex flex-wrap gap-2">
                    {gapResult.critical.missing.length > 0 ? (
                      gapResult.critical.missing.map((s) => (
                        <span key={s} className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-sm font-medium border border-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-emerald-600 font-medium dark:text-emerald-400">None – Excellent!</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-amber-600 dark:text-amber-400">Important Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">You have:</p>
                  <div className="flex flex-wrap gap-2">
                    {gapResult.important.has.map((s) => (
                      <span key={s} className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">Missing:</p>
                  <div className="flex flex-wrap gap-2">
                    {gapResult.important.missing.map((s) => (
                      <span key={s} className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium border border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {gapResult.learning_path.length > 0 && (
              <Card className="shadow-xl border-0 dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-indigo-600 dark:text-indigo-400">Learning Path</CardTitle>
                  <CardDescription className="dark:text-slate-400">Recommended resources for your missing skills</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {gapResult.learning_path.map((item, index) => (
                      <div key={index} className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-700">
                        <p className="font-semibold text-indigo-900 dark:text-indigo-200">{item.skill}</p>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">{item.resource}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* RECOMMENDED JOBS */}
            {(jobsLoading || jobs.length > 0) && (
              <Card className="shadow-xl border-0 dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-blue-600 dark:text-blue-400">Recommended Jobs</CardTitle>
                  <CardDescription className="dark:text-slate-400">Job openings matching your target role</CardDescription>
                </CardHeader>
                <CardContent>
                  {jobsLoading ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading jobs...</p>
                  ) : (
                    <div className="space-y-4">
                      {jobs.map((job, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/30"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-white">{job.title}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300">{job.company}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {job.location} • {job.type}
                              </p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {job.skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <a
                              href={job.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 hover:underline whitespace-nowrap dark:text-blue-400"
                            >
                              View Jobs →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center pt-2">
              <Button
                onClick={downloadReport}
                variant="outline"
                size="lg"
                className="border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-300 dark:hover:bg-slate-800"
              >
                Download Full Report (PDF)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}