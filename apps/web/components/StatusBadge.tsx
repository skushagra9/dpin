import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cva } from 'class-variance-authority';

const statusVariants = cva('', {
  variants: {
    status: {
      online: 'bg-green-100 text-green-800 hover:bg-green-100',
      offline: 'bg-red-100 text-red-800 hover:bg-red-100',
      degraded: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      investigating: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      resolved: 'bg-green-100 text-green-800 hover:bg-green-100',
      maintenance: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    },
  },
  defaultVariants: {
    status: 'online',
  },
});

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'degraded' | 'investigating' | 'resolved' | 'maintenance';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusText = {
    online: 'Online',
    offline: 'Offline',
    degraded: 'Degraded',
    investigating: 'Investigating',
    resolved: 'Resolved',
    maintenance: 'Maintenance',
  };

  return (
    <Badge variant="outline" className={statusVariants({ status })}>
      {statusText[status]}
    </Badge>
  );
} 