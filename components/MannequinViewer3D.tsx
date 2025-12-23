import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { GeneratedImage } from '@/types';
import { colors } from '@/constants/theme';

interface MannequinViewer3DProps {
  images: GeneratedImage[];
}

export function MannequinViewer3D({ images }: MannequinViewer3DProps) {
  const [dimensions, setDimensions] = useState({ width: 375, height: 500 });
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  
  const rotationY = useSharedValue(0);
  const rotationX = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedRotationY = useSharedValue(0);
  const savedRotationX = useSharedValue(0);

  React.useEffect(() => {
    const update = () => setDimensions(Dimensions.get('window'));
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  // Map rotation to image index
  const getImageForRotation = (rotation: number) => {
    if (images.length === 0) return null;
    
    // Normalize rotation to 0-360
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    
    // Create angle map based on available images
    const angleMap: { [key: string]: number } = {
      front: 0,
      right_side: 90,
      right_sleeve: 90,
      back: 180,
      left_side: 270,
      left_sleeve: 270,
    };
    
    // Find closest image based on rotation
    let closestImage = images[0];
    let minDiff = 360;
    
    for (const image of images) {
      const imageAngle = angleMap[image.angle] ?? 0;
      let diff = Math.abs(normalizedRotation - imageAngle);
      if (diff > 180) diff = 360 - diff;
      
      if (diff < minDiff) {
        minDiff = diff;
        closestImage = image;
      }
    }
    
    return closestImage;
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedRotationY.value = rotationY.value;
      savedRotationX.value = rotationX.value;
    })
    .onUpdate((event) => {
      rotationY.value = savedRotationY.value + event.translationX * 0.5;
      rotationX.value = Math.max(
        -30,
        Math.min(30, savedRotationX.value - event.translationY * 0.3)
      );
    })
    .onEnd(() => {
      // Snap to nearest 90-degree angle
      const nearestAngle = Math.round(rotationY.value / 90) * 90;
      rotationY.value = withSpring(nearestAngle, { damping: 15 });
      rotationX.value = withSpring(0, { damping: 15 });
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(0.8, Math.min(2.5, event.scale));
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => {
    const currentImage = getImageForRotation(rotationY.value);
    
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotationY.value}deg` },
        { rotateX: `${rotationX.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  const viewWidth = Math.max(1, dimensions.width - 32);
  const viewHeight = Math.max(300, viewWidth * 1.33);

  // Render image layers for each angle
  const renderImageLayers = () => {
    const angleMap: { [key: string]: number } = {
      front: 0,
      right_side: 90,
      right_sleeve: 90,
      back: 180,
      left_side: 270,
      left_sleeve: 270,
    };

    return images.map((image, index) => {
      const baseRotation = angleMap[image.angle] ?? 0;
      
      const layerStyle = useAnimatedStyle(() => {
        // Calculate angle difference
        const currentRotation = ((rotationY.value % 360) + 360) % 360;
        const angleDiff = Math.abs(currentRotation - baseRotation);
        const normalizedDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff;
        
        // Calculate opacity based on angle
        const opacity = interpolate(
          normalizedDiff,
          [0, 45, 90],
          [1, 0.5, 0],
          Extrapolation.CLAMP
        );
        
        return {
          opacity,
          zIndex: opacity > 0.5 ? 10 : 1,
        };
      });

      return (
        <Animated.View
          key={`${image.id}-${index}`}
          style={[
            StyleSheet.absoluteFill,
            layerStyle,
          ]}
        >
          <Image
            source={{ uri: image.image_url }}
            style={styles.imageLayer}
            contentFit="contain"
            recyclingKey={image.id}
            cachePolicy="memory-disk"
          />
        </Animated.View>
      );
    });
  };

  if (images.length === 0) {
    return (
      <View style={[styles.container, { height: viewHeight, backgroundColor: theme.surface }]}>
        <View style={styles.emptyState}>
          <Animated.Text style={{ color: theme.textSecondary }}>No images available</Animated.Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: viewHeight }]}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.viewer, { width: viewWidth, height: viewHeight }, animatedStyle]}>
          {renderImageLayers()}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  viewer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageLayer: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
