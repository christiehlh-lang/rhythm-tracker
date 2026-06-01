import { useState } from "react";
import { Upload, Calendar as CalendarIcon, Link as LinkIcon, CheckCircle2 } from "lucide-react";

export function CalendarIntegration() {
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploading(true);
      setTimeout(() => {
        setUploading(false);
        setConnected(true);
      }, 1500);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl">Calendar Integration</h2>
        <p className="text-muted-foreground">
          Connect your schedule to see how it aligns with your rhythm
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-primary" />
            </div>
            <h3>Connect Notion</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Sync your Notion calendar to track commitments alongside your energy levels
          </p>
          <button
            onClick={() => setConnected(true)}
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all"
          >
            {connected ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Connected
              </span>
            ) : (
              "Connect Notion"
            )}
          </button>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-secondary" />
            </div>
            <h3>External Calendar</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Connect Google Calendar, Outlook, or any calendar that supports .ics export
          </p>
          <button className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-all">
            Connect Calendar
          </button>
        </div>
      </div>

      <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
            <Upload className="w-5 h-5 text-accent" />
          </div>
          <h3>Upload Files</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Upload your schedule as an .ics file or PDF to import events
        </p>

        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            accept=".ics,.pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {uploading ? (
              <p className="text-sm text-muted-foreground">Uploading...</p>
            ) : (
              <>
                <p className="text-sm mb-2">Drop your .ics or PDF file here</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </>
            )}
          </label>
        </div>

        {connected && (
          <div className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-sm text-foreground/80 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Your calendar has been imported. Events will now appear in your rhythm view.
            </p>
          </div>
        )}
      </div>

      <div className="bg-muted/50 p-6 rounded-2xl border border-border">
        <h4 className="text-sm font-medium mb-3">Why connect your calendar?</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>See how your scheduled commitments align with your natural energy patterns</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Notice when you're scheduling against your rhythm and adjust accordingly</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>
              Build a practice of honoring both your commitments and your body's needs
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
