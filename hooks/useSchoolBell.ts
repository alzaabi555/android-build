
import { useEffect, useRef } from 'react';
import { ScheduleDay, PeriodTime } from '../types';

export const useSchoolBell = (
  periodTimes: PeriodTime[],
  schedule: ScheduleDay[]
) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Sound effect for the bell
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1085/1085-preview.mp3');
  }, []);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      // const currentDayIndex = now.getDay(); 
      
      // Basic check: compares current time with start/end time of periods
      periodTimes.forEach((period, index) => {
        if (period.startTime === currentTime || period.endTime === currentTime) {
           // Play sound if not already playing in this minute (check seconds to avoid loop)
           if (audioRef.current && now.getSeconds() === 0) {
               audioRef.current.play().catch(e => console.log('Audio play failed', e));
               
               // Send Notification
               if ('Notification' in window && Notification.permission === 'granted') {
                   new Notification('راصد', { 
                       body: `حانت الآن ${period.startTime === currentTime ? 'بداية' : 'نهاية'} الحصة ${period.periodNumber}`,
                       icon: '/icon.png'
                   });
               }
           }
        }
      });
    };

    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [periodTimes]);
};
