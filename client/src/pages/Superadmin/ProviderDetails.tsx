import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, ArrowLeft, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProviderDetails() {
  const { name } = useParams();
  const navigate = useNavigate();

  // Fetch all systems to find the specific provider details
  const { data: systems = [], isLoading: isLoadingSystem } = useQuery({
    queryKey: ['systems'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/systems');
      if (!res.ok) throw new Error('Failed to fetch systems');
      return res.json();
    }
  });

  const selected = systems.find((s: any) => s.name === name);

  // Fetch shared data for this system
  const { data: sharedData = [], isLoading: isLoadingShared } = useQuery({
    queryKey: ['shared-data', selected?.id],
    queryFn: async () => {
      if (!selected?.id) return [];
      const res = await fetch(`http://localhost:4000/api/systems/${selected.id}/shared-data`);
      if (!res.ok) throw new Error('Failed to fetch shared data');
      return res.json();
    },
    enabled: !!selected?.id
  });

  // Mathematically flatten all citizen arrays from all historical payloads
  const unifiedCitizens = sharedData.reduce((acc: any[], data: any) => {
    if (data.payload?.citizens && Array.isArray(data.payload.citizens)) {
      const withDates = data.payload.citizens.map((c: any) => ({
        ...c,
        _receivedAt: new Date(data.createdAt).toLocaleString()
      }));
      return [...acc, ...withDates];
    }
    return acc;
  }, []);

  // For payloads that don't match the new arrays (legacy data dump)
  const legacyData = sharedData.filter((data: any) => !(data.payload?.citizens && Array.isArray(data.payload.citizens)));

  if (isLoadingSystem) {
    return <div className="text-center text-muted-foreground p-10">Loading Provider Data...</div>;
  }

  if (!selected) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Provider Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/providers')}>Return to Directory</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/providers')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{selected.name}</h1>
            <Badge variant={selected.status === "active" ? "default" : (selected.status === "pending" ? "outline" : "destructive")} className={selected.status === "active" ? "bg-success text-success-foreground" : ""}>
              {selected.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Provider Details & Unified Data Records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">System Name</Label>
              <div className="mt-1 font-mono text-sm bg-muted p-2 rounded">{selected.name}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">API Key (Read Only)</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input readOnly value={selected.apiKey || ""} className="font-mono text-xs bg-muted" />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Registered At</Label>
              <div className="mt-1 text-sm bg-muted p-2 rounded">
                {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ""}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Requested Permissions</Label>
              <div className="mt-1 text-sm bg-muted p-4 rounded-md min-h-[100px] whitespace-pre-wrap">
                {selected.permissions?.capabilities || "No specific permissions requested"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-foreground text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Unified Citizens Database ({unifiedCitizens.length} Records)
          </Label>
        </div>
        
        {isLoadingShared ? (
          <div className="text-sm text-muted-foreground p-8 text-center border rounded-md">Aggregating shared data...</div>
        ) : unifiedCitizens.length === 0 ? (
          <div className="text-sm text-muted-foreground italic bg-muted/30 p-8 rounded-md text-center border border-dashed">
            This system has not transmitted any structured citizen data to the main CDEMS network yet.
          </div>
        ) : (
          <Card className="overflow-hidden border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-muted text-muted-foreground">
                  <tr className="border-b border-border/50 text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Age/Gender</th>
                    <th className="px-4 py-3 font-semibold">Address</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-center">Blotters</th>
                    <th className="px-4 py-3 font-semibold text-right">Received At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 bg-card">
                  {unifiedCitizens.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-foreground font-medium">{c.lastName ? `${c.lastName},` : ''} {c.firstName || 'Unknown'} {c.middleName && c.middleName.charAt(0)+'.'} {c.suffix || ''}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.age ? `${c.age} yrs` : '-'} / {c.gender?.charAt(0) || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={`${c.street || ''} ${c.barangay || ''}, ${c.city || ''}`}>
                        {c.barangay ? `${c.street || ''} ${c.barangay}, ${c.city || ''}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {c.clearanceStatus ? (
                          <Badge variant={c.clearanceStatus === 'Cleared' ? 'default' : 'outline'} className={c.clearanceStatus === 'Cleared' ? 'bg-success/20 text-success border-success/30' : ''}>
                            {c.clearanceStatus}
                          </Badge>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.incidentCount !== undefined ? (
                          <span className={c.incidentCount > 0 ? "text-destructive font-bold" : "text-muted-foreground"}>
                            {c.incidentCount}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground text-right">
                        {c._receivedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {legacyData.length > 0 && (
        <div className="pt-8">
          <Label className="text-muted-foreground text-sm font-semibold flex items-center gap-2 mb-3">
            Legacy / Unstructured Payloads ({legacyData.length})
          </Label>
          <div className="space-y-3">
            {legacyData.map((data: any) => (
              <div key={data.id} className="bg-muted p-4 rounded-md border text-xs relative">
                <div className="absolute top-2 right-2 text-[10px] text-muted-foreground">
                  {new Date(data.createdAt).toLocaleString()}
                </div>
                <pre className="mt-4 font-mono whitespace-pre-wrap text-foreground overflow-x-auto">
                  {JSON.stringify(data.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
