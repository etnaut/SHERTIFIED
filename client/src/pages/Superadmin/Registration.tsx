import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Registration() {
  const queryClient = useQueryClient();
  const [actionDialog, setActionDialog] = useState<{ request: any; action: "approve" | "reject" } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  
  const defaultPermissions = { send_data: false, request_public_records: false, view_reports: false };
  const [permissionsInput, setPermissionsInput] = useState<Record<string, boolean>>(defaultPermissions);

  const handlePermissionChange = (key: string, checked: boolean) => {
    setPermissionsInput((prev) => ({ ...prev, [key]: checked }));
  };

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['systems'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/systems');
      if (!res.ok) throw new Error('Failed to fetch systems');
      return res.json();
    }
  });

  const mutation = useMutation({
    mutationFn: async ({ id, status, apiKey, permissions }: { id: number, status: string, apiKey?: string, permissions?: string }) => {
      const res = await fetch(`http://localhost:4000/systems/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, apiKey, permissions })
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
    }
  });

  const openDialog = (req: any, action: "approve" | "reject") => {
    setActionDialog({ request: req, action });
    const perms = req.permissions || defaultPermissions;
    // Extract any existing keys to prepopulate checkboxes (fallback to false if missing)
    setPermissionsInput({
      send_data: !!perms.send_data,
      request_public_records: !!perms.request_public_records,
      view_reports: !!perms.view_reports,
    });
    setRemarks("");
  };

  const closeDialog = () => {
    setActionDialog(null);
    setRemarks("");
    setPermissionsInput(defaultPermissions);
  };

  const handleAction = () => {
    if (!actionDialog) return;
    const { request, action } = actionDialog;
    const newStatus = action === "approve" ? "active" : "rejected";
    
    mutation.mutate({ 
      id: request.id, 
      status: newStatus,
      permissions: action === "approve" ? JSON.parse(JSON.stringify(permissionsInput)) : undefined as any
    }, {
      onSuccess: () => {
        toast.success(`${request.name} has been ${action === "approve" ? "approved" : "rejected"}.`);
        closeDialog();
      },
      onError: () => {
        toast.error(`Failed to update ${request.name}`);
      }
    });
  };

  const pending = requests.filter((r: any) => r.status === "pending");
  const processed = requests.filter((r: any) => r.status !== "pending");

  if (isLoading) {
    return <div className="text-center p-8 text-muted-foreground">Loading queue...</div>;
  }

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
          {pending.map((req: any) => (
            <Card key={req.id} className="animate-slide-up">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{req.name}</h3>
                      <Badge className="bg-warning/10 text-warning border-0">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {req.permissions && typeof req.permissions === 'object' ? (
                        <>
                          <Badge variant="secondary" className="mr-1 mb-1">{req.permissions.send_data ? "✓ Send Data" : "✗ Send Data"}</Badge>
                          <Badge variant="secondary" className="mr-1 mb-1">{req.permissions.request_public_records ? "✓ Request Records" : "✗ Request Records"}</Badge>
                          <Badge variant="secondary" className="mr-1 mb-1">{req.permissions.view_reports ? "✓ View Reports" : "✗ View Reports"}</Badge>
                        </>
                      ) : (
                        "No capabilities requested."
                      )}
                    </p>
                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => openDialog(req, "approve")}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => openDialog(req, "reject")}>
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
            {processed.map((req: any) => (
              <Card key={req.id} className="opacity-70">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-foreground">{req.name}</span>
                  </div>
                  <Badge variant={req.status === "active" ? "default" : "destructive"} className={req.status === "active" ? "bg-success text-success-foreground" : ""}>
                    {req.status.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!actionDialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve" ? "Approve" : "Reject"} {actionDialog?.request.name}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog?.action === "approve" && (
              <>
                <div className="space-y-4 pt-2">
                  <Label className="text-base">Assign Permissions</Label>
                  <p className="text-sm text-foreground mb-2 p-3 bg-secondary/10 border border-secondary rounded-md">
                    <strong>Note:</strong> The API Key will be automatically generated as a secure JSON Web Token (JWT) that explicitly encodes the permissions you select below.
                  </p>
                  <div className="space-y-3 border p-4 rounded-md bg-muted/50">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="h-4 w-4" id="send_data" checked={permissionsInput.send_data} onChange={(e) => handlePermissionChange('send_data', e.target.checked)} />
                      <Label htmlFor="send_data" className="font-medium cursor-pointer text-sm">Send Data to Main System</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="h-4 w-4" id="request_public_records" checked={permissionsInput.request_public_records} onChange={(e) => handlePermissionChange('request_public_records', e.target.checked)} />
                      <Label htmlFor="request_public_records" className="font-medium cursor-pointer text-sm">Request Public Records</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="h-4 w-4" id="view_reports" checked={permissionsInput.view_reports} onChange={(e) => handlePermissionChange('view_reports', e.target.checked)} />
                      <Label htmlFor="view_reports" className="font-medium cursor-pointer text-sm">View System Reports</Label>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">Explicitly select the specific API actions this system is officially allowed to perform over the secure connection.</p>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Optional Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add internal notes about this decision..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={mutation.isPending}>Cancel</Button>
            <Button
              className={actionDialog?.action === "approve" ? "bg-success hover:bg-success/90 text-success-foreground" : ""}
              variant={actionDialog?.action === "reject" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Processing..." : `Confirm ${actionDialog?.action === "approve" ? "Approval" : "Rejection"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
