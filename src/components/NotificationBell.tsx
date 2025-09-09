import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useLanguage } from '@/contexts/LanguageContext';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const translations = {
    fr: {
      notifications: 'Notifications',
      markAllRead: 'Tout marquer comme lu',
      noNotifications: 'Aucune notification',
      noNotificationsDesc: 'Vous êtes à jour !',
      timeAgo: {
        now: 'À l\'instant',
        minutes: 'il y a {{count}} min',
        hours: 'il y a {{count}}h',
        days: 'il y a {{count}}j'
      }
    },
    en: {
      notifications: 'Notifications',
      markAllRead: 'Mark all as read',
      noNotifications: 'No notifications',
      noNotificationsDesc: 'You\'re all caught up!',
      timeAgo: {
        now: 'Just now',
        minutes: '{{count}} min ago',
        hours: '{{count}}h ago',
        days: '{{count}}d ago'
      }
    }
  };

  const t = translations[language];

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t.timeAgo.now;
    if (diffInMinutes < 60) return t.timeAgo.minutes.replace('{{count}}', diffInMinutes.toString());
    if (diffInMinutes < 1440) return t.timeAgo.hours.replace('{{count}}', Math.floor(diffInMinutes / 60).toString());
    return t.timeAgo.days.replace('{{count}}', Math.floor(diffInMinutes / 1440).toString());
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_confirmed':
        return '✅';
      case 'order_ready':
        return '📦';
      case 'order_completed':
        return '🎉';
      default:
        return '📢';
    }
  };

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive text-destructive-foreground"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4 flex items-center justify-between">
          <h3 className="font-semibold text-sm">{t.notifications}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-auto p-1"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {t.markAllRead}
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {notifications && notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="font-medium text-muted-foreground">{t.noNotifications}</p>
              <p className="text-sm text-muted-foreground">{t.noNotificationsDesc}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications && notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification.id, notification.read)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;