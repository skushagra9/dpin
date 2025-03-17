import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { MoreHorizontal, Globe, Server, Database, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: 'website' | 'api' | 'database' | 'service';
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  responseTime: number;
  uptime: number;
  lastChecked: string;
}

interface UptimeMonitorGridProps {
  monitors: Monitor[];
}

export function UptimeMonitorGrid({ monitors }: UptimeMonitorGridProps) {
  const getIcon = (type: Monitor['type']) => {
    switch (type) {
      case 'website':
        return <Globe className="h-4 w-4" />;
      case 'api':
        return <Server className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'service':
        return <Cloud className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {monitors.length === 0 ? (
        <Card className="col-span-full p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="rounded-full bg-muted p-3">
              <Server className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">No monitors found</h3>
              <p className="text-sm text-muted-foreground">
                Get started by adding your first monitor.
              </p>
            </div>
            <Button size="sm">Add Monitor</Button>
          </div>
        </Card>
      ) : (
        monitors.map((monitor) => (
          <Card key={monitor.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <div className="rounded-full bg-muted p-1">
                  {getIcon(monitor.type)}
                </div>
                <CardTitle className="text-base font-medium">{monitor.name}</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <StatusBadge status={monitor.status} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Monitor</DropdownMenuItem>
                    <DropdownMenuItem>Pause Monitoring</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground truncate">{monitor.url}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Response Time</div>
                  <div className="font-medium">{monitor.responseTime}ms</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Uptime</div>
                  <div className="font-medium">{monitor.uptime}%</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-3">
              <div className="text-xs text-muted-foreground">
                Last checked: {monitor.lastChecked}
              </div>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
} 