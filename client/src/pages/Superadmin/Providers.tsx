import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

export default function Providers() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Fetch all systems
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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
        <div className="text-center text-muted-foreground p-8">Loading providers directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((provider: any) => (
            <Card
              key={provider.id}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => navigate(`/providers/${provider.name}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                    <Building2 className="h-5 w-5 text-secondary" />
                  </div>
                  <Badge variant={provider.status === "active" ? "default" : (provider.status === "pending" ? "outline" : "destructive")} className={provider.status === "active" ? "bg-success text-success-foreground" : ""}>
                    {provider.status.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground">{provider.name}</h3>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">Registered: {new Date(provider.createdAt).toLocaleDateString()}</span>
                  <span className="text-xs font-medium text-foreground">System Name: {provider.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground col-span-full p-8 text-center border rounded-md border-dashed">
              No systems match your search.
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && !isLoading && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50 text-sm font-medium hover:bg-muted"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50 text-sm font-medium hover:bg-muted"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
