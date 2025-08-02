import { toast } from '@/components/ui/sonner';
import { UserRole } from '@/types/roles';
import { roleUtils } from '@/utils/roleUtils';

export interface RoleChangeNotification {
  id: string;
  userId: string;
  oldRole: UserRole;
  newRole: UserRole;
  changedBy: string;
  timestamp: Date;
  reason?: string;
  acknowledged: boolean;
}

export class RoleChangeNotificationService {
  private static instance: RoleChangeNotificationService;
  private notifications: RoleChangeNotification[] = [];
  
  static getInstance(): RoleChangeNotificationService {
    if (!RoleChangeNotificationService.instance) {
      RoleChangeNotificationService.instance = new RoleChangeNotificationService();
    }
    return RoleChangeNotificationService.instance;
  }

  // Create a notification for role change
  notifyRoleChange(
    userId: string,
    oldRole: UserRole,
    newRole: UserRole,
    changedBy: string,
    reason?: string
  ) {
    const notification: RoleChangeNotification = {
      id: `role_change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      oldRole,
      newRole,
      changedBy,
      timestamp: new Date(),
      reason,
      acknowledged: false
    };

    this.notifications.push(notification);

    // Show toast notification
    const isUpgrade = roleUtils.hasPermissionLevel(newRole, oldRole);
    const isDowngrade = roleUtils.hasPermissionLevel(oldRole, newRole) && oldRole !== newRole;

    if (isUpgrade) {
      toast.success('Role Upgraded', {
        description: `Your role has been upgraded from ${roleUtils.getRoleName(oldRole)} to ${roleUtils.getRoleName(newRole)}`,
        duration: 10000,
      });
    } else if (isDowngrade) {
      toast.warning('Role Changed', {
        description: `Your role has been changed from ${roleUtils.getRoleName(oldRole)} to ${roleUtils.getRoleName(newRole)}`,
        duration: 10000,
      });
    } else {
      toast.info('Role Updated', {
        description: `Your role has been updated to ${roleUtils.getRoleName(newRole)}`,
        duration: 8000,
      });
    }

    return notification;
  }

  // Get notifications for a user
  getUserNotifications(userId: string): RoleChangeNotification[] {
    return this.notifications.filter(n => n.userId === userId);
  }

  // Get unacknowledged notifications for a user
  getUnacknowledgedNotifications(userId: string): RoleChangeNotification[] {
    return this.notifications.filter(n => n.userId === userId && !n.acknowledged);
  }

  // Acknowledge a notification
  acknowledgeNotification(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.acknowledged = true;
      return true;
    }
    return false;
  }

  // Get all notifications (admin only)
  getAllNotifications(): RoleChangeNotification[] {
    return [...this.notifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Clear old notifications (older than 30 days)
  cleanupOldNotifications(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oldCount = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.timestamp > thirtyDaysAgo);
    
    return oldCount - this.notifications.length;
  }
}

export const roleChangeNotificationService = RoleChangeNotificationService.getInstance();