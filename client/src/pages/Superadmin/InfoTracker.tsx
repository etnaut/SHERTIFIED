import { useState } from "react";
import { Search, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function InfoTracker() {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearched(true);
    setLoading(true);
    setResult(null);
    setSelectedSource(null);

    try {
      const res = await fetch(`http://localhost:4000/api/info-tracker/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setResult(data || null);
    } catch (e) {
      console.error(e);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const displayRecord = result ? (selectedSource && result.systemRecords && result.systemRecords[selectedSource] 
    ? result.systemRecords[selectedSource] 
    : result.record) : null;

  const priorityKeys = [
    'firstName', 'middleName', 'lastName',
    'age', 'birthDate', 'gender', 'civilStatus', 'civil_status', 
    'contactNumber', 'emailAddress',
    'purok', 'barangay', 'city', 'province'
  ];

  let displayKeys: string[] = [];
  if (displayRecord) {
    displayKeys = Object.keys(displayRecord).filter(k => !['clearanceStatus', 'status', 'citizenId'].includes(k));
    displayKeys.sort((a, b) => {
      const iA = priorityKeys.indexOf(a);
      const iB = priorityKeys.indexOf(b);
      if (iA !== -1 && iB !== -1) return iA - iB;
      if (iA !== -1) return -1;
      if (iB !== -1) return 1;
      return a.localeCompare(b);
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Information Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">Cross-reference unified citizen records across all registered office databases.</p>
      </div>

      <div className="flex gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by full name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <button onClick={handleSearch} disabled={loading} className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50">
          {loading ? 'Searching...' : 'Search Engine'}
        </button>
      </div>

      {!searched && (
        <Card className="mt-6 border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            Search for a citizen to assemble their unified profile from all available CDEMS partner databases.
          </CardContent>
        </Card>
      )}

      {searched && !loading && !result && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No records found across any connected databases for "{search}".
          </CardContent>
        </Card>
      )}

      {result && displayRecord && (
        <Card className="animate-slide-up mt-6 border-secondary/20 border-2">
          <CardHeader className="bg-muted/50 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl text-primary font-mono">{result.record.citizenId || 'Citizen Profile'}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge 
                    variant={selectedSource === null ? "default" : "outline"} 
                    className={`text-xs cursor-pointer border-secondary/20 transition-colors ${selectedSource === null ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : 'bg-secondary/10 text-secondary hover:bg-secondary/20'}`}
                    onClick={() => setSelectedSource(null)}
                  >
                    <Database className="w-3 h-3 mr-1" /> Multi-System Sync
                  </Badge>
                  {result.sources.map((src: string) => (
                    <Badge 
                      key={src} 
                      variant={selectedSource === src ? "default" : "secondary"} 
                      className="text-xs cursor-pointer transition-colors"
                      onClick={() => setSelectedSource(selectedSource === src ? null : src)}
                    >
                      {src}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-xs text-muted-foreground mb-1">Clearance Status</div>
                <Badge className={displayRecord.clearanceStatus === 'Cleared' || displayRecord.status === 'Active Resident' ? 'bg-success hover:bg-success' : 'bg-destructive hover:bg-destructive'}>
                  {displayRecord.clearanceStatus || displayRecord.status || 'Unknown'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2">
              {selectedSource ? `${selectedSource} Record` : 'Unified Master Record'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4">
              {displayKeys.map(key => (
                <div key={key} className="space-y-1">
                  <span className="text-xs text-muted-foreground capitalize break-words font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="font-medium text-sm text-foreground break-words">{String(displayRecord[key] || '-')}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
