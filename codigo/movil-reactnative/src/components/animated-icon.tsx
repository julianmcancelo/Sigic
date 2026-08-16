import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const DURATION = 700;
const OVERLAY_DURATION = 2200;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setVisible(false);
        }
      });
    }, OVERLAY_DURATION);

    return () => clearTimeout(timeout);
  }, [opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.backgroundSolidColor, { opacity }]}>
      <View style={styles.centerContainer}>
        <AnimatedIcon />
      </View>
    </Animated.View>
  );
}

export function AnimatedIcon() {
  const scale = useRef(new Animated.Value(0.84)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const glowRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(glowRotation, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    Animated.parallel([
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
      loop,
    ]).start();

    return () => loop.stop();
  }, [glowRotation, iconOpacity, scale]);

  const spin = glowRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.glow, { transform: [{ rotate: spin }] }]}>
        <Image style={styles.glow} source={require('../../assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View
        style={[
          styles.background,
          {
            opacity: iconOpacity,
            transform: [{ scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: iconOpacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Image style={styles.image} source={require('../../assets/images/logo-oficial.png')} contentFit="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 200,
    height: 200,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 140,
    height: 140,
    zIndex: 100,
  },
  image: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  background: {
    borderRadius: 70,
    backgroundColor: '#ffffff',
    width: 140,
    height: 140,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  backgroundSolidColor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#0b0f19',
    zIndex: 1000,
  },
});
