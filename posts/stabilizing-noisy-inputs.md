---
title: "Stabilizing noisy input devices"
description: ""
image: ""
publishedAt: ""
---

Following is an interactive grid component where the light-blue squircle snaps to the closest positions in the grid.

The white dot represents the input position—try dragging it around.

<NoNoise />

On precise input devices, such as PCs and smartphones, we don't really get any observable noise.

Other input devices, like VR controllers, suffer from jitter and noise.

Even if VR controller technology were perfect, human hands introduce noise. Just try holding your hand in front of you and keeping it as still as you can. Even with great motor control, there will still be some amount of noise.

To simulate noisy input devices, we'll introduce a noise component to the input:

<NoiseComponent />

Notice what happens in our grid component with noise applied to our input. Especially at the boundaries between positions.

<SomeNoise />