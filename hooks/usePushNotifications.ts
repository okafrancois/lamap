import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "convex/react";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

export function usePushNotifications() {
  const { convexUser } = useAuth();
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const appStateSubscription = useRef<ReturnType<
    typeof AppState.addEventListener
  > | null>(null);

  const recordToken = useMutation(
    api.notifications.recordPushNotificationToken
  );

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const isAppActive = appState === "active";
        const notificationType = notification.request.content.data?.type;
        const isMatchFoundNotification = notificationType === "match_found";

        const shouldSuppress = isMatchFoundNotification && isAppActive;

        return {
          shouldShowAlert: !shouldSuppress,
          shouldPlaySound: !shouldSuppress,
          shouldSetBadge: true,
          shouldShowBanner: !shouldSuppress,
          shouldShowList: !shouldSuppress,
        };
      },
    });
  }, [appState]);

  useEffect(() => {
    appStateSubscription.current = AppState.addEventListener(
      "change",
      (nextAppState) => {
        setAppState(nextAppState);
      }
    );

    return () => {
      if (appStateSubscription.current) {
        appStateSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!convexUser?._id) {
      return;
    }

    let isMounted = true;

    const registerToken = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token && isMounted && convexUser?._id) {
          setExpoPushToken(token);
          console.log("Registering push token for user:", convexUser._id);
          await recordToken({ userId: convexUser._id, token });
          console.log("Push token registered successfully");
        } else if (!token) {
          console.warn("No push token obtained");
        }
      } catch (error) {
        console.error("Error registering push token:", error);
      }
    };

    registerToken();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.route && typeof data.route === "string") {
          router.push(data.route as any);
        }
      });

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [convexUser?._id, recordToken, router]);

  return {
    expoPushToken,
    notification,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (!Device.isDevice) {
    console.warn("Must use physical device for push notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn(
      "Permission not granted to get push token for push notification!"
    );
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.warn("Project ID not found");
    return null;
  }

  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    console.log("Expo push token obtained:", pushTokenString);
    return pushTokenString;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}
