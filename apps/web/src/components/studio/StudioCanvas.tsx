'use client';

import { Component, useEffect, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { WebGLRenderer, type PerspectiveCamera as ThreePerspectiveCamera } from 'three';
import { createStudioScene } from './scene/createStudioScene';
import type { StudioCallbacks, StudioSceneAPI } from './scene/types';

const studioCameraName = 'Corner Studio camera';

export interface StudioCanvasProps {
  sceneElement: HTMLElement | null;
  callbacks: StudioCallbacks;
  onReady: (api: StudioSceneAPI | null) => void;
  onError?: (error: Error) => void;
}

function StudioModel({ sceneElement, callbacks, onReady, onError }: StudioCanvasProps) {
  const { gl, scene, camera, invalidate } = useThree();
  const model = useRef<StudioSceneAPI | null>(null);

  useEffect(() => {
    // Drei replaces Fiber's temporary camera after mounting. Initialize only
    // against the final camera so restoring a shared URL cannot be discarded.
    if (
      !sceneElement ||
      camera.name !== studioCameraName ||
      !(camera as ThreePerspectiveCamera).isPerspectiveCamera
    )
      return;
    let current: StudioSceneAPI | null = null;
    const contextLost = (event: Event) => {
      event.preventDefault();
      onError?.(new Error('The studio’s graphics context became unavailable.'));
    };
    gl.domElement.addEventListener('webglcontextlost', contextLost);
    try {
      current = createStudioScene(sceneElement, callbacks, {
        renderer: gl,
        scene,
        camera: camera as ThreePerspectiveCamera,
        invalidate,
      });
      model.current = current;
      onReady(current);
    } catch (cause) {
      onError?.(cause instanceof Error ? cause : new Error(String(cause)));
    }
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', contextLost);
      model.current = null;
      current?.dispose();
      onReady(null);
    };
  }, [sceneElement, callbacks, onReady, onError, gl, scene, camera, invalidate]);

  useFrame(() => model.current?.tick(performance.now()));
  return null;
}

class CanvasBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Native HTML overlays remain siblings of the WebGL canvas for usable controls. */
export default function StudioCanvas(props: StudioCanvasProps) {
  return (
    <CanvasBoundary onError={props.onError}>
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        shadows="soft"
        gl={(defaults) => {
          try {
            return new WebGLRenderer({
              ...defaults,
              alpha: true,
              antialias: true,
              powerPreference: 'low-power',
            });
          } catch (cause) {
            const error = cause instanceof Error ? cause : new Error(String(cause));
            queueMicrotask(() => props.onError?.(error));
            throw error;
          }
        }}
        camera={{ fov: 32, near: 0.1, far: 100, position: [10.5, 8.4, 12] }}
        style={{ width: '100%', height: '100%', touchAction: 'pan-y', outline: 'none' }}
        fallback={
          <p className="kd-scene-fallback">
            Explore Kristian’s work, background, and interests using the navigation above.
          </p>
        }
      >
        <PerspectiveCamera
          name={studioCameraName}
          makeDefault
          fov={32}
          near={0.1}
          far={100}
          position={[10.5, 8.4, 12]}
        />
        <StudioModel {...props} />
      </Canvas>
    </CanvasBoundary>
  );
}
