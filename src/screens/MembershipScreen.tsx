import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  Image,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useUser } from "../context/UserContext";
import { useToast } from "../components/Toast";
import apiClient from "../api/apiClient";
import { CheckCircle2, ChevronRight, Zap } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function MembershipScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, refreshUser } = useUser();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<any[]>([]);
  const [gymData, setGymData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribingTo, setSubscribingTo] = useState<string | null>(null);
  const [reference, setReference] = useState<string>("");
  const [originPhone, setOriginPhone] = useState<string>("");
  const [originDocument, setOriginDocument] = useState<string>("");
  const [originBank, setOriginBank] = useState<string>("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [allGyms, setAllGyms] = useState<any[]>([]);
  const [joiningGym, setJoiningGym] = useState<string | null>(null);

  // Lista de bancos venezolanos principales
  const VENEZUELAN_BANKS = [
    "0102 - Banco de Venezuela",
    "0104 - Banco Venezolano de Crédito",
    "0105 - Banco Mercantil",
    "0108 - Banco Provincial",
    "0114 - Bancaribe",
    "0115 - Banco Exterior",
    "0128 - Banco Caroní",
    "0134 - Banesco",
    "0138 - Banco Plaza",
    "0151 - BFC Banco Fondo Común",
    "0156 - 100% Banco",
    "0157 - Banco del Sur",
    "0163 - Bancamiga",
    "0168 - Bancrecer",
    "0169 - Mi Banco",
    "0171 - Banco Activo",
    "0172 - Bancamiga",
    "0174 - Banplus",
    "0175 - Banco Bicentenario",
    "0177 - Banfanb",
  ];

  useEffect(() => {
    fetchPlans();
  }, [user?.gymId]);

  const [confirmingPlan, setConfirmingPlan] = useState<any>(null);

  // Use Toast instead of Alert for professional UX
  const safeAlert = (
    title: string,
    msg: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    showToast(`${title}: ${msg}`, type);
  };

  const fetchPlans = async (forcedGymId?: string) => {
    try {
      setLoading(true);
      const currentGymId = forcedGymId || user?.gymId;
      
      // If user doesn't have a gymId yet, don't try to fetch gym-specific data
      if (!currentGymId) {
        setPlans([]);
        setGymData(null);
        const gymsRes = await apiClient.get("/gyms").catch(() => ({ data: [] }));
        setAllGyms(gymsRes.data || []);
        return;
      }

      const [plansRes, gymRes] = await Promise.all([
        apiClient.get("/user/plans").catch(() => ({ data: [] })),
        apiClient.get("/gyms/my").catch(() => ({ data: null })),
      ]);
      setPlans(plansRes.data || []);
      setGymData(gymRes.data || null);

      // If for some reason gymRes failed despite having gymId, fetch all gyms as fallback
      if (!gymRes.data) {
        const gymsRes = await apiClient.get("/gyms").catch(() => ({ data: [] }));
        setAllGyms(gymsRes.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch plans", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGym = async (gymId: string) => {
    setJoiningGym(gymId);
    try {
      await apiClient.put("/user/profile", { gymId });
      await refreshUser();
      showToast("¡Te has unido al gimnasio!", "success");
      fetchPlans(gymId); // Refresh data with the ID we just used
    } catch (error: any) {
      safeAlert("Error", error.message || "No se pudo unir al gimnasio", "error");
    } finally {
      setJoiningGym(null);
    }
  };

  const confirmSubscription = async () => {
    if (!confirmingPlan) return;
    const planId = confirmingPlan.id;

    if (!reference || !originPhone || !originDocument || !originBank) {
      safeAlert(
        "Datos incompletos",
        "Por favor completa todos los datos del pago móvil.",
        "error",
      );
      return;
    }

    setSubscribingTo(planId);

    try {
      const response = await apiClient.post(`/user/subscribe/${planId}`, {
        paymentMethod: "mobile",
        reference: reference,
        originPhone: originPhone,
        originDocument: originDocument,
        originBank: originBank,
      });
      if (refreshUser) await refreshUser();
      setConfirmingPlan(null); // Hide modal only on success
      setReference("");
      setOriginPhone("");
      setOriginDocument("");
      setOriginBank("");
      safeAlert(
        "¡Éxito!",
        "Te has suscrito exitosamente al plan. El pago ha sido procesado.",
        "success",
      );
    } catch (error: any) {
      console.error(error);
      setConfirmingPlan(null);
      safeAlert(
        "Error",
        error.message || "No se pudo procesar tu inscripción.",
        "error",
      );
    } finally {
      setSubscribingTo(null);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <View style={{ marginTop: 40, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Image
            source={require("../assets/Imagotipo.png")}
            style={{ width: 40, height: 40, marginRight: 12 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text }}>
            Suscripciones
          </Text>
        </View>
        <Text
          style={{ fontSize: 16, color: colors.textSecondary, marginTop: 4 }}
        >
          Mejora tu entrenamiento adquiriendo un plan.
        </Text>
      </View>

      {!gymData ? (
        <View style={{ gap: 16 }}>
          <View
            style={{
              backgroundColor: colors.card,
              padding: 24,
              borderRadius: 24,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.primary + "15",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Image
                source={require("../assets/Imagotipo.png")}
                style={{ width: 32, height: 32 }}
                tintColor={colors.primary}
              />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              No tienes un gimnasio asociado
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              Para ver los planes disponibles, primero debes seleccionar tu
              gimnasio de la lista a continuación.
            </Text>

            <View style={{ width: "100%", gap: 12 }}>
              {allGyms.length === 0 ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                allGyms.map((gym) => (
                  <TouchableOpacity
                    key={gym.id}
                    onPress={() => handleJoinGym(gym.id)}
                    disabled={!!joiningGym}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: colors.background,
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: colors.text,
                        }}
                      >
                        {gym.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {gym.address || "Sede Principal"}
                      </Text>
                    </View>
                    {joiningGym === gym.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <ChevronRight size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </View>
      ) : plans.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.card,
            padding: 32,
            borderRadius: 24,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Zap size={48} color={colors.textSecondary} strokeWidth={1} />
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "bold",
              marginTop: 16,
            }}
          >
            Sin planes activos
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Tu gimnasio ({gymData.name}) no tiene planes de suscripción configurados en este momento.
          </Text>
        </View>
      ) : (
        plans.map((plan) => {
          // Normalize comparison just in case
          const isCurrentPlan =
            (user as any)?.planId?.toLowerCase() === plan.id.toLowerCase();

          return (
            <View
              key={plan.id}
              style={{
                backgroundColor: colors.card,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: isCurrentPlan ? 2 : 0,
                borderColor: isCurrentPlan ? colors.primary : "#E2E8F0",
                ...Platform.select({
                  web: { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } as any,
                  default: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 5,
                  },
                }),
              }}
            >
              {isCurrentPlan && (
                <View
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    backgroundColor: "#EFF6FF",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    Plan Actual
                  </Text>
                </View>
              )}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor:
                      plan.planType.toLowerCase() === "premium"
                        ? "#FFFBEB"
                        : "#F1F5F9",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Zap
                    size={24}
                    color={
                      plan.planType.toLowerCase() === "premium"
                        ? "#D97706"
                        : colors.primary
                    }
                  />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: colors.text,
                    }}
                  >
                    {plan.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                    {plan.planType} • Mensual
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  fontSize: 15,
                  color: colors.text,
                  marginBottom: 20,
                  lineHeight: 22,
                }}
              >
                {plan.description}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  ${plan.price}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.textSecondary,
                    marginBottom: 6,
                    marginLeft: 4,
                  }}
                >
                  /mes
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setConfirmingPlan(plan)}
                disabled={isCurrentPlan || subscribingTo === plan.id}
              >
                <LinearGradient
                  colors={
                    isCurrentPlan
                      ? ["#E2E8F0", "#CBD5E1"]
                      : [colors.primary, colors.secondary]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    opacity: subscribingTo === plan.id ? 0.7 : 1,
                  }}
                >
                  {subscribingTo === plan.id ? (
                    <ActivityIndicator color={colors.card} />
                  ) : (
                    <>
                      <Text
                        style={{
                          color: isCurrentPlan ? colors.textSecondary : "#FFF",
                          fontSize: 16,
                          fontWeight: "bold",
                          marginRight: 8,
                        }}
                      >
                        {isCurrentPlan ? "Activado" : "Elegir Plan"}
                      </Text>
                      {!isCurrentPlan && (
                        <ChevronRight color="#FFF" size={20} />
                      )}
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      {/* Custom React Native Modal for Confirmation */}
      <Modal
        visible={!!confirmingPlan}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmingPlan(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              padding: 24,
              borderRadius: 20,
              width: "100%",
              maxWidth: 400,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 12,
              }}
            >
              Confirmar Suscripción
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                marginBottom: 16,
                lineHeight: 22,
              }}
            >
              Transferencia por Pago Móvil al Gimnasio.
            </Text>

            <View
              style={{
                backgroundColor: colors.background,
                padding: 16,
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 4 }}>
                Monto a Transferir (Bs)
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: colors.primary,
                }}
              >
                Bs.{" "}
                {confirmingPlan
                  ? (
                      confirmingPlan.price * (gymData?.exchangeRate || 0)
                    ).toFixed(2)
                  : "0.00"}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Tasa del día: {gymData?.exchangeRate || "No disponible"} Bs/$
              </Text>
            </View>

            <ScrollView
              style={{ maxHeight: 350, width: "100%", paddingRight: 5 }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  color: colors.textSecondary,
                  marginBottom: 4,
                }}
              >
                Banco de Origen:
              </Text>
              <TouchableOpacity
                onPress={() => setShowBankDropdown(!showBankDropdown)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border || "#E2E8F0",
                  borderRadius: 12,
                  padding: 12,
                  backgroundColor: colors.background,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: originBank ? colors.text : "#94A3B8" }}>
                  {originBank || "Seleccionar Banco"}
                </Text>
              </TouchableOpacity>

              {showBankDropdown && (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border || "#E2E8F0",
                    borderRadius: 12,
                    backgroundColor: colors.background,
                    marginBottom: 12,
                    maxHeight: 150,
                    overflow: "hidden",
                  }}
                >
                  <ScrollView nestedScrollEnabled={true}>
                    {VENEZUELAN_BANKS.map((bank, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setOriginBank(bank);
                          setShowBankDropdown(false);
                        }}
                        style={{
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border || "#F1F5F9",
                        }}
                      >
                        <Text style={{ color: colors.text }}>{bank}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "bold",
                      color: colors.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    Cédula Origen:
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border || "#E2E8F0",
                      borderRadius: 12,
                      padding: 12,
                      color: colors.text,
                      marginBottom: 12,
                      backgroundColor: colors.background,
                    }}
                    placeholder="Ej. 12345678"
                    placeholderTextColor="#94A3B8"
                    value={originDocument}
                    onChangeText={setOriginDocument}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "bold",
                      color: colors.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    Teléfono Origen:
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border || "#E2E8F0",
                      borderRadius: 12,
                      padding: 12,
                      color: colors.text,
                      marginBottom: 12,
                      backgroundColor: colors.background,
                    }}
                    placeholder="Ej. 04141234567"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={originPhone}
                    onChangeText={setOriginPhone}
                  />
                </View>
              </View>

              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  color: colors.textSecondary,
                  marginBottom: 4,
                }}
              >
                Número de Referencia:
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border || "#E2E8F0",
                  borderRadius: 12,
                  padding: 12,
                  color: colors.text,
                  marginBottom: 20,
                  backgroundColor: colors.background,
                }}
                placeholder="Ej. 1234567"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                value={reference}
                onChangeText={setReference}
              />
            </ScrollView>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => setConfirmingPlan(null)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  backgroundColor: colors.background,
                }}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSubscription}
                disabled={subscribingTo === confirmingPlan?.id}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  backgroundColor:
                    subscribingTo === confirmingPlan?.id
                      ? "#94A3B8"
                      : colors.primary,
                }}
              >
                {subscribingTo === confirmingPlan?.id ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    Sí, Pagar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
