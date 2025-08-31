# Ocean Portfolio Plan

## Core Concept
Interactive 3D ocean experience with:
- Player-controlled boat floating on waves
- Lighthouse as "home base" with resume access
- Five placeholder project buoys with redacted cards
- Bioluminescent trails that respond to movement
- Fog boundary limits exploration

## 1. Wave Sampling System ✅ COMPLETE
- **Purpose**: Sync floating objects (boat, buoys) with shader waves
- **Implementation**: CPU-side Gerstner wave calculation using same params as shader
- **Scope**: Sum first 7 waves for performance and accuracy
- **Output**: Height + normal vectors for object positioning/rotation
- **Features**: Modular wave-sampling.js, matches shader exactly

## 2. Boat System ✅ COMPLETE
- **Geometry**: GLB boat model with detailed mesh (hull + mast + sail)
- **Physics**: Position updates via wave sampling with surface normals
- **Controls**: WASD/arrow keys for thrust/steer, Shift for speed boost
- **Feedback**: Realistic floating with wave tilt, momentum physics
- **Limits**: Soft fog boundary with gentle push-back
- **Features**: Async GLB loading, proper scaling/rotation, lighting

## 3. Buoy System ✅ COMPLETE
- **Geometry**: Five cylindrical buoys at fixed world positions
- **Placement**: Spread across ocean in interesting cluster (NE, NW, SE, SW, far N)
- **Interaction**: Proximity detection (40 units), E key to open 3D modal
- **Cards**: Large 3D modal planes (20×15) with Problem/Timeline/Solution sections
- **States**: Idle (red), highlighted (green glow), visited (golden glow)
- **Features**: Wave floating, proximity detection, auto-close modals, content system

## 4. Lighthouse System
- **Geometry**: Tower + base + beam light
- **Position**: Center/anchor point of the ocean
- **Function**: Resume PDF link at dock, identity signage
- **Beam**: Rotates to highlight featured buoy
- **Identity**: "Joaquin Bonifacino - Lead Researcher, Bachelor in Computer Systems"

## 5. Bioluminescent Trails
- **Mechanism**: Particle system trailing behind boat
- **Colors**: Domain-coded (AI=violet, Graphics=cyan, Data=amber, Teaching=green)
- **Behavior**: Fades over time, brightness scales with speed/distance
- **Performance**: GPU-accelerated, max 200-300 particles

## 6. Camera & Controls
- **Default**: Soft follow on boat with slight height offset
- **Orbit**: Maintains Three.js OrbitControls for exploration
- **Snaps**: Cinematic transition when opening buoy cards
- **Bounds**: Respects fog limits, prevents clipping

## 7. UI & Feedback
- **HUD**: Updated with boat controls, interaction hints
- **Cards**: Diegetic floating planes (always face camera)
- **Labels**: Proximity-activated floating text
- **Accessibility**: Reduced motion toggle, keyboard-only navigation

## 8. Content Schema
- **JSON Structure**: Buoys array with title/problem/timeline/solution/tags
- **Identity**: About section for lighthouse
- **Links**: Resume PDF, LinkedIn, GitHub
- **Placeholders**: Five empty templates ready for content

## 9. Performance Considerations
- **Frustum Culling**: Hide distant objects
- **LOD**: Simplify geometries at distance
- **Update Frequency**: Wave sampling at 30fps, trails at 60fps
- **Memory**: Reuse geometries/materials, limit particle count

## 10. Accessibility & Polish
- **Reduced Motion**: Toggle for calmer waves/animations
- **Keyboard**: Full navigation without mouse
- **Screen Reader**: Alt text for interactive elements
- **Visual Hints**: Subtle glows, beam guidance

## Implementation Phases
1. ✅ Wave sampling + boat floating - **COMPLETE**
2. Buoys + interaction system
3. Lighthouse + trails
4. Camera polish + UI feedback
5. Content integration + accessibility

## Dependencies
- Three.js (already loaded)
- No additional libraries needed
- Content provided separately as JSON
