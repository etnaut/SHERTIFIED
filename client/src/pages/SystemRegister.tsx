import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const SystemRegister = () => {
  const navigate = useNavigate();
  const [systemName, setSystemName] = useState("");
  const [permissions, setPermissions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const permsObj = permissions.trim() ? { capabilities: permissions.trim() } : {};
      const response = await fetch("http://localhost:4000/systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system_name: systemName.trim(), permissions: permsObj }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to register system");
      }

      setIsSuccess(true);
      toast({
        title: "Registration successful",
        description: "Your system has been sent for approval.",
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: (error as Error).message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>External System Registration</CardTitle>
          <CardDescription>Register your external system to securely share data.</CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
                <h3 className="font-semibold mb-2">Registration Submitted!</h3>
                <p className="text-sm">
                  Your registration is in the queue for superadmin approval. 
                  Your API key will be explicitly given to you by the superadmin once your system is approved!
                </p>
              </div>
              <Button onClick={() => navigate("/")} className="w-full">Back to Home</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="systemName">System Name</Label>
                <Input
                  id="systemName"
                  placeholder="e.g. Barangay Hall / General Hospital"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="permissions">Requested Access / Info (Optional)</Label>
                <Input
                  id="permissions"
                  placeholder="e.g. read_patient_logs"
                  value={permissions}
                  onChange={(e) => setPermissions(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <CardFooter className="justify-end p-0 pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting || !systemName.trim()}>
                  {isSubmitting ? "Registering..." : "Submit Registration"}
                </Button>
              </CardFooter>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemRegister;
