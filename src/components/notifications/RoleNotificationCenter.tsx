import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCircle, Clock, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { roleChangeNotificationService, RoleChangeNotification } from '@/services/roleChangeNotifications';
import { roleUtils } from '@/utils/roleUtils';
import { formatDistanceToNow } from 'date-fns';

export function RoleNotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RoleChangeNotification[]>([]);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const loadNotifications = () => {
      const userNotifications = roleChangeNotificationService.getUserNotifications(user.id);
      const unacknowledged = roleChangeNotificationService.getUnacknowledgedNotifications(user.id);
      
      setNotifications(userNotifications);
      setUnacknowledgedCount(unacknowledged.length);
    };

    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  const acknowledgeNotification = (notificationId: string) => {
    if (roleChangeNotificationService.acknowledgeNotification(notificationId)) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, acknowledged: true } : n
        )
      );
      setUnacknowledgedCount(prev => Math.max(0, prev - 1));
    }
  };

  const acknowledgeAll = () => {
    notifications
      .filter(n => !n.acknowledged)
      .forEach(n => roleChangeNotificationService.acknowledgeNotification(n.id));
    
    setNotifications(prev => prev.map(n => ({ ...n, acknowledged: true })));
    setUnacknowledgedCount(0);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Role Change Notifications
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedCount} new
              </Badge>
            )}
          </div>
          {unacknowledgedCount > 0 && (
            <Button onClick={acknowledgeAll} size="sm" variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Recent changes to your role and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  !notification.acknowledged 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-muted/20 border-muted'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        Role Updated
                      </span>
                      {!notification.acknowledged && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      <p>
                        Changed from <strong>{roleUtils.getRoleName(notification.oldRole)}</strong> to{' '}
                        <strong>{roleUtils.getRoleName(notification.newRole)}</strong>
                      </p>
                      <p className="mt-1">
                        By: <strong>{notification.changedBy}</strong>
                      </p>
                      {notification.reason && (
                        <p className="mt-1">
                          Reason: <em>{notification.reason}</em>
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                  
                  {!notification.acknowledged && (
                    <Button
                      onClick={() => acknowledgeNotification(notification.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}