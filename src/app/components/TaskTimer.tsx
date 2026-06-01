import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Plus, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocalStorage, STORAGE_KEYS, type Task } from "../../store";

export function TaskTimer() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEYS.tasks, []);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    let interval: number | undefined;

    if (isRunning && activeTaskId) {
      interval = window.setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
        setTasks((tasks) =>
          tasks.map((task) =>
            task.id === activeTaskId ? { ...task, timeSpent: task.timeSpent + 1 } : task
          )
        );
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, activeTaskId]);

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle,
        completed: false,
        timeSpent: 0,
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle("");
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  };

  const deleteTask = (id: string) => {
    if (activeTaskId === id) {
      setIsRunning(false);
      setActiveTaskId(null);
      setTimeElapsed(0);
    }
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const startTimer = (taskId: string) => {
    if (activeTaskId !== taskId) {
      setActiveTaskId(taskId);
      setTimeElapsed(tasks.find((t) => t.id === taskId)?.timeSpent || 0);
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    if (activeTaskId) {
      setTasks(tasks.map((task) => (task.id === activeTaskId ? { ...task, timeSpent: 0 } : task)));
      setTimeElapsed(0);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl">Tasks & Focus</h2>
        <p className="text-muted-foreground">Work with your energy, not against it</p>
      </div>

      <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
        <div className="text-center mb-8">
          <div className="text-6xl font-light mb-4">{formatTime(timeElapsed)}</div>
          {activeTask && (
            <p className="text-muted-foreground mb-6">Working on: {activeTask.title}</p>
          )}
          <div className="flex justify-center gap-3">
            {!isRunning ? (
              <button
                onClick={() => activeTaskId && startTimer(activeTaskId)}
                disabled={!activeTaskId}
                className="p-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Play className="w-6 h-6" fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="p-4 bg-accent text-accent-foreground rounded-full hover:bg-accent/90 transition-all"
              >
                <Pause className="w-6 h-6" fill="currentColor" />
              </button>
            )}
            <button
              onClick={resetTimer}
              disabled={!activeTaskId}
              className="p-4 bg-muted hover:bg-muted/70 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="What needs your attention today?"
              className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={addTask}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  task.id === activeTaskId
                    ? "bg-primary/10 border-primary"
                    : "bg-background border-border hover:border-primary/30"
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground hover:border-primary"
                  }`}
                >
                  {task.completed && <Check className="w-3 h-3" />}
                </button>

                <div className="flex-1">
                  <p className={`${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                  {task.timeSpent > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(task.timeSpent)} spent
                    </p>
                  )}
                </div>

                <button
                  onClick={() => startTimer(task.id)}
                  disabled={task.completed}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  {task.id === activeTaskId ? "Active" : "Start"}
                </button>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Add a task to start focusing</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-secondary/20 p-6 rounded-2xl border border-secondary/30">
        <p className="text-sm text-foreground/80 italic text-center">
          Remember: it's okay to pause, rest, or switch tasks. Listen to what you need.
        </p>
      </div>
    </div>
  );
}
