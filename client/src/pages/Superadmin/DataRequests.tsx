import { useState } from "react";
import { CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { dataRequests, DataRequest } from "@/lib/mock-data";
import { toast } from "sonner";

export default function DataRequests() {
  const [requests, setRequests] = useState(dataRequests);
  const [detailDialog, setDetailDialog] = useState<DataRequest | null>(null);

  const handleAction = (id: string, action: "approved" | "denied") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action } : r))
    );
    toast.success(`Data request ${action}.`);
    setDetailDialog(null);
  };

  const pending = requests.filter((r) => r.status === "pending");
  const processed = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Review inter-office data access requests</p>
      </div>

      {pending.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No pending data requests.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {pending.map((req) => (
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
                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={(e) => { e.stopPropagation(); handleAction(req.id, "approved"); }}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleAction(req.id, "denied"); }}>
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
            {processed.map((req) => (
              <Card key={req.id} className="opacity-70">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{req.requesterAcronym}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-foreground">{req.targetProviderAcronym}</span>
                    <span className="text-xs text-muted-foreground ml-2">— {req.dataType}</span>
                  </div>
                  <Badge variant={req.status === "approved" ? "default" : "destructive"} className={req.status === "approved" ? "bg-success text-success-foreground" : ""}>
                    {req.status}
                  </Badge>
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
          {detailDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Requester</p>
                  <p className="font-medium text-foreground">{detailDialog.requesterName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Target Provider</p>
                  <p className="font-medium text-foreground">{detailDialog.targetProviderName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Data Type</p>
                  <p className="font-medium text-foreground">{detailDialog.dataType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Scope</p>
                  <p className="font-medium text-foreground">{detailDialog.scope}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Purpose</p>
                  <p className="font-medium text-foreground">{detailDialog.purpose}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date Requested</p>
                  <p className="font-medium text-foreground">{detailDialog.dateRequested}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(null)}>Close</Button>
            {detailDialog?.status === "pending" && (
              <>
                <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleAction(detailDialog.id, "approved")}>Approve</Button>
                <Button variant="destructive" onClick={() => handleAction(detailDialog.id, "denied")}>Deny</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
