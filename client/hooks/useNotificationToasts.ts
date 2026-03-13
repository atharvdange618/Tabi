"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { useNotifications } from "./useNotifications";
import type { PopulatedNotification } from "shared/types";

export function useNotificationToasts() {
  const { isSignedIn } = useAuth();
  const { data: notifications = [], isSuccess } = useNotifications();
  const previousNotificationsRef = useRef<PopulatedNotification[]>([]);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!isSignedIn) {
      isFirstLoadRef.current = true;
      previousNotificationsRef.current = [];
      return;
    }

    if (isFirstLoadRef.current) {
      if (isSuccess) {
        previousNotificationsRef.current = notifications;
        isFirstLoadRef.current = false;
      }
      return;
    }

    const previousIds = new Set(
      previousNotificationsRef.current.map((n) => n._id),
    );
    const newNotifications = notifications.filter(
      (n) => !previousIds.has(n._id),
    );

    newNotifications.forEach((notification) => {
      const actorName = notification.actorId?.name || "Someone";

      const title = `New notification from ${actorName}`;
      const description = notification.tripId
        ? `${notification.message} • ${notification.tripId.title}`
        : notification.message;

      toast.success(title, {
        description:
          description.length > 100
            ? `${description.substring(0, 100)}...`
            : description,
        duration: 5000,
        action: {
          label: "View",
          onClick: () => {
            const event = new CustomEvent("openNotificationCenter");
            window.dispatchEvent(event);
          },
        },
      });
    });

    previousNotificationsRef.current = notifications;
  }, [notifications, isSignedIn, isSuccess]);
}
