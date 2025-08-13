---
title: "Canvas to ASCII renderer"
---

The ASCII renderer supports both 3D and 2D scenes using a unified context-based architecture.

## 3D Scene Example

<AsciiScene height={650} fontSize={12}>
  <Scene scene="cube" autoRotate zoom={3} />
</AsciiScene>

## 2D Scene Example

<AsciiScene height={400} fontSize={8}>
  <Scene2D scene="bouncing-ball" />
</AsciiScene>

## Architecture

The `AsciiScene` component now uses a children-based composition pattern with `CanvasContext`:

- **AsciiScene**: Provides canvas context and ASCII rendering
- **Scene**: 3D scenes using Three.js
- **Scene2D**: 2D scenes using Canvas 2D API

Both scene types share the same canvas context and frame callback system, allowing seamless integration of different rendering approaches.

## Visualization of Vector Sampling

