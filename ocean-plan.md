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

## 3. ✅ Buoy System - **COMPLETE**
- **Geometry**: Five GLB buoys at fixed world positions
- **Placement**: Spread across ocean in interesting cluster (NE, NW, SE, SW, far N)
- **Interaction**: Proximity detection (40 units), E key to open modal
- **Cards**: HTML modal with Problem/Timeline/Solution sections
- **States**: Idle (red), highlighted (green glow), visited (golden glow)
- **Features**: Wave floating, proximity detection, modal system, massive 120px text with rounded backgrounds
- **Mobile**: Touch-optimized controls and modals

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

## 6. ✅ Camera & Controls - **COMPLETE**
- **Default**: Soft follow on boat with slight height offset
- **Orbit**: Full Three.js OrbitControls for exploration
- **Cinematic**: Smooth transitions when opening buoy cards
- **Mobile**: Touch controls with D-pad, action buttons, haptic feedback
- **Bounds**: Respects fog limits with bounce-back, prevents clipping
- **Features**: Camera lag, smooth interpolation, mode switching

## 7. ✅ UI & Feedback - **MOSTLY COMPLETE**
- **HUD**: Complete with boat controls, interaction hints, info button
- **Cards**: HTML modals with project details (Problem/Timeline/Solution)
- **Labels**: Massive 120px buoy text with rounded backgrounds
- **Mobile**: Responsive design, touch controls, landscape enforcement
- **Accessibility**: Keyboard navigation, screen reader support
- **Controls Guide**: Auto-show on first visit, manual access via info button

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
2. ✅ Buoys + interaction system - **COMPLETE**
3. Lighthouse + trails - **PENDING**
4. ✅ Camera polish + UI feedback - **COMPLETE**
5. Content integration + accessibility - **MOSTLY COMPLETE**

## Dependencies
- Three.js (already loaded)
- No additional libraries needed
- Content provided separately as JSON
