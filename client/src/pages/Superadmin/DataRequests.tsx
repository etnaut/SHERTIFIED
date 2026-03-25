import { useState } from "react";
import { CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function DataRequests() {
  const [detailDialog, setDetailDialog] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['data-requests'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/data-requests');
      if (!res.ok) throw new Error('Failed to fetch data requests');
      return res.json();
    }
  });

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await fetch(`http://localhost:4000/api/data-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-requests'] });
      setDetailDialog(null);
    }
  });

  const pending = requests.filter((r: any) => r.status === "pending");
  const processed = requests.filter((r: any) => r.status !== "pending");

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading Inter-office Requests...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inter-Office Data Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and authorize granular data access between connected providers.</p>
      </div>

      {pending.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground border-dashed">No actual data requests strictly pending. Ready for future integration with the DB.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Badge variant="destructive" className="bg-warning text-warning-foreground">{pending.length} Pending</Badge>
            Requires Authorization
          </h2>
          {pending.map((req: any) => (
            <Card key={req.id} className="animate-slide-up hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 cursor-pointer" onClick={() => setDetailDialog(req)}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">{req.requester?.name}</Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{req.target?.name}</Badge>
                    <Badge className="bg-warning/10 text-warning border-0 ml-2">
                      <Clock className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground font-medium">
                    "{req.requester?.name}" is requesting {req.requested_columns?.length} specific data columns from "{req.target?.name}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested on: {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button 
                    size="sm" 
                    className="bg-success hover:bg-success/90 text-success-foreground"
                    disabled={isUpdating}
                    onClick={(e) => { e.stopPropagation(); updateStatus({ id: req.id, status: 'approved' }); }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    disabled={isUpdating}
                    onClick={(e) => { e.stopPropagation(); updateStatus({ id: req.id, status: 'rejected' }); }}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Deny
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <div className="pt-6 border-t border-border/50">
          <h2 className="text-lg font-semibold text-foreground mb-3">Historical Logs</h2>
          <div className="space-y-3">
            {processed.map((req: any) => (
              <Card key={req.id} className="opacity-75 hover:opacity-100 transition-opacity">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{req.requester?.name}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground">{req.target?.name}</span>
                      <Badge variant={req.status === 'approved' ? 'default' : 'destructive'} className={req.status === 'approved' ? 'bg-success/10 text-success border-success/30' : ''}>
                        {req.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Requested {req.requested_columns?.length} columns on {new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setDetailDialog(req)}>View Details</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Data Request Logistics</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4 bg-muted p-4 rounded-md">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Requester</p>
                  <p className="font-semibold">{detailDialog.requester?.name}</p>
                </div>
                <ArrowRight className="text-muted-foreground h-6 w-6" />
                <div className="flex-1 text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target Provider</p>
                  <p className="font-semibold text-primary">{detailDialog.target?.name}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Identified Columns Requested ({detailDialog.requested_columns?.length})</p>
                <div className="flex flex-wrap gap-2">
                  {detailDialog.requested_columns?.map((col: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="font-mono text-xs">{col}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">Timestamp: {new Date(detailDialog.createdAt).toLocaleString()}</p>
                <Badge variant={detailDialog.status === 'approved' ? 'default' : (detailDialog.status === 'rejected' ? 'destructive' : 'outline')} className={detailDialog.status === 'approved' ? 'bg-success text-success-foreground' : ''}>
                  STATUS: {detailDialog.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDetailDialog(null)}>Close Window</Button>
            {detailDialog?.status === 'pending' && (
              <>
                <Button variant="destructive" onClick={() => updateStatus({ id: detailDialog.id, status: 'rejected' })} disabled={isUpdating}>Reject</Button>
                <Button className="bg-success hover:bg-success/90" onClick={() => updateStatus({ id: detailDialog.id, status: 'approved' })} disabled={isUpdating}>Authorize Share</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
