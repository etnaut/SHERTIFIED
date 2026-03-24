import { useState } from "react";
import { Search, Upload, Eye, Share2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

const actionIcons: Record<string, any> = {
  submitted: Upload,
  accessed: Eye,
  shared: Share2,
};

const actionColors: Record<string, string> = {
  submitted: "text-secondary",
  accessed: "text-primary",
  shared: "text-success",
};

export default function InfoTracker() {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);

  const { data: citizenRecords = [], isLoading } = useQuery({
    queryKey: ['citizen-records'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/citizen-records');
      if (!res.ok) throw new Error('Failed to fetch records');
      return res.json();
    }
  });

  const handleSearch = () => {
    if (!search.trim()) return;
    setSearched(true);
    const found = citizenRecords.find(
      (c: any) =>
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.citizenId.toLowerCase().includes(search.toLowerCase())
    );
    setResult(found || null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Information Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">Track citizen data flow across registered offices. (Connects to DB Activity table eventually)</p>
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

      {!isLoading && citizenRecords.length === 0 && (
        <Card className="mt-6 border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            No citizen tracking data initialized in the backend database yet!
          </CardContent>
        </Card>
      )}

      {searched && !result && citizenRecords.length > 0 && (
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
              <Badge variant="outline">{result?.timeline?.length || 0} entries</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* dynamic timeline ui */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
