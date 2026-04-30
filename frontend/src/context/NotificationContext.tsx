import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: "election" | "vote" | "result" | "system" | "reminder";
  created_at: string;
  read: boolean;
  action_url?: string;
  action_label?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const fetchNotifications = useCallback(async () => {
    try {
      const stored = localStorage.getItem("notifications");
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        const mock: Notification[] = [
          {
            id: "1",
            title: "Election Going Live",
            message: "The Presidential election starts in 1 hour. Make sure to cast your vote!",
            type: "info",
            category: "election",
            created_at: new Date(Date.now() - 5 * 60000).toISOString(),
            read: false,
            action_url: "/dashboard",
            action_label: "View Election"
          },
          {
            id: "2",
            title: "Vote Reminder",
            message: "You still have 3 positions pending. Polls close soon!",
            type: "warning",
            category: "reminder",
            created_at: new Date(Date.now() - 60 * 60000).toISOString(),
            read: false,
            action_url: "/vote/1",
            action_label: "Continue Voting"
          },
          {
            id: "3",
            title: "Results Published",
            message: "Results for the Student Council election 2024 have been released.",
            type: "success",
            category: "result",
            created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
            read: true,
            action_url: "/results/1",
            action_label: "View Results"
          }
        ];
        setNotifications(mock);
        localStorage.setItem("notifications", JSON.stringify(mock));
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    // Wrap async call to avoid synchronous setState warning
    (async () => {
      try {
        const stored = localStorage.getItem("notifications");
        if (stored) {
          setNotifications(JSON.parse(stored));
        } else {
          const mock: Notification[] = [
            {
              id: "1",
              title: "Election Going Live",
              message: "The Presidential election starts in 1 hour. Make sure to cast your vote!",
              type: "info",
              category: "election",
              created_at: new Date(Date.now() - 5 * 60000).toISOString(),
              read: false,
              action_url: "/dashboard",
              action_label: "View Election"
            },
            {
              id: "2",
              title: "Vote Reminder",
              message: "You still have 3 positions pending. Polls close soon!",
              type: "warning",
              category: "reminder",
              created_at: new Date(Date.now() - 60 * 60000).toISOString(),
              read: false,
              action_url: "/vote/1",
              action_label: "Continue Voting"
            },
            {
              id: "3",
              title: "Results Published",
              message: "Results for the Student Council election 2024 have been released.",
              type: "success",
              category: "result",
              created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
              read: true,
              action_url: "/results/1",
              action_label: "View Results"
            }
          ];
          setNotifications(mock);
          localStorage.setItem("notifications", JSON.stringify(mock));
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    })();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      // In a real app, this would be an API call
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      // Persist
      const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem("notifications", JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      localStorage.setItem("notifications", JSON.stringify(notifications.map(n => ({ ...n, read: true }))));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      const updated = notifications.filter(n => n.id !== id);
      localStorage.setItem("notifications", JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const clearAll = async () => {
    try {
      setNotifications([]);
      localStorage.removeItem("notifications");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Ctx.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      refresh: fetchNotifications,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};
