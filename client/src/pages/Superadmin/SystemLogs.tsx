import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Search, ShieldAlert, Cpu, ArrowRightLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function SystemLogs() {
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['system-logs'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/system-logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    },
    refetchInterval: 5000 // auto refresh every 5s to feel live
  });

  const filtered = logs.filter((log: any) => 
    log.actor.toLowerCase().includes(search.toLowerCase()) || 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.target.toLowerCase().includes(search.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('status') || a.includes('approv') || a.includes('reject')) return <ShieldAlert className="w-4 h-4 text-primary" />;
    if (a.includes('share') || a.includes('request')) return <ArrowRightLeft className="w-4 h-4 text-secondary" />;
    return <Cpu className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time tracking of data exchanges and administrative commands.</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by actor, action, or target..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground flex justify-center items-center gap-2">
              <Activity className="w-4 h-4 animate-spin" /> Fetching latest audit trails...
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="citizen-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor / Subsystem</th>
                    <th>Action</th>
                    <th>Target Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">No logs match your filter.</td>
                    </tr>
                  ) : (
                    filtered.map((log: any) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="font-medium">
                          <Badge variant={log.actor === 'Superadmin' ? 'destructive' : 'secondary'} className="rounded-sm">
                            {log.actor}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            {getActionIcon(log.action)}
                            {log.action}
                          </div>
                        </td>
                        <td className="text-sm text-muted-foreground max-w-xs truncate" title={log.target}>
                          {log.target}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
