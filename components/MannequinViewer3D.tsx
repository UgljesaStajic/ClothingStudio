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

    // Create mannequin geometry using planes in 3D space
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
              tex.minFilter = THREE.LinearFilter;
              tex.magFilter = THREE.LinearFilter;
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

    // Create a realistic mannequin shape using multiple connected planes
    // The AI-generated images already show the invisible mannequin effect
    // We arrange them in 3D space to create a volumetric appearance

    const planeWidth = 1.5;
    const planeHeight = 4;

    // Front face
    if (textures['front']) {
      const frontGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const frontMaterial = new THREE.MeshStandardMaterial({
        map: textures['front'],
        transparent: true,
        side: THREE.FrontSide,
      });
      const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
      frontMesh.position.z = 0.4;
      mannequinGroup.add(frontMesh);
    }

    // Back face
    if (textures['back']) {
      const backGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const backMaterial = new THREE.MeshStandardMaterial({
        map: textures['back'],
        transparent: true,
        side: THREE.FrontSide,
      });
      const backMesh = new THREE.Mesh(backGeometry, backMaterial);
      backMesh.position.z = -0.4;
      backMesh.rotation.y = Math.PI;
      mannequinGroup.add(backMesh);
    }

    // Left side
    if (textures['left_side'] || textures['left_sleeve']) {
      const leftGeometry = new THREE.PlaneGeometry(0.8, planeHeight);
      const leftMaterial = new THREE.MeshStandardMaterial({
        map: textures['left_side'] || textures['left_sleeve'],
        transparent: true,
        side: THREE.DoubleSide,
      });
      const leftMesh = new THREE.Mesh(leftGeometry, leftMaterial);
      leftMesh.position.x = -0.75;
      leftMesh.rotation.y = Math.PI / 2;
      mannequinGroup.add(leftMesh);
    }

    // Right side
    if (textures['right_side'] || textures['right_sleeve']) {
      const rightGeometry = new THREE.PlaneGeometry(0.8, planeHeight);
      const rightMaterial = new THREE.MeshStandardMaterial({
        map: textures['right_side'] || textures['right_sleeve'],
        transparent: true,
        side: THREE.DoubleSide,
      });
      const rightMesh = new THREE.Mesh(rightGeometry, rightMaterial);
      rightMesh.position.x = 0.75;
      rightMesh.rotation.y = -Math.PI / 2;
      mannequinGroup.add(rightMesh);
    }

    // If only front image is available, create a card-like display
    if (images.length === 1 && textures['front']) {
      mannequinGroup.clear();
      const singleGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const singleMaterial = new THREE.MeshStandardMaterial({
        map: textures['front'],
        transparent: true,
        side: THREE.DoubleSide,
      });
      const singleMesh = new THREE.Mesh(singleGeometry, singleMaterial);
      mannequinGroup.add(singleMesh);
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
