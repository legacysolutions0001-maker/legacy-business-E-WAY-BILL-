import { useAuth } from "@/lib/auth";
import { useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, isSuperAdmin } = useAuth();
  const { data: stats, isLoading } = useGetStats({
    query: {
      queryKey: getGetStatsQueryKey(),
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {user?.username}.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total E-Way Bills</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEwaybills}</div>
            </CardContent>
          </Card>
          
          {isSuperAdmin && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">Active</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent E-Way Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.recentEwaybills?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent E-Way Bills found.</p>
                ) : (
                  stats?.recentEwaybills?.map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{bill.ewbNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          To: {bill.toTradeName} • Val: ₹{bill.totalValue.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <Link href={`/ewaybills/${bill.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/ewaybills/new" className="w-full">
              <Button className="w-full justify-start" variant="default">
                <FileText className="mr-2 h-4 w-4" />
                Generate New E-Way Bill
              </Button>
            </Link>
            <Link href="/ewaybills" className="w-full">
              <Button className="w-full justify-start" variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                View All E-Way Bills
              </Button>
            </Link>
            {isSuperAdmin && (
              <Link href="/companies" className="w-full">
                <Button className="w-full justify-start" variant="outline">
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage Companies
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
