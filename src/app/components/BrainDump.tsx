import { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useLocalStorage, STORAGE_KEYS, type DumpEntry } from "../../store";

export function BrainDump() {
  const [entries, setEntries] = useLocalStorage<DumpEntry[]>(STORAGE_KEYS.dumps, []);
  const [currentDump, setCurrentDump] = useState("");
  const [showPrevious, setShowPrevious] = useState(false);

  const addEntry = () => {
    if (currentDump.trim()) {
      setEntries((prev) => [
        {
          id: Date.now().toString(),
          content: currentDump,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCurrentDump("");
    }
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl">Brain Dump</h2>
        <p className="text-muted-foreground">
          Let it all out. No editing, no organizing—just release.
        </p>
      </div>

      <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
        <textarea
          value={currentDump}
          onChange={(e) => setCurrentDump(e.target.value)}
          placeholder="What's on your mind? Let it flow..."
          className="w-full h-64 p-6 rounded-xl bg-background border border-border resize-none focus:outline-none focus:ring-2 focus:ring-ring text-base"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) {
              addEntry();
            }
          }}
        />
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-muted-foreground">
            Press ⌘+Enter to save, or click below
          </span>
          <button
            onClick={addEntry}
            disabled={!currentDump.trim()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Release
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setShowPrevious(!showPrevious)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showPrevious ? "rotate-180" : ""}`}
            />
            <span className="text-sm">Previous dumps ({entries.length})</span>
          </button>

          {showPrevious && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-muted/50 p-6 rounded-xl border border-border group hover:border-primary/30 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(entry.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="whitespace-pre-wrap text-foreground/90">{entry.content}</p>
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Your brain dumps will appear here once you release them</p>
        </div>
      )}
    </div>
  );
}
