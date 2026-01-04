
import { useEffect, useRef } from 'react';
import { ScheduleDay, PeriodTime } from '../types';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// نغمة جرس هادئة ولطيفة (Chime)
const BELL_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export const useSchoolBell = (
  periodTimes: PeriodTime[],
  schedule: ScheduleDay[],
  enabled: boolean
) => {
  // --- 1. Request Permissions & Setup Listeners ---
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.requestPermissions();

      // الاستماع للإشعارات أثناء فتح التطبيق لتشغيل الصوت المخصص
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
          console.log('Notification received in foreground:', notification);
          // تشغيل الصوت المخصص لأن iOS قد يستخدم الصوت الافتراضي للإشعار
          const audio = new Audio(BELL_SOUND_URL);
          audio.volume = 1.0;
          audio.play().catch(e => console.warn('Audio play blocked', e));
      });
    }
  }, []);

  // --- 2. Schedule Notifications Logic (Native) ---
  useEffect(() => {
    if (!enabled) {
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.cancel({ notifications: [] }).then(() => {
             LocalNotifications.getPending().then(pending => {
                 if (pending.notifications.length > 0) {
                     LocalNotifications.cancel({ notifications: pending.notifications });
                 }
             });
        });
      }
      return;
    }

    const scheduleBells = async () => {
        if (!Capacitor.isNativePlatform()) return; 

        // حذف الإشعارات القديمة المجدولة
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({ notifications: pending.notifications });
        }

        const now = new Date();
        const notificationsToSchedule: any[] = [];
        let idCounter = 1000;

        // جدولة للأيام الـ 7 القادمة
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(now.getDate() + i);
            const dayIndex = date.getDay(); // 0=Sun, 1=Mon...
            
            // تخطي الجمعة والسبت
            if (dayIndex > 4) continue; 

            const dailySchedule = schedule[dayIndex];
            if (!dailySchedule || dailySchedule.periods.every(p => !p)) continue;

            periodTimes.forEach((pt, pIndex) => {
                const className = dailySchedule.periods[pIndex];
                if (!className) return; 

                // 1. إشعار بداية الحصة
                const [sh, sm] = pt.startTime.split(':').map(Number);
                if (!isNaN(sh) && !isNaN(sm)) {
                    const startTime = new Date(date);
                    startTime.setHours(sh, sm, 0, 0);

                    if (startTime > new Date()) {
                        notificationsToSchedule.push({
                            id: idCounter++,
                            title: `🔔 بدأت الحصة ${pt.periodNumber}`,
                            body: `المادة: ${className}`,
                            schedule: { at: startTime },
                            sound: 'beep.wav', // سيستخدم النظام الصوت الافتراضي في الخلفية
                            actionTypeId: "",
                            extra: null
                        });
                    }
                }

                // 2. إشعار نهاية الحصة
                const [eh, em] = pt.endTime.split(':').map(Number);
                if (!isNaN(eh) && !isNaN(em)) {
                    const endTime = new Date(date);
                    endTime.setHours(eh, em, 0, 0);

                    if (endTime > new Date()) {
                        notificationsToSchedule.push({
                            id: idCounter++,
                            title: `⌛ انتهت الحصة ${pt.periodNumber}`,
                            body: `استعد للحصة القادمة`,
                            schedule: { at: endTime },
                            sound: 'beep.wav', 
                            actionTypeId: "",
                            extra: null
                        });
                    }
                }
            });
        }

        if (notificationsToSchedule.length > 0) {
            await LocalNotifications.schedule({ notifications: notificationsToSchedule });
            console.log(`Scheduled ${notificationsToSchedule.length} bells.`);
        }
    };

    scheduleBells();

  }, [periodTimes, schedule, enabled]);

  // --- 3. Web/Foreground Fallback (Audio) ---
  useEffect(() => {
      if (!enabled) return;

      const checkTime = () => {
          const now = new Date();
          const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          
          periodTimes.forEach((period) => {
              if (period.startTime === currentTime || period.endTime === currentTime) {
                  if (now.getSeconds() === 0) {
                      const audio = new Audio(BELL_SOUND_URL);
                      audio.volume = 1.0;
                      audio.play().catch(e => console.warn('Audio play blocked (user interaction required)', e));
                      
                      if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
                          new Notification('راصد', { 
                              body: period.startTime === currentTime ? `بدأت الحصة ${period.periodNumber}` : `انتهت الحصة ${period.periodNumber}`,
                              icon: '/icon.png'
                          });
                      }
                  }
              }
          });
      };

      if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
      }

      const interval = setInterval(checkTime, 1000);
      return () => clearInterval(interval);
  }, [periodTimes, enabled]);
};
