import { Building2, UserPlus, FileSearch, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { providers, registrationRequests, dataRequests, activityFeed, exchangeChartData } from "@/lib/mock-data";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";

const statCards = [
  {
    title: "Registered Providers",
    value: providers.length,
    icon: Building2,
    change: "+2 this month",
    up: true,
  },
  {
    title: "Pending Registrations",
    value: registrationRequests.filter((r) => r.status === "pending").length,
    icon: UserPlus,
    change: "3 awaiting review",
    up: false,
  },
  {
    title: "Pending Data Requests",
    value: dataRequests.filter((r) => r.status === "pending").length,
    icon: FileSearch,
    change: "3 new this week",
    up: true,
  },
  {
    title: "Total Records Exchanged",
    value: "8,303",
    icon: Activity,
    change: "+12% vs last month",
    up: true,
  },
];

const activityTypeColors: Record<string, string> = {
  request: "bg-secondary/10 text-secondary",
  registration: "bg-warning/10 text-warning",
  approval: "bg-success/10 text-success",
  upload: "bg-primary/10 text-primary",
  alert: "bg-destructive/10 text-destructive",
};

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of the data exchange system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="animate-slide-up">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-secondary" />
                </div>
                {stat.up ? (
                  <ArrowUpRight className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-warning" />
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
              <p className="text-[11px] text-muted-foreground mt-2">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Data Exchange Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={exchangeChartData}>
                <defs>
                  <linearGradient id="colorExchanges" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(215, 16%, 47%)' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(215, 16%, 47%)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(214, 20%, 88%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="exchanges" stroke="hsl(199, 89%, 48%)" fillOpacity={1} fill="url(#colorExchanges)" strokeWidth={2} />
                <Area type="monotone" dataKey="requests" stroke="hsl(215, 40%, 16%)" fillOpacity={0} strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityFeed.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${activityTypeColors[item.type]?.split(' ')[0] || 'bg-muted'}`} />
                <div className="min-w-0">
                  <p className="text-sm text-foreground leading-tight">{item.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
