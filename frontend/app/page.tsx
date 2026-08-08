"use client";

import { useState, useEffect } from "react";
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

const ROLES = [
  "Data Scientist",
  "Full Stack Developer",
  "Machine Learning Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "DevOps Engineer",
  "AI Engineer",
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [gapResult, setGapResult] = useState<GapResult | null>(null);
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("skillgap_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history");
      }
    }
  }, []);

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

    const updated = [newItem, ...history].slice(0, 10); // Keep last 10
    setHistory(updated);
    localStorage.setItem("skillgap_history", JSON.stringify(updated));
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

      // Save to history
      saveToHistory(data, result.skills, result.filename);
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
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("skillgap_history");
  };

  const downloadReport = () => {
    if (!result || !gapResult) return;

    const report = `
SKILLGAP AI - CAREER ANALYSIS REPORT
=====================================

Resume: ${result.filename}
Target Role: ${gapResult.target_role}
Match Score: ${gapResult.match_score}%

-------------------------------------
EXTRACTED SKILLS (${result.skills.length})
-------------------------------------
${result.skills.map(s => `• ${s.name} (${s.category}) - ${Math.round(s.confidence * 100)}%`).join("\n")}

-------------------------------------
CRITICAL SKILLS
-------------------------------------
You have: ${gapResult.critical.has.join(", ") || "None"}
Missing: ${gapResult.critical.missing.join(", ") || "None"}

-------------------------------------
IMPORTANT SKILLS
-------------------------------------
You have: ${gapResult.important.has.join(", ") || "None"}
Missing: ${gapResult.important.missing.join(", ") || "None"}

-------------------------------------
LEARNING PATH
-------------------------------------
${gapResult.learning_path.map(item => `• ${item.skill}\n  → ${item.resource}`).join("\n\n")}

-------------------------------------
Generated by SkillGap AI
`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SkillGap_Report_${gapResult.target_role.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "programming": return "bg-blue-100 text-blue-800 border-blue-200";
      case "framework": return "bg-purple-100 text-purple-800 border-purple-200";
      case "tool": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "soft skill": return "bg-amber-100 text-amber-800 border-amber-200";
      case "domain": return "bg-pink-100 text-pink-800 border-pink-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-600";
    if (score >= 40) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            SkillGap AI
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload your resume → Extract skills → Analyze skill gaps → Get personalized learning path
          </p>

          {/* History Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              {showHistory ? "Hide History" : `View History (${history.length})`}
            </Button>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <Card className="shadow-xl border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Analysis History</CardTitle>
                <CardDescription>Your last 10 analyses (saved in browser)</CardDescription>
              </div>
              {history.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearHistory} className="text-red-600 border-red-200">
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-slate-500 text-sm">No history yet. Analyze a resume to save it here.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition"
                      onClick={() => loadHistoryItem(item)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-900">{item.target_role}</p>
                          <p className="text-sm text-slate-500">{item.filename}</p>
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

        {/* Upload Card */}
        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardHeader>
            <CardTitle className="text-xl">1. Upload Resume</CardTitle>
            <CardDescription>Supports PDF and TXT files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume">Choose your resume</Label>
              <Input
                id="resume"
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && (
                <p className="text-sm text-slate-500">Selected: {file.name}</p>
              )}
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
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extracted Skills */}
        {result && (
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle>
                Extracted Skills
                <span className="ml-2 text-base font-normal text-slate-500">
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
        )}

        {/* Skill Gap Section */}
        {result && (
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-xl">2. Skill Gap Analysis</CardTitle>
              <CardDescription>Select your target role to see missing skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Role</Label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Gap Results */}
        {gapResult && (
          <div className="space-y-6">

            {/* Match Score */}
            <Card className="shadow-xl border-0 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span>Match Score for {gapResult.target_role}</span>
                  <span className={`text-4xl font-bold ${getScoreColor(gapResult.match_score)}`}>
                    {gapResult.match_score}%
                  </span>
                </CardTitle>
                <div className="w-full bg-slate-100 rounded-full h-3 mt-2">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                    style={{ width: `${gapResult.match_score}%` }}
                  />
                </div>
              </CardHeader>
            </Card>

            {/* Critical Skills */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-rose-600">Critical Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-emerald-600 mb-2">You have:</p>
                  <div className="flex flex-wrap gap-2">
                    {gapResult.critical.has.length > 0 ? (
                      gapResult.critical.has.map((s) => (
                        <span key={s} className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium border border-emerald-200">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-rose-600 mb-2">Missing:</p>
                  <div className="flex flex-wrap gap-2">
                    {gapResult.critical.missing.length > 0 ? (
                      gapResult.critical.missing.map((s) => (
                        <span key={s} className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-sm font-medium border border-rose-200">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-emerald-600 font-medium">None – Excellent!</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Skills */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-amber-600">Important Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-emerald-600 mb-2">You have:</p>
                  <div className="flex flex-wrap gap-2">
                    {gapResult.important.has.map((s) => (
                      <span key={s} className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium border border-emerald-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-600 mb-2">Missing:</p>
                  <div className="flex flex-wrap gap-2">
                    {gapResult.important.missing.map((s) => (
                      <span key={s} className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium border border-amber-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Path */}
            {gapResult.learning_path.length > 0 && (
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-indigo-600">Learning Path</CardTitle>
                  <CardDescription>
                    Recommended resources for your missing skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {gapResult.learning_path.map((item, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-xl bg-indigo-50 border border-indigo-100"
                      >
                        <p className="font-semibold text-indigo-900">{item.skill}</p>
                        <p className="text-sm text-indigo-700 mt-1">{item.resource}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Download Report Button */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={downloadReport}
                variant="outline"
                size="lg"
                className="border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                Download Full Report (.txt)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}