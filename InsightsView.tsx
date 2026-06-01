import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockData = [
  { day: "Mon", energy: 3, mood: 4, focus: 3 },
  { day: "Tue", energy: 4, mood: 4, focus: 4 },
  { day: "Wed", energy: 5, mood: 5, focus: 5 },
  { day: "Thu", energy: 4, mood: 3, focus: 4 },
  { day: "Fri", energy: 3, mood: 3, focus: 3 },
  { day: "Sat", energy: 2, mood: 2, focus: 2 },
  { day: "Sun", energy: 3, mood: 3, focus: 3 },
];

export function InsightsView() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl mb-6">Your patterns</h2>

      <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
        <h3 className="mb-4">This week's rhythm</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Your energy, mood, and focus over the past 7 days
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0d5cc" />
            <XAxis dataKey="day" stroke="#8a8580" />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#8a8580" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e0d5cc",
                borderRadius: "0.75rem",
              }}
            />
            <Line
              type="monotone"
              dataKey="energy"
              stroke="#d4a59a"
              strokeWidth={2}
              dot={{ fill: "#d4a59a", r: 4 }}
              name="Energy"
            />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#b8a99a"
              strokeWidth={2}
              dot={{ fill: "#b8a99a", r: 4 }}
              name="Mood"
            />
            <Line
              type="monotone"
              dataKey="focus"
              stroke="#9fa891"
              strokeWidth={2}
              dot={{ fill: "#9fa891", r: 4 }}
              name="Focus"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="mb-3">What you've noticed</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span className="text-muted-foreground">
                Your energy peaks mid-week, around Wednesday
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span className="text-muted-foreground">
                You tend to feel more introspective on weekends
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span className="text-muted-foreground">
                Your focus aligns closely with your energy levels
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="mb-3">Working with your rhythm</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span className="text-muted-foreground">
                Schedule deep work during your high-energy days
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span className="text-muted-foreground">
                Plan lighter tasks when you need gentler pace
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span className="text-muted-foreground">
                Honor your body's natural need for rest
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20">
        <p className="text-sm text-foreground/80 italic text-center">
          "This is your rhythm. There's no one else's pattern to match, no benchmark to meet. Just
          you, understanding yourself a little better each day."
        </p>
      </div>
    </div>
  );
}
