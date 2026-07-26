import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Calendar() {
  // Calendar UI skeleton
  const days = Array.from({ length: 35 }, (_, i) => i - 2);

  return (
    <div className="space-y-8 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Schedule and organize your content.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Today</Button>
          <div className="flex items-center gap-1 bg-secondary rounded-md p-1">
            <Button variant="ghost" size="sm" className="h-7 px-2">Month</Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 bg-background shadow-sm">Week</Button>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground">{day}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-border gap-[1px]">
          {days.map((day, i) => {
            const isCurrentMonth = day > 0 && day <= 31;
            return (
              <div key={i} className={`bg-card p-2 hover:bg-muted/50 transition-colors ${!isCurrentMonth ? 'text-muted-foreground/30' : ''}`}>
                <div className="text-sm font-medium mb-1">{day > 0 && day <= 31 ? day : day <= 0 ? 30 + day : day - 31}</div>
                {day === 15 && (
                  <div className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded truncate mb-1 border border-primary/30">
                    Product Launch
                  </div>
                )}
                {day === 18 && (
                  <div className="bg-amber-500/20 text-amber-500 text-xs px-1.5 py-0.5 rounded truncate border border-amber-500/30">
                    Feature Update
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
