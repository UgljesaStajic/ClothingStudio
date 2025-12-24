import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, useColorScheme, Text } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDecay,
  runOnJS,
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
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  useEffect(() => {
    const update = () => setDimensions(Dimensions.get('window'));
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    console.log('MannequinViewer3D - Images received:', images.length);
    if (images.length > 0) {
      console.log('First image:', images[0]);
      updateCurrentImage(0);
    }
  }, [images]);

  // Update current image based on rotation
  const updateCurrentImage = (rotationValue: number) => {
    if (images.length === 0) return;
    
    // Normalize rotation to 0-360
    const normalizedRotation = ((rotationValue % 360) + 360) % 360;
    
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
    let closestIndex = 0;
    let minDiff = 360;
    
    images.forEach((image, index) => {
      const imageAngle = angleMap[image.angle] ?? 0;
      let diff = Math.abs(normalizedRotation - imageAngle);
      if (diff > 180) diff = 360 - diff;
      
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });
    
    setCurrentImageIndex(closestIndex);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedRotation.value = rotation.value;
    })
    .onUpdate((event) => {
      rotation.value = savedRotation.value + event.translationX * 0.8;
      runOnJS(updateCurrentImage)(rotation.value);
    })
    .onEnd((event) => {
      // Add velocity-based decay for smooth rotation
      rotation.value = withDecay(
        {
          velocity: event.velocityX * 0.5,
          deceleration: 0.998,
        },
        (finished) => {
          if (finished) {
            // Snap to nearest 90-degree angle
            const nearestAngle = Math.round(rotation.value / 90) * 90;
            rotation.value = withSpring(nearestAngle, { damping: 15 });
            runOnJS(updateCurrentImage)(nearestAngle);
          }
        }
      );
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = Math.max(0.5, Math.min(3, savedScale.value * event.scale));
    })
    .onEnd(() => {
      if (scale.value < 0.8 || scale.value > 2) {
        scale.value = withSpring(1);
      }
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
      ],
    };
  });

  const viewWidth = Math.max(1, dimensions.width - 32);
  const viewHeight = Math.max(300, viewWidth * 1.33);

  const currentImage = images[currentImageIndex];

  const rotationIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });



  if (images.length === 0) {
    console.log('MannequinViewer3D - No images, showing empty state');
    return (
      <View style={[styles.container, { height: viewHeight, backgroundColor: theme.surface }]}>
        <View style={styles.emptyState}>
          <Text style={{ color: theme.textSecondary }}>No images available</Text>
        </View>
      </View>
    );
  }

  console.log('MannequinViewer3D - Rendering with currentImageIndex:', currentImageIndex);
  console.log('MannequinViewer3D - Current image:', currentImage);

  return (
    <View style={[styles.container, { height: viewHeight, backgroundColor: theme.backgroundSecondary }]}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.viewer, { width: viewWidth, height: viewHeight }, animatedStyle]}>
          {currentImage ? (
            <>
              <Image
                source={{ uri: currentImage.image_url }}
                style={styles.imageLayer}
                contentFit="contain"
                recyclingKey={currentImage.id}
                cachePolicy="memory-disk"
                onError={(error) => console.log('Image load error:', error)}
                onLoad={() => console.log('Image loaded successfully:', currentImage.angle)}
              />
              <Animated.View style={[styles.rotationIndicator, rotationIndicatorStyle]}>
                <View style={[styles.rotationDot, { backgroundColor: theme.primary }]} />
              </Animated.View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={{ color: theme.textSecondary }}>Loading...</Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
      {currentImage && (
        <View style={styles.angleIndicator}>
          <Text style={[styles.angleText, { color: theme.text }]}>
            {currentImage.angle.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      )}
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
  rotationIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 0,
  },
  angleIndicator: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
  },
  angleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
