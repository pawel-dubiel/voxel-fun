# Apache Voxel Engine

A retro-style, high-performance voxel flight simulator built with Three.js. Pilot an Apache helicopter through a procedurally generated world, engage enemy aircraft, and rain destruction upon ancient Roman cohorts and medieval fortresses.

## Features

- **Retro Aesthetic:** Pixelated 320x240 rendering scaled for a classic DOS-era look.
- **Dynamic Terrain:** Fully destructible voxel world with mountain and building generation.
- **Matter Conservation:** Destructive explosions create craters and spawn persistent debris that settles back onto the terrain.
- **Arcade Flight Mechanics:** Snappy helicopter controls with auto-stabilization and altitude hold.
- **Ancient Rome Setting:** Encounter organized Roman cohorts (1,000+ individual units) that march in formation and panic under fire.
- **Medieval Landmarks:** Procedural stone castles with towers and battlements.

## Controls

| Key | Action |
|-----|--------|
| **W / S** | Pitch Forward / Back (Accelerate) |
| **A / D** | Yaw (Turn) Left / Right |
| **Q / E** | Roll (Bank) Left / Right |
| **Space** | Increase Altitude (Lift) |
| **Shift** | Decrease Altitude |
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
