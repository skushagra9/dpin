"use client"
import React from 'react';
import { UptimeMonitorGrid } from '@/components/UptimeMonitorGrid';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchMonitors } from '@/lib/api';
import { CreateMonitorDialog } from '@/components/dialogs/CreateMonitorDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Overview } from '@/components/dashboard/Overview';
import { StatusBadge } from '@/components/StatusBadge';

export default function DashboardPage() {
  const [open, setOpen] = React.useState(false);
  const { data: monitors, isLoading, refetch } = useQuery({
    queryKey: ['monitors'],
    queryFn: fetchMonitors,
  });

  return (
 <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Uptime Monitoring</h1>
            <p className="text-muted-foreground">
              Monitor your services and get notified when they go down.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Monitor
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monitors">Monitors</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Overview />
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Monitors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{monitors?.length || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">99.8%</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">245ms</div>
                  <p className="text-xs text-muted-foreground">Average</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="monitors" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <UptimeMonitorGrid monitors={monitors || []} />
            )}
          </TabsContent>
          
          <TabsContent value="incidents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Incidents</CardTitle>
                <CardDescription>
                  View and manage recent incidents across your services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: 1, service: 'API Gateway', status: 'resolved', time: '2 hours ago', duration: '15m' },
                    { id: 2, service: 'Database Cluster', status: 'investigating', time: '30 minutes ago', duration: 'ongoing' },
                  ].map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{incident.service}</h3>
                        <p className="text-sm text-muted-foreground">
                          {incident.time} • {incident.duration}
                        </p>
                      </div>
                      <StatusBadge status={incident.status as 'resolved' | 'investigating' | 'online' | 'offline' | 'degraded' | 'maintenance'} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <CreateMonitorDialog open={open} onOpenChange={setOpen} />
      </>
  );
}
