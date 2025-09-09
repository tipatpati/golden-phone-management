import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  X,
  Settings,
  Filter
} from "lucide-react";
import { useSupplierTransactions } from "@/services/suppliers/SupplierTransactionService";
import { useSuppliers } from "@/services";

interface Notification {
  id: string;
  type: 'transaction' | 'supplier' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const { data: transactions } = useSupplierTransactions();
  const { data: suppliers } = useSuppliers();

  // Generate notifications based on current data
  const notifications: Notification[] = React.useMemo(() => {
    const notifs: Notification[] = [];

    // Check for pending transactions older than 7 days
    if (transactions) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const oldPendingTransactions = transactions.filter(t => 
        t.status === 'pending' && new Date(t.transaction_date) < weekAgo
      );

      oldPendingTransactions.forEach(transaction => {
        notifs.push({
          id: `pending-${transaction.id}`,
          type: 'transaction',
          priority: 'high',
          title: 'Overdue Transaction',
          message: `Transaction ${transaction.transaction_number} has been pending for over a week`,
          timestamp: new Date(transaction.transaction_date),
          isRead: false,
        });
      });
    }

    // Check for suppliers without recent activity
    if (suppliers && transactions && Array.isArray(suppliers)) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      suppliers.forEach(supplier => {
        const lastTransaction = transactions
          .filter(t => t.supplier_id === supplier.id)
          .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0];

        if (!lastTransaction || new Date(lastTransaction.transaction_date) < threeMonthsAgo) {
          notifs.push({
            id: `inactive-${supplier.id}`,
            type: 'supplier',
            priority: 'medium',
            title: 'Inactive Supplier',
            message: `${supplier.name} hasn't had any transactions in the last 3 months`,
            timestamp: lastTransaction ? new Date(lastTransaction.transaction_date) : new Date(),
            isRead: false,
          });
        }
      });
    }

    // Check for high-value completed transactions (last 24 hours)
    if (transactions) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const highValueTransactions = transactions.filter(t => 
        t.status === 'completed' && 
        t.total_amount > 5000 && 
        new Date(t.transaction_date) > yesterday
      );

      highValueTransactions.forEach(transaction => {
        notifs.push({
          id: `high-value-${transaction.id}`,
          type: 'transaction',
          priority: 'low',
          title: 'High-Value Transaction Completed',
          message: `€${transaction.total_amount.toFixed(2)} transaction completed with ${transaction.suppliers?.name}`,
          timestamp: new Date(transaction.transaction_date),
          isRead: false,
        });
      });
    }

    return notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [transactions, suppliers]);

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'high') return notif.priority === 'high' || notif.priority === 'critical';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (!isOpen) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-80 max-h-96 relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter(filter === 'all' ? 'unread' : filter === 'unread' ? 'high' : 'all')}
            >
              <Filter className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex gap-1">
          {['all', 'unread', 'high'].map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => setFilter(filterOption as any)}
            >
              {filterOption}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          {filteredNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className={`p-3 hover:bg-muted/50 cursor-pointer ${!notification.isRead ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex items-start gap-2">
                      {getPriorityIcon(notification.priority)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium truncate">
                            {notification.title}
                          </h4>
                          <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.timestamp.toLocaleDateString()} {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  {index < filteredNotifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}