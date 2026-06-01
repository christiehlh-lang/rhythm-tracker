import { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  Circle,
  Brain,
  Timer,
  Moon,
  Home,
  Link as LinkIcon,
} from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { DailyTracker } from "./components/DailyTracker";
import { InsightsView } from "./components/InsightsView";
import { CalendarView } from "./components/CalendarView";
import { BrainDump } from "./components/BrainDump";
import { TaskTimer } from "./components/TaskTimer";
import { RhythmTracker } from "./components/RhythmTracker";
import { CalendarIntegration } from "./components/CalendarIntegration";
import { InstallPrompt } from "./components/InstallPrompt";
import { registerServiceWorker } from "../utils/pwa";

type Tab =
  | "dashboard"
  | "today"
  | "calendar"
  | "insights"
  | "brain-dump"
  | "tasks"
  | "rhythm"
  | "integrations";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  useEffect(() => {
    // Register service worker for PWA
    registerServiceWorker();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Circle className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl">Your Rhythm</h1>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <NavButton
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
              icon={<Home className="w-4 h-4" />}
              label="Dashboard"
            />
            <NavButton
              active={activeTab === "today"}
              onClick={() => setActiveTab("today")}
              icon={<Circle className="w-4 h-4" />}
              label="Today"
            />
            <NavButton
              active={activeTab === "rhythm"}
              onClick={() => setActiveTab("rhythm")}
              icon={<Moon className="w-4 h-4" />}
              label="Rhythm"
            />
            <NavButton
              active={activeTab === "brain-dump"}
              onClick={() => setActiveTab("brain-dump")}
              icon={<Brain className="w-4 h-4" />}
              label="Brain Dump"
            />
            <NavButton
              active={activeTab === "tasks"}
              onClick={() => setActiveTab("tasks")}
              icon={<Timer className="w-4 h-4" />}
              label="Tasks"
            />
            <NavButton
              active={activeTab === "calendar"}
              onClick={() => setActiveTab("calendar")}
              icon={<Calendar className="w-4 h-4" />}
              label="Calendar"
            />
            <NavButton
              active={activeTab === "insights"}
              onClick={() => setActiveTab("insights")}
              icon={<TrendingUp className="w-4 h-4" />}
              label="Insights"
            />
            <NavButton
              active={activeTab === "integrations"}
              onClick={() => setActiveTab("integrations")}
              icon={<LinkIcon className="w-4 h-4" />}
              label="Connect"
            />
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "today" && <DailyTracker />}
        {activeTab === "calendar" && <CalendarView />}
        {activeTab === "insights" && <InsightsView />}
        {activeTab === "brain-dump" && <BrainDump />}
        {activeTab === "tasks" && <TaskTimer />}
        {activeTab === "rhythm" && <RhythmTracker />}
        {activeTab === "integrations" && <CalendarIntegration />}
      </main>

      <footer className="border-t border-border mt-20 py-8">
        <p className="text-center text-sm text-muted-foreground">
          Your data stays with you. No comparisons, no benchmarks—just your own story.
        </p>
      </footer>

      <InstallPrompt />
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-xl transition-all whitespace-nowrap ${
        active ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted"
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}