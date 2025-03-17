import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '00:00', value: 240 },
  { name: '03:00', value: 300 },
  { name: '06:00', value: 200 },
  { name: '09:00', value: 278 },
  { name: '12:00', value: 189 },
  { name: '15:00', value: 239 },
  { name: '18:00', value: 349 },
  { name: '21:00', value: 220 },
];

export function Overview() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Response Time Overview</CardTitle>
        <CardDescription>
          Average response time across all monitored services over the last 24 hours.
        </CardDescription>
      </CardHeader>
      {/* <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-sm text-muted-foreground" />
            <YAxis 
              className="text-sm text-muted-foreground"
              tickFormatter={(value) => `${value}ms`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))' 
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2} 
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent> */}
    </Card>
  );
} 