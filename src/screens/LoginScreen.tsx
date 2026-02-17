import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginScreen() {
    const { login } = useUser();
    const { colors } = useTheme();
    const { t } = useLanguage();

    // Hardcoded for now based on the request requirements, but editable
    const [email, setEmail] = useState('test2@test.com');
    const [password, setPassword] = useState('password');
    const [fullName, setFullName] = useState('Usuario Prueba 2'); // Required by the specific API endpoint provided
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setIsLoading(true);
        try {
            await login({
                email,
                password,
                fullName // Passing this as required by the API provided in the prompt
            });
            // Navigation will be handled by the RootNavigator based on user state
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: 'center' }}>
            <View style={{ marginBottom: 40 }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>
                    Welcome Back
                </Text>
                <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                    Sign in to continue
                </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.text, marginBottom: 5 }}>Email</Text>
                <TextInput
                    style={{
                        backgroundColor: colors.card,
                        borderRadius: 10,
                        padding: 15,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.secondary
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>

            <View style={{ marginBottom: 30 }}>
                <Text style={{ color: colors.text, marginBottom: 5 }}>Password</Text>
                <TextInput
                    style={{
                        backgroundColor: colors.card,
                        borderRadius: 10,
                        padding: 15,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.secondary
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            {/* Hidden field for fullName, or we could expose it if it's actually a signup/login hybrid */}
            {/* Keeping it hidden for now as standard login doesn't ask for name */}

            <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                style={{
                    backgroundColor: colors.primary,
                    padding: 15,
                    borderRadius: 10,
                    alignItems: 'center',
                    opacity: isLoading ? 0.7 : 1
                }}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
                        Login
                    </Text>
                )}
            </TouchableOpacity>
        </SafeAreaView>
    );
}
