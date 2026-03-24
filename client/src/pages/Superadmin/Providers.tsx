import { useState } from "react";
import { Building2, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { providers, Provider } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const mockRecords = Array.from({ length: 25 }, (_, i) => ({
  id: `REC-${String(i + 1).padStart(4, "0")}`,
  name: ["Juan Dela Cruz", "Maria Santos", "Pedro Lim", "Ana Reyes", "Rosa Garcia"][i % 5],
  type: ["Certificate", "Permit", "Registration", "License", "Record"][i % 5],
  date: `2025-03-${String(20 - (i % 15)).padStart(2, "0")}`,
  status: ["Verified", "Pending", "Processed"][i % 3],
}));

export default function Providers() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Provider | null>(null);
  const [recordSearch, setRecordSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = providers.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.acronym.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRecords = mockRecords.filter(
    (r) =>
      r.name.toLowerCase().includes(recordSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(recordSearch.toLowerCase())
  );
  const totalPages = Math.ceil(filteredRecords.length / perPage);
  const paginatedRecords = filteredRecords.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registered Providers</h1>
          <p className="text-sm text-muted-foreground mt-1">Approved data provider offices and agencies</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search providers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((provider) => (
          <Card
            key={provider.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => { setSelected(provider); setPage(1); setRecordSearch(""); }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-secondary" />
                </div>
                <Badge variant={provider.status === "active" ? "default" : "destructive"} className={provider.status === "active" ? "bg-success text-success-foreground" : ""}>
                  {provider.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground">{provider.name}</h3>
              <p className="text-xs text-muted-foreground">{provider.acronym}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <span className="text-xs text-muted-foreground">Registered: {provider.dateRegistered}</span>
                <span className="text-xs font-medium text-foreground">{provider.recordCount.toLocaleString()} records</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selected?.name} ({selected?.acronym})</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">{selected?.description}</p>

          <div className="relative max-w-xs mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={recordSearch}
              onChange={(e) => { setRecordSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="text-xs px-3 py-1 rounded bg-muted text-foreground disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="text-xs px-3 py-1 rounded bg-muted text-foreground disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
