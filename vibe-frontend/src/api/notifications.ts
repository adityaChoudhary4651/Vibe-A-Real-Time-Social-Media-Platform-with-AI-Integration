import api from "@/lib/axios";

export const getNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data;
};

export const markNotificationRead = async (id: string) => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async () => {
  await api.patch("/notifications/read-all");
};

// ✅ ADD THIS (OR CONFIRM IT EXISTS)
export const getUnreadCount = async (): Promise<number> => {
  const res = await api.get("/notifications");
  return res.data.filter((n: { isRead: boolean }) => !n.isRead).length;
};
