import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Providers() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const { data: systems = [], isLoading } = useQuery({
    queryKey: ['systems'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/systems');
      if (!res.ok) throw new Error('Failed to fetch systems');
      return res.json();
    }
  });

  const filtered = systems.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registered Providers</h1>
          <p className="text-sm text-muted-foreground mt-1">External offices and connected systems</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search systems..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading systems...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((provider: any) => (
            <Card
              key={provider.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelected(provider)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-secondary" />
                  </div>
                  <Badge variant={provider.status === "active" ? "default" : (provider.status === "pending" ? "outline" : "destructive")} className={provider.status === "active" ? "bg-success text-success-foreground" : ""}>
                    {provider.status.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground">{provider.name}</h3>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">Registered: {new Date(provider.createdAt).toLocaleDateString()}</span>
                  <span className="text-xs font-medium text-foreground">ID: {provider.id}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground col-span-full">No systems found.</div>
          )}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Status</Label>
              <div className="mt-1">
                <Badge variant={selected?.status === "active" ? "default" : "outline"} className={selected?.status === "active" ? "bg-success text-success-foreground" : ""}>
                  {selected?.status.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">API Key</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input readOnly value={selected?.apiKey || ""} className="font-mono text-sm bg-muted" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">This key is used by the external system to authenticate.</p>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Requested Permissions</Label>
              <div className="mt-1 text-sm bg-muted p-3 rounded-md min-h-[60px]">
                {selected?.permissions?.capabilities || "No specific permissions requested"}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Registered At</Label>
              <div className="mt-1 text-sm">
                {selected?.createdAt ? new Date(selected.createdAt).toLocaleString() : ""}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
