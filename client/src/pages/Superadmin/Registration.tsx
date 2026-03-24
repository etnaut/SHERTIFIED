import { useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { registrationRequests, RegistrationRequest } from "@/lib/mock-data";
import { toast } from "sonner";

export default function Registration() {
  const [requests, setRequests] = useState(registrationRequests);
  const [actionDialog, setActionDialog] = useState<{ request: RegistrationRequest; action: "approve" | "reject" } | null>(null);
  const [remarks, setRemarks] = useState("");

  const handleAction = () => {
    if (!actionDialog) return;
    const { request, action } = actionDialog;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === request.id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r
      )
    );
    toast.success(`${request.officeName} has been ${action === "approve" ? "approved" : "rejected"}.`);
    setActionDialog(null);
    setRemarks("");
  };

  const pending = requests.filter((r) => r.status === "pending");
  const processed = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Provider Registration Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and approve office registration requests</p>
      </div>

      {pending.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No pending registrations.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {pending.map((req) => (
            <Card key={req.id} className="animate-slide-up">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{req.officeName}</h3>
                      <Badge variant="outline">{req.acronym}</Badge>
                      <Badge className="bg-warning/10 text-warning border-0">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Contact: {req.contactPerson}</span>
                      <span>Email: {req.email}</span>
                      <span>Submitted: {req.dateSubmitted}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => setActionDialog({ request: req, action: "approve" })}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setActionDialog({ request: req, action: "reject" })}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
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
          <h2 className="text-lg font-semibold text-foreground mb-3">Processed</h2>
          <div className="space-y-3">
            {processed.map((req) => (
              <Card key={req.id} className="opacity-70">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-foreground">{req.officeName}</span>
                    <span className="text-xs text-muted-foreground ml-2">({req.acronym})</span>
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

      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setRemarks(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve" ? "Approve" : "Reject"} {actionDialog?.request.officeName}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Add optional remarks below:</p>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter remarks (optional)..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog(null); setRemarks(""); }}>Cancel</Button>
            <Button
              className={actionDialog?.action === "approve" ? "bg-success hover:bg-success/90 text-success-foreground" : ""}
              variant={actionDialog?.action === "reject" ? "destructive" : "default"}
              onClick={handleAction}
            >
              Confirm {actionDialog?.action === "approve" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
