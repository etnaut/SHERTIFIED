import { useState } from "react";
import { CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

export default function DataRequests() {
  const [detailDialog, setDetailDialog] = useState<any | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['data-requests'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/data-requests');
      if (!res.ok) throw new Error('Failed to fetch data requests');
      return res.json();
    }
  });

  const pending = requests.filter((r: any) => r.status === "pending");
  const processed = requests.filter((r: any) => r.status !== "pending");

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading specific inter-office requests...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inter-Office Data Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Review specific data point access requests between systems</p>
      </div>

      {pending.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground border-dashed">No actual data requests strictly pending. Ready for future integration with the DB.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {pending.map((req: any) => (
            <Card key={req.id} className="animate-slide-up cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailDialog(req)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{req.requesterAcronym}</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline">{req.targetProviderAcronym}</Badge>
                      <Badge className="bg-warning/10 text-warning border-0 ml-2">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground font-medium">{req.requesterName} requests access to {req.targetProviderName}</p>
                    <p className="text-xs text-muted-foreground mt-1">Data Type: {req.dataType} • {req.dateRequested}</p>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground">
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive">
                      <XCircle className="h-4 w-4 mr-1" /> Deny
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Processed Requests</h2>
          <div className="space-y-3">
            {processed.map((req: any) => (
              <Card key={req.id} className="opacity-70">
                <CardContent className="p-4 flex items-center justify-between">
                  {/* ... same as previous ... */}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Data Request Details</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
