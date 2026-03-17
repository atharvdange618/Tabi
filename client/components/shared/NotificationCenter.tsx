"use client";

import { useState, useEffect } from "react";
import { Bell, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { useNotificationStore } from "@/store/notificationStore";
import { toInitials } from "@/lib/helpers";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { PopulatedNotification } from "shared/types";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const { unreadCount: localUnreadCount } = useNotificationStore();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const displayCount = unreadCount ?? localUnreadCount;

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  useEffect(() => {
    const handleOpenNotificationCenter = () => {
      setOpen(true);
    };

    window.addEventListener(
      "openNotificationCenter",
      handleOpenNotificationCenter,
    );
    return () => {
      window.removeEventListener(
        "openNotificationCenter",
        handleOpenNotificationCenter,
      );
    };
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate(notificationId);
  };

  const handleDelete = (notificationId: string, wasUnread: boolean) => {
    deleteNotification.mutate({ notificationId, wasUnread });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-brand-lemon hover:border-[#1A1A1A] border-2 border-transparent hover:shadow-[3px_3px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150"
          aria-label={`Notifications${displayCount > 0 ? ` (${displayCount} unread)` : ""}`}
        >
          <Bell className={cn("h-5 w-5", displayCount > 0 && "bell-ring")} />
          {displayCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full bg-red-500 border-2 border-white text-white text-[11px] font-bold px-1.5 shadow-sm">
              {displayCount > 99 ? "99+" : displayCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b-2 border-brutal-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display font-bold text-xl">
              Notifications
            </SheetTitle>
            {unreadNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium hover:bg-gray-100"
              >
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-display font-bold text-base mb-1">
                  No notifications yet
                </p>
                <p className="text-sm text-gray-500">
                  You&apos;ll see updates about your trips here
                </p>
              </div>
            ) : (
              <>
                {/* Unread notifications */}
                {unreadNotifications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Unread
                    </h3>
                    {unreadNotifications.map((notification) => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}

                {/* Read notifications */}
                {readNotifications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Read
                    </h3>
                    {readNotifications.map((notification) => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                        isRead
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface NotificationItemProps {
  notification: PopulatedNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string, wasUnread: boolean) => void;
  isRead?: boolean;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  isRead = false,
}: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        "group relative bg-white border-2 border-brutal-border rounded-lg p-3 shadow-[2px_2px_0px_#1A1A1A] hover:shadow-[3px_3px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150",
        isRead && "opacity-60",
      )}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-brand-blue" />
      )}

      <div className="flex gap-3">
        {/* Actor avatar */}
        <Avatar className="h-10 w-10 border-2 border-brutal-border shrink-0">
          <AvatarImage
            src={notification.actorId?.avatarUrl}
            alt={notification.actorId?.name || "User"}
          />
          <AvatarFallback className="bg-brand-blue text-white text-xs font-bold">
            {toInitials(notification.actorId?.name || "?")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Message */}
          <p className="text-sm font-medium text-gray-900 leading-snug mb-1">
            {notification.message}
          </p>

          {/* Trip badge and timestamp */}
          <div className="flex items-center gap-2 flex-wrap">
            {notification.tripId && (
              <Link
                href={`/trips/${notification.tripId._id}`}
                className="inline-flex items-center text-xs font-medium text-brand-blue hover:underline"
              >
                {notification.tripId.title}
              </Link>
            )}
            <span className="text-xs text-gray-500">{timeAgo}</span>
          </div>

          {/* Action buttons (shown on hover) */}
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification._id)}
                className="h-7 px-2 text-xs hover:bg-gray-100"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(notification._id, !isRead)}
              className="h-7 px-2 text-xs hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
