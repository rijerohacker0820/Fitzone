import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withSpring, 
    withDelay, 
    runOnJS 
} from 'react-native-reanimated';
import { BRAND } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const logoScale = useSharedValue(0.3);
    const logoOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(30);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        // Phase 1: Logo appears
        logoScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 90 }));
        logoOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));

        // Phase 2: Tagline slides up
        textOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
        textTranslateY.value = withDelay(1000, withTiming(0, { duration: 600 }));

        // Phase 3: Fade out container and finish
        setTimeout(() => {
            containerOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
                if (finished) {
                    runOnJS(onFinish)();
                }
            });
        }, 2500);
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }],
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
        flex: 1,
    }));

    return (
        <Animated.View style={containerStyle}>
            <LinearGradient
                colors={[BRAND.dark, '#000000']}
                style={styles.gradient}
            >
                <Animated.View style={[styles.logoContainer, logoStyle]}>
                    <Image
                        source={require('../assets/Isologo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                <Animated.View style={[styles.textContainer, textStyle]}>
                    <Text style={styles.tagline}>Train smarter. Push harder.</Text>
                </Animated.View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: BRAND.orange,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    logo: {
        width: 80,
        height: 80,
    },
    textContainer: {
        position: 'absolute',
        bottom: height * 0.15,
        alignItems: 'center',
    },
    tagline: {
        color: BRAND.white,
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 2,
        opacity: 0.9,
    },
});
