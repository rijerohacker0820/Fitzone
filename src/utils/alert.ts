import { Alert, Platform } from "react-native";

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export const customAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  if (Platform.OS === "web") {
    if (!buttons || buttons.length === 0) {
      (globalThis as any).alert(`${title}${message ? `\n\n${message}` : ""}`);
    } else if (buttons.length === 1) {
      (globalThis as any).alert(`${title}${message ? `\n\n${message}` : ""}`);
      buttons[0].onPress?.();
    } else {
      // Assume 2 buttons for confirm (Cancel / OK or Cancel / Delete)
      const confirmButton =
        buttons.find((b) => b.style !== "cancel") ||
        buttons[buttons.length - 1];
      const cancelButton =
        buttons.find((b) => b.style === "cancel") || buttons[0];

      const result = (globalThis as any).confirm(
        `${title}${message ? `\n\n${message}` : ""}`,
      );
      if (result) {
        confirmButton.onPress?.();
      } else {
        cancelButton.onPress?.();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
