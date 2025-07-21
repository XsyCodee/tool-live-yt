import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const NotificationsSection = ({ notifications, markNotificationAsRead, unreadNotificationsCount }) => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Notifikasi Anda ({unreadNotificationsCount} Belum Dibaca)</h3>
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 border-b last:border-b-0 flex items-start ${notif.unread ? 'bg-blue-50' : 'bg-white'}`}
              onClick={() => markNotificationAsRead(notif.id)}
            >
              {notif.type === 'info' && <CheckCircle size={20} className="text-blue-500 mr-3 mt-1" />}
              {notif.type === 'warning' && <AlertTriangle size={20} className="text-yellow-500 mr-3 mt-1" />}
              {notif.type === 'success' && <CheckCircle size={20} className="text-green-500 mr-3 mt-1" />}
              <div>
                <p className={`font-semibold ${notif.unread ? 'text-gray-900' : 'text-gray-700'}`}>{notif.message}</p>
                <p className="text-xs text-gray-500 mt-1">Beberapa waktu lalu</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 p-4">Tidak ada notifikasi baru.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationsSection;
