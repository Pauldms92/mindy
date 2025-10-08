import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function scheduleDailyNotification(hour=19, minute=0) {
  if (Device.isDevice) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Mindy', body: '5 minutes pour progresser 🧠' },
      trigger: { hour, minute, repeats: true }
    });
    return true;
  }
  return false;
}
