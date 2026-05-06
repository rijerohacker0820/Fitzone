import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/Toast";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Mail, Lock, Check } from "lucide-react-native";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import apiClient from "../api/apiClient";

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export default function ForgotPasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [step, setStep] = useState<"email" | "success">("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      showToast("Ingresa un correo electrónico válido", "error");
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email: trimmedEmail });
      setStep("success");
      showToast("Enlace de recuperación enviado", "success");
    } catch (error: any) {
      // Show success anyway for security (don't reveal if email exists)
      setStep("success");
      showToast("Si el correo existe, recibirás instrucciones", "info");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: spacing.xl,
            }}
          >
            <ChevronLeft size={24} color={colors.text} />
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "600",
                marginLeft: 4,
              }}
            >
              Volver
            </Text>
          </TouchableOpacity>

          {step === "email" ? (
            <View style={{ flex: 1, justifyContent: "center" }}>
              {/* Icon */}
              <View
                style={{
                  alignItems: "center",
                  marginBottom: spacing.xl,
                }}
              >
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.primary + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: spacing.md,
                  }}
                >
                  <Lock size={36} color={colors.primary} />
                </View>
                <Text
                  style={[
                    typography.title,
                    { color: colors.text, textAlign: "center" },
                  ]}
                >
                  Recuperar Contraseña
                </Text>
                <Text
                  style={[
                    typography.body,
                    {
                      color: colors.textSecondary,
                      textAlign: "center",
                      marginTop: spacing.sm,
                    },
                  ]}
                >
                  Ingresa tu correo y te enviaremos instrucciones para restablecer
                  tu contraseña
                </Text>
              </View>

              {/* Email Input */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text
                  style={{
                    color: colors.text,
                    marginBottom: spacing.sm,
                    fontWeight: "600",
                    fontSize: 14,
                    marginLeft: spacing.xs,
                  }}
                >
                  Correo electrónico
                </Text>
                <View
                  style={{
                    borderRadius: 20,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <Mail size={20} color={colors.textSecondary} />
                  <TextInput
                    style={{
                      flex: 1,
                      padding: spacing.md,
                      color: colors.text,
                      fontSize: 16,
                      height: 56,
                    }}
                    placeholder="tucorreo@ejemplo.com"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Send Button */}
              <TouchableOpacity
                onPress={handleSendReset}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: spacing.md,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    height: 60,
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text
                      style={{
                        color: "#FFF",
                        fontSize: 18,
                        fontWeight: "bold",
                        letterSpacing: 1,
                      }}
                    >
                      ENVIAR INSTRUCCIONES
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#00D68F20",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: spacing.lg,
                }}
              >
                <Check size={40} color="#00D68F" />
              </View>
              <Text
                style={[
                  typography.title,
                  { color: colors.text, textAlign: "center" },
                ]}
              >
                ¡Revisa tu correo!
              </Text>
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginTop: spacing.sm,
                    paddingHorizontal: spacing.lg,
                  },
                ]}
              >
                Si existe una cuenta con ese correo, recibirás un enlace para
                restablecer tu contraseña.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ marginTop: spacing.xl }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingHorizontal: 32,
                    paddingVertical: 14,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFF",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    Volver al Login
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
