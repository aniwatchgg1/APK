import { useAuth } from "@/utils/auth/useAuth";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();

  useEffect(() => {
    initiate();
  }, [initiate]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="survey/[id]"
            options={{
              headerShown: true,
              title: "সমীক্ষা ফরম",
              headerBackTitle: "ড্যাশবোর্ড",
              headerTintColor: "#2563EB",
              headerTitleStyle: { fontWeight: "600", color: "#111827" },
            }}
          />
          <Stack.Screen name="survey/create" options={{ headerShown: false }} />
          <Stack.Screen
            name="survey/edit-info"
            options={{ headerShown: false }}
          />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
