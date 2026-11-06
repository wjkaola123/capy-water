import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { reminderSlots } from "./hydration";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
const PREFIX = "capy-water-";
export async function applyReminders(config) {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("capy-water", {
      name: "卡皮的喝水邀请",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
  const old = (await Notifications.getAllScheduledNotificationsAsync()).filter(
    (n) => n.identifier.startsWith(PREFIX),
  );
  if (!config.enabled) {
    await Promise.all(
      old.map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier),
      ),
    );
    return;
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted)
    permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error("通知权限还未开启，请在系统设置中允许卡皮发送通知。");
  const added = [];
  try {
    const generation = Date.now();
    for (const [i, slot] of reminderSlots(config).entries()) {
      const identifier = `${PREFIX}${generation}-${i}`;
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: "卡皮给你留了一杯水 🍊",
          body: "休息一下，喝口水吧。慢慢来，我陪着你。",
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          ...slot,
          channelId: "capy-water",
        },
      });
      added.push(identifier);
    }
    await Promise.all(
      old.map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier),
      ),
    );
  } catch (error) {
    await Promise.allSettled(
      added.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
    );
    throw new Error("提醒未能保存，请检查通知权限后重试。");
  }
}
export async function reminderPermission() {
  return (await Notifications.getPermissionsAsync()).granted;
}
