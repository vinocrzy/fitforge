// ═══════════════════════════════════════════════════════════════════
// FitForge — Notification Scheduler Hook
// PT Feature 2: Intelligent notification scheduling for coaching, rest days, streaks, and deload prompts
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { useWorkoutHistory } from '@/hooks/useDatabase';
import {
  schedulePushNotification,
  requestNotificationPermission,
  getNotificationPermission,
  type NotificationPayload,
} from '@/lib/notifications/pushManager';

/**
 * Notification scheduler hook
 * Manages 4 types of notifications:
 * 1. Rest day reminders - After N days inactive
 * 2. Streak alerts - Daily check-in reminder
 * 3. Deload prompts - When deload detection fires
 * 4. Coaching notes - 2h after session completion with RPE advice
 */
export function useNotificationScheduler() {
  const notificationPrefs = useProfileStore((s) => s.notificationPreferences);
  const pendingNotes = useProfileStore((s) => s.pendingCoachingNotes);
  const { data: workouts = [] } = useWorkoutHistory();
  
  const scheduledIds = useRef<number[]>([]);

  // Check if we should show notifications (only in browser)
  const permission = typeof window !== 'undefined' ? getNotificationPermission() : 'default';
  const shouldNotify = notificationPrefs.enabled && permission === 'granted';

  useEffect(() => {
    if (!shouldNotify) return;

    // Schedule rest day reminders
    if (notificationPrefs.restDayReminders) {
      const lastWorkout = workouts[0];
      if (lastWorkout) {
        const daysSinceLastWorkout = Math.floor(
          (Date.now() - new Date(lastWorkout.completedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        const restDayThreshold = notificationPrefs.restDayThresholdDays ?? 3;
        if (daysSinceLastWorkout >= restDayThreshold) {
          const payload: NotificationPayload = {
            type: 'rest_day_reminder',
            title: 'Time to Train!',
            body: `It's been ${daysSinceLastWorkout} days since your last workout. Your body is ready!`,
            tag: 'rest-day-reminder',
          };

          // Schedule for next day at 10am if not already shown today
          const nextReminder = new Date();
          nextReminder.setDate(nextReminder.getDate() + 1);
          nextReminder.setHours(10, 0, 0, 0);
          const delayMs = nextReminder.getTime() - Date.now();

          if (delayMs > 0) {
            const id = schedulePushNotification(payload, delayMs);
            if (id !== null) {
              scheduledIds.current.push(id);
            }
          }
        }
      }
    }

    // Schedule streak alerts (daily check-in)
    if (notificationPrefs.streakAlerts) {
      const streakTime = notificationPrefs.streakAlertTime ?? '09:00';
      const [hours, minutes] = streakTime.split(':').map(Number);

      const now = new Date();
      const nextAlert = new Date();
      nextAlert.setHours(hours, minutes, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (nextAlert <= now) {
        nextAlert.setDate(nextAlert.getDate() + 1);
      }

      const delayMs = nextAlert.getTime() - now.getTime();

      const payload: NotificationPayload = {
        type: 'streak_alert',
        title: 'Daily Check-In',
        body: 'Keep your momentum going! Log your workout today.',
        tag: 'streak-alert',
      };

      const id = schedulePushNotification(payload, delayMs);
      if (id !== null) {
        scheduledIds.current.push(id);
      }
    }

    // Schedule deload prompts
    if (notificationPrefs.deloadPrompts && pendingNotes.some((n) => n.type === 'reduce_load')) {
      // If there are reduce_load coaching notes, consider showing deload prompt
      const highFatigueExercises = pendingNotes.filter((n) => n.type === 'reduce_load').length;

      if (highFatigueExercises >= 2) {
        const payload: NotificationPayload = {
          type: 'deload_prompt',
          title: 'Recovery Week Suggested',
          body: `${highFatigueExercises} exercises showing high fatigue. Consider scheduling a deload.`,
          tag: 'deload-prompt',
        };

        // Schedule for 2 hours from now
        const id = schedulePushNotification(payload, 2 * 60 * 60 * 1000);
        if (id !== null) {
          scheduledIds.current.push(id);
        }
      }
    }

    // Schedule coaching note notifications (2h after session completion)
    if (notificationPrefs.coachingNotes) {
      const lastWorkout = workouts[0];
      if (lastWorkout) {
        const timeSinceWorkout = Date.now() - new Date(lastWorkout.completedAt).getTime();
        const twoHours = 2 * 60 * 60 * 1000;

        // If last workout was less than 2h ago and we have coaching notes
        if (timeSinceWorkout < twoHours && pendingNotes.length > 0) {
          const delayMs = twoHours - timeSinceWorkout;

          const payload: NotificationPayload = {
            type: 'coaching_note',
            title: 'New Coaching Suggestions',
            body: `${pendingNotes.length} new suggestion${pendingNotes.length > 1 ? 's' : ''} based on your recent session.`,
            tag: 'coaching-notes',
          };

          const id = schedulePushNotification(payload, delayMs);
          if (id !== null) {
            scheduledIds.current.push(id);
          }
        }
      }
    }

    // Cleanup scheduled notifications on unmount
    return () => {
      scheduledIds.current.forEach((id) => {
        window.clearTimeout(id);
      });
      scheduledIds.current = [];
    };
  }, [
    shouldNotify,
    notificationPrefs,
    workouts,
    pendingNotes,
  ]);

  return {
    requestPermission: requestNotificationPermission,
    permission: typeof window !== 'undefined' ? getNotificationPermission() : 'default',
  };
}
