import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { View, Text, Animated, StyleSheet, Platform } from "react-native";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, text: message, type }]);

    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={[styles.container, { pointerEvents: "none" as const }]}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast }: { toast: ToastMessage }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  // Web doesn't support useNativeDriver for transform/opacity
  const useNative = Platform.OS !== "web";

  React.useEffect(() => {
    // Fade in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: useNative,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: useNative,
      }),
    ]).start();

    // Fade out before removal
    const fadeOutTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: useNative,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 300,
          useNativeDriver: useNative,
        }),
      ]).start();
    }, 3000);

    return () => clearTimeout(fadeOutTimer);
  }, []);

  const bgColor =
    toast.type === "success"
      ? "#059669"
      : toast.type === "error"
        ? "#DC2626"
        : "#2563EB";

  const icon =
    toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ";

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: bgColor,
          opacity,
          transform: [{ translateY }],
        },
        // Platform-specific shadow
        Platform.OS === "web"
          ? ({ boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.25)" } as any)
          : {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
            },
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.text} numberOfLines={3}>
        {toast.text}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    width: "100%",
  },
  icon: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
});
