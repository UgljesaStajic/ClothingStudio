import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Dimensions, Text, ActivityIndicator } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer, THREE } from 'expo-three';
import * as FileSystem from 'expo-file-system';
import type { GeneratedImage } from '@/types';

interface MannequinViewer3DProps {
  images: GeneratedImage[];
}

export function MannequinViewer3D({ images }: MannequinViewer3DProps) {
  const [dimensions, setDimensions] = useState({ width: 375, height: 500 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const sceneRef = useRef<any>(null);
  const mannequinGroupRef = useRef<any>(null);

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
    try {
      console.log('Initializing 3D viewer with', images.length, 'images');
      
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
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
      directionalLight2.position.set(-5, -5, -5);
      scene.add(directionalLight2);

      // Create mannequin geometry using planes in 3D space
      const mannequinGroup = new THREE.Group();
      mannequinGroupRef.current = mannequinGroup;

      // Load textures from generated images
      const textureLoader = new THREE.TextureLoader();
      const textures: { [key: string]: THREE.Texture } = {};

      console.log('Loading textures...');
      for (const image of images) {
        try {
          console.log(`Loading texture for ${image.angle} from ${image.image_url}`);
          
          const fileUri = FileSystem.cacheDirectory + `texture_${image.angle}_${Date.now()}.jpg`;
          const downloadResult = await FileSystem.downloadAsync(image.image_url, fileUri);
          
          console.log(`Downloaded ${image.angle} to ${downloadResult.uri}`);
          
          const texture = await new Promise<THREE.Texture>((resolve, reject) => {
            textureLoader.load(
              downloadResult.uri,
              (tex) => {
                console.log(`Texture loaded for ${image.angle}`);
                tex.wrapS = THREE.ClampToEdgeWrapping;
                tex.wrapT = THREE.ClampToEdgeWrapping;
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                resolve(tex);
              },
              undefined,
              (err) => {
                console.error(`Texture load error for ${image.angle}:`, err);
                reject(err);
              }
            );
          });
          
          textures[image.angle] = texture;
        } catch (error) {
          console.error(`Failed to load texture for ${image.angle}:`, error);
        }
      }

      const textureCount = Object.keys(textures).length;
      console.log(`Loaded ${textureCount} textures`);

      if (textureCount === 0) {
        setError('Failed to load any images');
        setLoading(false);
        return;
      }

      // Create a realistic mannequin shape using multiple connected planes
      const planeWidth = 2;
      const planeHeight = 3;

      // Front face
      if (textures['front']) {
        console.log('Creating front mesh');
        const frontGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const frontMaterial = new THREE.MeshStandardMaterial({
          map: textures['front'],
          side: THREE.DoubleSide,
        });
        const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
        frontMesh.position.z = 0.3;
        mannequinGroup.add(frontMesh);
      }

      // Back face
      if (textures['back']) {
        console.log('Creating back mesh');
        const backGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const backMaterial = new THREE.MeshStandardMaterial({
          map: textures['back'],
          side: THREE.DoubleSide,
        });
        const backMesh = new THREE.Mesh(backGeometry, backMaterial);
        backMesh.position.z = -0.3;
        backMesh.rotation.y = Math.PI;
        mannequinGroup.add(backMesh);
      }

      // Left side
      if (textures['left_side'] || textures['left_sleeve']) {
        console.log('Creating left mesh');
        const leftGeometry = new THREE.PlaneGeometry(0.6, planeHeight);
        const leftMaterial = new THREE.MeshStandardMaterial({
          map: textures['left_side'] || textures['left_sleeve'],
          side: THREE.DoubleSide,
        });
        const leftMesh = new THREE.Mesh(leftGeometry, leftMaterial);
        leftMesh.position.x = -1;
        leftMesh.rotation.y = Math.PI / 2;
        mannequinGroup.add(leftMesh);
      }

      // Right side
      if (textures['right_side'] || textures['right_sleeve']) {
        console.log('Creating right mesh');
        const rightGeometry = new THREE.PlaneGeometry(0.6, planeHeight);
        const rightMaterial = new THREE.MeshStandardMaterial({
          map: textures['right_side'] || textures['right_sleeve'],
          side: THREE.DoubleSide,
        });
        const rightMesh = new THREE.Mesh(rightGeometry, rightMaterial);
        rightMesh.position.x = 1;
        rightMesh.rotation.y = -Math.PI / 2;
        mannequinGroup.add(rightMesh);
      }

      // If only one image, show it as a single plane
      if (textureCount === 1) {
        console.log('Single image mode');
        mannequinGroup.clear();
        const firstTexture = Object.values(textures)[0];
        const singleGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const singleMaterial = new THREE.MeshStandardMaterial({
          map: firstTexture,
          side: THREE.DoubleSide,
        });
        const singleMesh = new THREE.Mesh(singleGeometry, singleMaterial);
        mannequinGroup.add(singleMesh);
      }

      scene.add(mannequinGroup);
      console.log('Scene setup complete, starting render loop');
      setLoading(false);

      // Animation loop
      const render = () => {
        requestAnimationFrame(render);

        if (mannequinGroupRef.current) {
          mannequinGroupRef.current.rotation.x = rotationRef.current.x;
          mannequinGroupRef.current.rotation.y = rotationRef.current.y;
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      render();
    } catch (error) {
      console.error('3D viewer initialization error:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize 3D viewer');
      setLoading(false);
    }
  };

  const viewWidth = Math.max(1, dimensions.width - 32);
  const viewHeight = Math.max(300, viewWidth * 1.33);

  if (error) {
    return (
      <View style={[styles.container, { height: viewHeight }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {loading && (
        <View style={[styles.loadingContainer, { width: viewWidth, height: viewHeight }]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading 3D model...</Text>
        </View>
      )}
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
  loadingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
    textAlign: 'center',
    padding: 20,
  },
});
