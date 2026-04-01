import React from "react";
import { useNotifications } from "../context/NotificationContext";
import { Bell, Calendar, MessageSquare, AlertCircle, Stethoscope } from "lucide-react";

const NotificationBadge = () => {
  const { notifications, getTotalNotifications } = useNotifications();
  const total = getTotalNotifications();

  if (total === 0) {
    return (
      <button className="relative p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition">
        <Bell className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative group">
      <button className="relative p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition">
        <Bell className="w-5 h-5" />
        {total > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-[#E06666] rounded-full">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-text-main flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
          {notifications.appointments > 0 && (
            <div className="p-3 hover:bg-gray-50 dark:hover:bg-slate-750 cursor-pointer transition flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-main">New Appointments</p>
                <p className="text-xs text-text-dim">{notifications.appointments} pending</p>
              </div>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-blue-500 rounded-full">
                {notifications.appointments}
              </span>
            </div>
          )}

          {notifications.consultations > 0 && (
            <div className="p-3 hover:bg-gray-50 dark:hover:bg-slate-750 cursor-pointer transition flex items-start gap-3">
              <Stethoscope className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-main">New Consultations</p>
                <p className="text-xs text-text-dim">{notifications.consultations} requests</p>
              </div>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-green-500 rounded-full">
                {notifications.consultations}
              </span>
            </div>
          )}

          {notifications.messages > 0 && (
            <div className="p-3 hover:bg-gray-50 dark:hover:bg-slate-750 cursor-pointer transition flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-purple-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-main">New Messages</p>
                <p className="text-xs text-text-dim">{notifications.messages} unread</p>
              </div>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-purple-500 rounded-full">
                {notifications.messages}
              </span>
            </div>
          )}

          {notifications.alerts > 0 && (
            <div className="p-3 hover:bg-gray-50 dark:hover:bg-slate-750 cursor-pointer transition flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-main">Important Alerts</p>
                <p className="text-xs text-text-dim">{notifications.alerts} alerts</p>
              </div>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-orange-500 rounded-full">
                {notifications.alerts}
              </span>
            </div>
          )}

          {total === 0 && (
            <div className="p-6 text-center text-text-dim">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-slate-700 text-center">
          <button className="text-xs font-medium text-[#E06666] hover:text-[#D85555] transition">
            View all notifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBadge;
