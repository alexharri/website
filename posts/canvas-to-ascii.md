---
title: "Canvas to ASCII renderer"
---

The ASCII renderer supports both 3D and 2D scenes using a unified context-based architecture.

## 3D Scene Example

<AsciiScene height={650} fontSize={12}>
  <Scene scene="cube" autoRotate zoom={3} />
</AsciiScene>

## 2D Scene Example


<AsciiScene height={650} fontSize={100} showSamplingCircles="raw" showSamplingPoints characterWidthMultiplier={1.25} characterHeightMultiplier={1.25}>
  <Scene2D scene="breathe" />
</AsciiScene>

## 2D Scene Example

<AsciiScene height={650} fontSize={20}>
  <Scene2D scene="shade-split" />
</AsciiScene>

.

.

.

.

.

.

.

.

.

.

.

.

