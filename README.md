# Voxel Engine Demo

A retro-style, high-performance voxel arcade shooter built with Three.js. Pilot an airplane through a procedurally generated world, engage enemy aircraft, and rain destruction upon soldiers and buildings.


![Gameplay](gameplay1.gif)

## Features

- Pixelated 320x240 rendering scaled for a classic DOS-era look.
- Fully destructible voxel world with mountain and building generation.
- Destructive explosions create craters and spawn persistent debris that settles back onto the terrain.
- Encounter organized Roman cohorts (1,000+ individual units) that march in formation and panic under fire.
- Procedural stone buildings with towers and battlements.

## Controls

| Key | Action |
|-----|--------|
| **W** | Pitch Down |
| **S** | Pitch Up |
| **A** | Roll Left |
| **D** | Roll Right |
| **Q** | Yaw Left |
| **E** | Yaw Right |
| **Space** | Increase Altitude |
| **C** | Decrease Altitude |
| **Shift** | Increase Throttle |
| **Ctrl** | Decrease Throttle |
| **Click** | Fire Missile |

## Tech Stack

- **Three.js:** 3D Rendering and Instance Management.
- **Vite:** Build tool and Dev server.
- **Simplex-Noise:** Procedural terrain generation.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Credits

Inspired by classic voxel engines
