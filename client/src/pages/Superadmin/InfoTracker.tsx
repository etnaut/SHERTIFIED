import { useState } from "react";
import { Search, Upload, Eye, Share2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { citizenRecords, CitizenRecord } from "@/lib/mock-data";

const actionIcons = {
  submitted: Upload,
  accessed: Eye,
  shared: Share2,
};

const actionColors = {
  submitted: "text-secondary",
  accessed: "text-primary",
  shared: "text-success",
};

export default function InfoTracker() {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<CitizenRecord | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!search.trim()) return;
    setSearched(true);
    const found = citizenRecords.find(
      (c) =>
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.citizenId.toLowerCase().includes(search.toLowerCase())
    );
    setResult(found || null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Information Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">Track citizen data flow across registered offices</p>
      </div>

      <div className="flex gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or Citizen ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <button onClick={handleSearch} className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/90 transition-colors">
          Search
        </button>
      </div>

      <p className="text-xs text-muted-foreground">Try: "Juan Dela Cruz", "Maria Clara Santos", or "CIT-2024-0001"</p>

      {searched && !result && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No records found for "{search}". Try a different name or ID.
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="animate-slide-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{result.fullName}</CardTitle>
                <p className="text-sm text-muted-foreground font-mono">{result.citizenId}</p>
              </div>
              <Badge variant="outline">{result.timeline.length} entries</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {result.timeline.map((entry, i) => {
                  const Icon = actionIcons[entry.action];
                  return (
                    <div key={i} className="relative flex gap-4 pl-0">
                      <div className={`w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center shrink-0 z-10 ${actionColors[entry.action]}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{entry.office}</p>
                          <Badge variant="outline" className="text-[10px]">{entry.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{entry.dateTime}</span>
                        </div>
                        <Badge className={`mt-2 text-[10px] border-0 ${
                          entry.action === "submitted" ? "bg-secondary/10 text-secondary" :
                          entry.action === "accessed" ? "bg-primary/10 text-primary" :
                          "bg-success/10 text-success"
                        }`}>
                          {entry.action}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
