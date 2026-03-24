import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ShieldCheck } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Welcome to SHERTIFIED</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Please choose your portal to continue. External partners must register, while authorized personnel can sign in directly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* External System Registration Option */}
          <Card className="flex flex-col h-full hover:border-primary/50 transition-colors duration-300 shadow-sm hover:shadow-md cursor-pointer" onClick={() => navigate("/system-register")}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Partner System</CardTitle>
              <CardDescription className="text-base mt-2">
                For external offices (e.g., Hospitals, Barangay Halls) wanting to connect and securely exchange data.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-6">
              <Button size="lg" className="w-full text-lg">
                Register System
              </Button>
            </CardContent>
          </Card>

          {/* Admin Login Option */}
          <Card className="flex flex-col h-full hover:border-primary/50 transition-colors duration-300 shadow-sm hover:shadow-md cursor-pointer" onClick={() => navigate("/login")}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Staff & Admin</CardTitle>
              <CardDescription className="text-base mt-2">
                For authorized personnel, superadmins, and staff members to access the central management dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-6">
              <Button variant="outline" size="lg" className="w-full text-lg border-2">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Landing;
