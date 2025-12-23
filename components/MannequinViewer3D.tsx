import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer, THREE } from 'expo-three';
import * as FileSystem from 'expo-file-system';
import type { GeneratedImage } from '@/types';

interface MannequinViewer3DProps {
  images: GeneratedImage[];
}

export function MannequinViewer3D({ images }: MannequinViewer3DProps) {
  const [dimensions, setDimensions] = useState({ width: 375, height: 500 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    const update = () => setDimensions(Dimensions.get('window'));
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        rotationRef.current.y += gestureState.dx * 0.01;
        rotationRef.current.x += gestureState.dy * 0.01;
        rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x));
      },
    })
  ).current;

  const onContextCreate = async (gl: any) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // Create mannequin geometry (cylinder-based body)
    const mannequinGroup = new THREE.Group();

    // Load textures from generated images
    const textureLoader = new THREE.TextureLoader();
    const textures: { [key: string]: THREE.Texture } = {};

    for (const image of images) {
      try {
        // Download image to local file system for Three.js
        const fileUri = FileSystem.cacheDirectory + `texture_${image.angle}.jpg`;
        await FileSystem.downloadAsync(image.image_url, fileUri);
        
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          textureLoader.load(
            fileUri,
            (tex) => {
              tex.wrapS = THREE.ClampToEdgeWrapping;
              tex.wrapT = THREE.ClampToEdgeWrapping;
              resolve(tex);
            },
            undefined,
            reject
          );
        });
        
        textures[image.angle] = texture;
      } catch (error) {
        console.error(`Failed to load texture for ${image.angle}:`, error);
      }
    }

    // Create body (main cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.9, 3, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures['front'] || null,
      side: THREE.DoubleSide,
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    mannequinGroup.add(bodyMesh);

    // If we have multiple angle textures, create multiple faces
    if (textures['back']) {
      // Create back face plane
      const backPlane = new THREE.PlaneGeometry(1.6, 3);
      const backMaterial = new THREE.MeshStandardMaterial({
        map: textures['back'],
        side: THREE.DoubleSide,
      });
      const backMesh = new THREE.Mesh(backPlane, backMaterial);
      backMesh.position.z = -0.9;
      mannequinGroup.add(backMesh);
    }

    if (textures['left_side'] || textures['left_sleeve']) {
      const leftPlane = new THREE.PlaneGeometry(1.8, 3);
      const leftMaterial = new THREE.MeshStandardMaterial({
        map: textures['left_side'] || textures['left_sleeve'],
        side: THREE.DoubleSide,
      });
      const leftMesh = new THREE.Mesh(leftPlane, leftMaterial);
      leftMesh.rotation.y = Math.PI / 2;
      leftMesh.position.x = -0.9;
      mannequinGroup.add(leftMesh);
    }

    if (textures['right_side'] || textures['right_sleeve']) {
      const rightPlane = new THREE.PlaneGeometry(1.8, 3);
      const rightMaterial = new THREE.MeshStandardMaterial({
        map: textures['right_side'] || textures['right_sleeve'],
        side: THREE.DoubleSide,
      });
      const rightMesh = new THREE.Mesh(rightPlane, rightMaterial);
      rightMesh.rotation.y = -Math.PI / 2;
      rightMesh.position.x = 0.9;
      mannequinGroup.add(rightMesh);
    }

    scene.add(mannequinGroup);

    // Animation loop
    const render = () => {
      requestAnimationFrame(render);

      // Apply rotation from gestures
      mannequinGroup.rotation.x = rotationRef.current.x;
      mannequinGroup.rotation.y = rotationRef.current.y;

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();
  };

  const viewWidth = Math.max(1, dimensions.width - 32);
  const viewHeight = Math.max(300, viewWidth * 1.33);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <GLView
        style={[styles.glView, { width: viewWidth, height: viewHeight }]}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glView: {
    borderRadius: 12,
  },
});
