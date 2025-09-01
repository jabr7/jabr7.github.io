// Water spray trail system - uses position-based particle displacement
import * as THREE from 'three';

// Spray system configuration
const TRAIL_DISTANCE = 6; // How far behind boat to create spray
const SPRAY_HEIGHT = 5.0; // Particle displacement height
const SPRAY_RADIUS = 15; // V-shaped wake pattern radius
const FADE_DURATION = 20.0; // Trail persistence duration (seconds)
const FADE_MULTIPLIER = Math.pow(0.01 / SPRAY_HEIGHT, 1 / (60 * FADE_DURATION)); // Smooth fade calculation
const MAX_TRAIL_SEGMENTS = 50; // Maximum trail segments for performance
const TRAIL_UPDATE_INTERVAL = 200; // Update frequency (milliseconds)

// Ocean system reference
let oceanDots;

// Trail state - maintain multiple active segments
let trailSegments = [];
let lastTrailTime = 0;

export function initTrails(oceanDotsRef) {
    oceanDots = oceanDotsRef;

    // Initialize multiple spray uniforms in the ocean material for trail segments
    if (oceanDots.material.uniforms) {
        // Arrays to hold multiple trail segment uniforms
        oceanDots.material.uniforms.displacementPositions = { value: [] };
        oceanDots.material.uniforms.displacementHeights = { value: [] };
        oceanDots.material.uniforms.displacementRadii = { value: [] };
        oceanDots.material.uniforms.displacementDirections = { value: [] };

        // Initialize arrays with default values
        for (let i = 0; i < MAX_TRAIL_SEGMENTS; i++) {
            oceanDots.material.uniforms.displacementPositions.value.push(new THREE.Vector3(0, 0, 0));
            oceanDots.material.uniforms.displacementHeights.value.push(0.0);
            oceanDots.material.uniforms.displacementRadii.value.push(SPRAY_RADIUS);
            oceanDots.material.uniforms.displacementDirections.value.push(new THREE.Vector3(0, 0, -1));
        }
    }

    // Initialize trail segments array
    trailSegments = [];
}

export function updateTrails(deltaTime, boatPosition, boatVelocity, boatDirection, keys) {
    if (!oceanDots) return;

    const currentTime = performance.now();
    const boatSpeed = boatVelocity.length();

    // Create continuous trail effect behind boat
    if (boatSpeed > 0.05) {
        // Add new trail segment every few frames for smooth trail
        if (currentTime - lastTrailTime > TRAIL_UPDATE_INTERVAL) {
            const behindBoat = boatDirection.clone().multiplyScalar(-TRAIL_DISTANCE);
            const trailPosition = boatPosition.clone().add(behindBoat);

            // Add some variation but less random for smoother trail
            trailPosition.x += (Math.random() - 0.5) * 2;
            trailPosition.z += (Math.random() - 0.5) * 3;

            // Create new trail segment
            const newSegment = {
                position: trailPosition.clone(),
                direction: boatDirection.clone(),
                timestamp: currentTime,
                height: SPRAY_HEIGHT,
                isTurbo: keys.boost || false, // Track if this segment was created during turbo mode
                id: Date.now() // Unique ID for tracking
            };

            trailSegments.push(newSegment);

            // Keep only recent trail segments
            if (trailSegments.length > MAX_TRAIL_SEGMENTS) {
                trailSegments.shift();
            }

            lastTrailTime = currentTime;
        }
    }

    // Update all active trail segments and their shader uniforms
    if (oceanDots.material.uniforms) {
        const shader = oceanDots.material;

        // Update each trail segment
        for (let i = 0; i < MAX_TRAIL_SEGMENTS; i++) {
            if (i < trailSegments.length) {
                const segment = trailSegments[i];
                const age = (currentTime - segment.timestamp) / 1000; // Age in seconds

                // Turbo segments have different parameters and longer fade
                const effectiveFadeDuration = segment.isTurbo ? FADE_DURATION * 1.5 : FADE_DURATION;
                const effectiveHeight = segment.isTurbo ? SPRAY_HEIGHT * 1.8 : SPRAY_HEIGHT;
                const effectiveRadius = segment.isTurbo ? SPRAY_RADIUS * 1.3 : SPRAY_RADIUS;

                if (age < effectiveFadeDuration) {
                    // Fade the segment over time (slower for turbo)
                    const fadeProgress = age / effectiveFadeDuration;
                    const fadeMultiplier = Math.pow(0.01 / effectiveHeight, 1 / (60 * effectiveFadeDuration));
                    const currentHeight = effectiveHeight * Math.pow(fadeMultiplier, age * 60); // 60 FPS equivalent

                    // Update shader uniforms for this segment
                    shader.uniforms.displacementPositions.value[i].copy(segment.position);
                    shader.uniforms.displacementHeights.value[i] = Math.max(currentHeight, 0.01);
                    shader.uniforms.displacementRadii.value[i] = effectiveRadius;
                    shader.uniforms.displacementDirections.value[i].copy(segment.direction);
                } else {
                    // Segment has faded completely, remove it
                    trailSegments.splice(i, 1);
                    i--; // Adjust index since we removed an element
                }
            } else {
                // No segment for this index, set to inactive
                shader.uniforms.displacementHeights.value[i] = 0.0;
            }
        }

        // Mark uniforms as needing update
        shader.uniforms.displacementPositions.needsUpdate = true;
        shader.uniforms.displacementHeights.needsUpdate = true;
        shader.uniforms.displacementRadii.needsUpdate = true;
        shader.uniforms.displacementDirections.needsUpdate = true;
    }

    // Clean up very old segments (safety check)
    trailSegments = trailSegments.filter(segment => {
        const age = (currentTime - segment.timestamp) / 1000;
        const effectiveFadeDuration = segment.isTurbo ? FADE_DURATION * 1.5 : FADE_DURATION;
        return age < effectiveFadeDuration + 1; // Keep for 1 extra second as buffer
    });
}

// Cleanup functions removed - using simplified uniform-based approach
