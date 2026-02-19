import { useEditorStore } from "@/stores/editorStore";
import { useEffect, useState, useRef } from "react";
import {
  Clock,
  FileText,
  ShieldCheck,
  Timer,
  CheckCircle2,
  Circle,
} from "lucide-react";

function HealthBar({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive";
  const label =
    score >= 75 ? "Excellent" : score >= 50 ? "Good" : "Needs Work";
  return (
    <div className="flex items-center gap-2">
      <ShieldCheck size={11} className="text-muted-foreground" />
      <div className="w-14 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-muted-foreground hidden sm:inline">{label}</span>
    </div>
  );
}

function FocusTimer() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <button
      onClick={() => {
        if (running) { setRunning(false); setSeconds(0); }
        else setRunning(true);
      }}
      title={running ? "Stop focus timer" : "Start focus timer"}
      className={`flex items-center gap-1.5 transition-colors ${running ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
    >
      <Timer size={11} />
      <span className="tabular-nums">{fmt(seconds)}</span>
    </button>
  );
}

export function StatusBar() {
  const { wordCount, charCount, readingTime, contentHealthScore, isZenMode, activeDocumentId } =
    useEditorStore();
  const [saved, setSaved] = useState(true);

  // Flash "Saving…" briefly on content change
  useEffect(() => {
    setSaved(false);
    const t = setTimeout(() => setSaved(true), 900);
    return () => clearTimeout(t);
  }, [wordCount]);

  return (
    <div
      className={`status-bar h-7 border-t border-border bg-secondary/50 px-4 flex items-center justify-between text-xs select-none transition-opacity duration-300${isZenMode ? " opacity-0 pointer-events-none" : ""}`}
    >
      {/* Left */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FileText size={11} />
          {wordCount.toLocaleString()} words
        </span>
        <span className="text-border hidden sm:inline">·</span>
        <span className="hidden sm:inline">{charCount.toLocaleString()} chars</span>
        <span className="text-border hidden md:inline">·</span>
        <span className="hidden md:flex items-center gap-1.5">
          <Clock size={11} />
          {readingTime} min read
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <HealthBar score={contentHealthScore} />
        <span className="text-border hidden sm:inline">·</span>
        <FocusTimer />
        <span className="text-border">·</span>
        <span className={`flex items-center gap-1 transition-colors ${saved ? "text-success" : "text-warning"}`}>
          {saved ? <CheckCircle2 size={11} /> : <Circle size={11} className="animate-pulse" />}
          <span>{saved ? "Saved" : "Saving…"}</span>
        </span>
      </div>
    </div>
  );
}
