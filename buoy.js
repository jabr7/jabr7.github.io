// Buoy system module
import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.167.1/examples/jsm/loaders/GLTFLoader.js';
import { sampleWaveHeight } from './wave-sampling.js';
import * as TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@18.6.4/dist/tween.esm.js';
import { showProjectModal } from './modal.js';

// Buoy state
export let buoys = [];
const buoyPositions = [
    { x: 45, z: 30 },   // North-east (farther out)
    { x: -50, z: 25 },  // North-west (farther out)
    { x: 55, z: -40 },  // South-east (farther out)
    { x: -35, z: -45 }, // South-west (farther out)
    { x: 0, z: 65 }     // Far north (much farther)
];

const INTERACTION_DISTANCE = 40; // Much larger for easier interaction
const CINEMATIC_DURATION = 1500; // Match main.js

// Buoy GLB model cache
let buoyModel = null;
let currentHighlightedBuoy = null;

// Animation functions
function animateBuoyColor(icon, targetColor, duration = 500) {
    const currentColor = icon.material.color.clone();

    new TWEEN.Tween({ r: currentColor.r, g: currentColor.g, b: currentColor.b })
        .to({ r: (targetColor >> 16) / 255, g: ((targetColor >> 8) & 255) / 255, b: (targetColor & 255) / 255 }, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function(obj) {
            icon.material.color.setRGB(obj.r, obj.g, obj.b);
        })
        .start();
}

function animateBuoyScale(icon, targetScale, duration = 300) {
    const currentScale = icon.scale.clone();

    new TWEEN.Tween({ x: currentScale.x, y: currentScale.y, z: currentScale.z })
        .to({ x: targetScale, y: targetScale, z: targetScale }, duration)
        .easing(TWEEN.Easing.Back.Out)
        .onUpdate(function(obj) {
            icon.scale.set(obj.x, obj.y, obj.z);
        })
        .start();
}

function animateBuoyOpacity(icon, targetOpacity, duration = 300) {
    new TWEEN.Tween({ opacity: icon.material.opacity })
        .to({ opacity: targetOpacity }, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function(obj) {
            icon.material.opacity = obj.opacity;
        })
        .start();
}

function startPulseAnimation(icon) {
    // Stop any existing pulse animation
    if (icon.userData.pulseTween) {
        icon.userData.pulseTween.stop();
    }

    // Create a pulsing effect for highlighted/visited icons
    const pulse = () => {
        new TWEEN.Tween({ scale: 1.0 })
            .to({ scale: 1.1 }, 1000)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .yoyo(true)
            .repeat(Infinity)
            .onUpdate(function(obj) {
                icon.scale.setScalar(obj.scale);
            })
            .start();
    };

    icon.userData.pulseTween = pulse();
}

function stopPulseAnimation(icon) {
    if (icon.userData.pulseTween) {
        icon.userData.pulseTween.stop();
        icon.userData.pulseTween = null;
        // Reset scale
        animateBuoyScale(icon, 1.0, 300);
    }
}

function createInteractionRing(buoy) {
    const ringGeometry = new THREE.RingGeometry(3.5, 4.5, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(0, 1, 0);
    ring.rotation.x = -Math.PI / 2; // Lay flat on water surface

    // Add pulsing animation to the ring
    const pulseRing = () => {
        new TWEEN.Tween({ scale: 1.0, opacity: 0.6 })
            .to({ scale: 1.2, opacity: 0.3 }, 1500)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .yoyo(true)
            .repeat(Infinity)
            .onUpdate(function(obj) {
                ring.scale.setScalar(obj.scale);
                ring.material.opacity = obj.opacity;
            })
            .start();
    };

    ring.userData.pulseAnimation = pulseRing();
    return ring;
}

function removeInteractionRing(buoy) {
    const ring = buoy.userData.interactionRing;
    if (ring) {
        if (ring.userData.pulseAnimation) {
            ring.userData.pulseAnimation.stop();
        }
        buoy.remove(ring);
        ring.geometry.dispose();
        ring.material.dispose();
        buoy.userData.interactionRing = null;
    }
}

// Buoy content (placeholder data)
const buoyContent = [
    {
        id: 1,
        title: "Agent Memory Framework",
        problem: "Users lost context across long, multi-topic conversations with an AI agent.",
        timeline: "6-8 weeks • Lead researcher",
        solution: "Designed hierarchical memory policy (episodic + semantic + task queues). Implemented retrieval gates to curb hallucinations and drift. Added lightweight eval harness to measure helpfulness and continuity.",
        tags: ["LLM", "memory", "retrieval", "evaluation"]
    },
    {
        id: 2,
        title: "Advanced RAG Pipeline",
        problem: "High-variance answers and slow response time for knowledge queries.",
        timeline: "8-10 weeks • Full-stack + MLOps",
        solution: "Built end-to-end RAG with quality gates, synthetic data tests, and caching. Vector + graph hybrid for concept links and disambiguation. Containerized deployment for dev/prod parity and fast rollbacks.",
        tags: ["RAG", "Azure", "Docker", "ChromaDB", "Neo4j"]
    },
    {
        id: 3,
        title: "Production Assistant",
        problem: "Repetitive process tasks slowed throughput and created inconsistency.",
        timeline: "6 weeks • AI systems",
        solution: "Modular agent actions, guarded by deterministic validators. Added feedback loop for rapid prompt/strategy iteration. Observability hooks for incident triage and drift tracking.",
        tags: ["Agents", "LangGraph", "LangChain", "eval", "observability"]
    },
    {
        id: 4,
        title: "Call Center Chat Assist",
        problem: "Agents needed faster, more consistent replies for common intents.",
        timeline: "4-6 weeks • AI engineer",
        solution: "Built intent → template → grounded completion flow. Guardrails for PII and policy boundaries. Live-tuned prompts on feedback logs.",
        tags: ["Chat", "guardrails", "prompt engineering"]
    },
    {
        id: 5,
        title: "Automotive Sector Solution",
        problem: "Legacy workflow created long turnaround for data-driven tasks.",
        timeline: "4 weeks • Solutions engineer",
        solution: "Designed focused agent interface with strict schema I/O. Added offline batch mode to reduce peak load. Scoped MVP to single high-value flow; iterated weekly.",
        tags: ["Applied AI", "schema I/O", "batching"]
    }
];

// Initialize buoy system
export function initBuoys(scene, THREE) {
    buoys = [];

    // Load the GLB buoy model
    const loader = new GLTFLoader();
    loader.load('./Buoy.glb', (gltf) => {
        buoyModel = gltf.scene;

        // Clone and position the model for each buoy
        buoyPositions.forEach((pos, index) => {
            const buoyGroup = new THREE.Group();

            // Clone the loaded GLB model
            const buoyMesh = buoyModel.clone();
            buoyMesh.scale.set(5.0, 5.0, 5.0); // MAIN BUOY SIZE - Change this to resize entire buoy
            buoyMesh.position.set(0, 0, 0); // Center position
            buoyMesh.rotation.y = Math.random() * Math.PI * 2; // Random rotation for variety

            // Ensure materials are visible
            buoyMesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.needsUpdate = true;
                }
            });

            // Glow effect will be added dynamically when needed
            buoyGroup.add(buoyMesh);

            // Add simple monochromatic icon above buoy
            const iconGeometry = new THREE.SphereGeometry(0.8, 8, 8); // Simpler geometry
            const iconMaterial = new THREE.MeshBasicMaterial({
                color: 0xcccccc, // Light gray for all projects initially
                transparent: true,
                opacity: 0.9
            });
            const icon = new THREE.Mesh(iconGeometry, iconMaterial);
            icon.position.set(0, 8, 0); // Position above buoy

            // Add project title text above the icon
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 1836;  // Even larger canvas for bigger text
            canvas.height = 384;  // Even larger height for bigger text

            // Clear canvas with transparent background
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Set up text properties
            const fontSize = 120;  // Increased from 80px to 120px
            context.font = `Bold ${fontSize}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            // Measure text to create background
            const textWidth = context.measureText(buoyContent[index].title).width;
            const textHeight = fontSize * 1.2; // Approximate line height
            const padding = 60;  // Increased padding
            const bgWidth = textWidth + (padding * 2);
            const bgHeight = textHeight + (padding * 2);
            const bgX = (canvas.width - bgWidth) / 2;
            const bgY = (canvas.height - bgHeight) / 2;
            const cornerRadius = 35;  // Larger corner radius

            // Draw rounded background rectangle
            context.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Semi-transparent black background
            context.strokeStyle = '#ffffff'; // White border
            context.lineWidth = 4;

            // Draw rounded rectangle background (with fallback for older browsers)
            context.beginPath();
            if (context.roundRect) {
                // Modern browsers with roundRect support
                context.roundRect(bgX, bgY, bgWidth, bgHeight, cornerRadius);
            } else {
                // Fallback for older browsers - draw rounded rectangle manually
                context.moveTo(bgX + cornerRadius, bgY);
                context.arcTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + cornerRadius, cornerRadius);
                context.arcTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - cornerRadius, bgY + bgHeight, cornerRadius);
                context.arcTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - cornerRadius, cornerRadius);
                context.arcTo(bgX, bgY, bgX + cornerRadius, bgY, cornerRadius);
                context.closePath();
            }
            context.fill();
            context.stroke();

            // Draw the text
            context.fillStyle = '#ffffff'; // White text
            context.strokeStyle = '#000000'; // Black text outline
            context.lineWidth = 8;  // Thicker outline for larger text
            context.strokeText(buoyContent[index].title, canvas.width / 2, canvas.height / 2);
            context.fillText(buoyContent[index].title, canvas.width / 2, canvas.height / 2);

            const textTexture = new THREE.CanvasTexture(canvas);
            textTexture.generateMipmaps = false; // Prevent texture blurring
            textTexture.minFilter = THREE.LinearFilter;
            textTexture.magFilter = THREE.LinearFilter;

            const textMaterial = new THREE.SpriteMaterial({
                map: textTexture,
                transparent: true,
                opacity: 1.0  // Fully opaque for better visibility
            });
            const textSprite = new THREE.Sprite(textMaterial);
            textSprite.scale.set(18, 4.5, 1);  // Even larger scale for 120px text
            textSprite.position.set(0, 15, 0); // Position even higher above icon

            buoyGroup.add(textSprite);

            // Add bobbing animation
            const bobAnimation = new TWEEN.Tween({ y: 8, textY: 15 })
                .to({ y: 8.5, textY: 15.5 }, 2000 + Math.random() * 1000)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .yoyo(true)
                .repeat(Infinity)
                .onUpdate(function(obj) {
                    icon.position.y = obj.y;
                    textSprite.position.y = obj.textY; // Make text bob with icon
                })
                .start();

            // Add subtle rotation animation
            const rotationAnimation = new TWEEN.Tween({ rotation: 0 })
                .to({ rotation: Math.PI * 2 }, 8000 + Math.random() * 4000)
                .easing(TWEEN.Easing.Linear.None)
                .repeat(Infinity)
                .onUpdate(function(obj) {
                    icon.rotation.y = obj.rotation;
                })
                .start();

            buoyGroup.add(icon);

            buoyGroup.position.set(pos.x, 0, pos.z);
            buoyGroup.userData = {
                id: index + 1,
                originalScale: buoyMesh.scale.clone(),
                content: buoyContent[index],
                state: 'idle', // idle, highlighted, visited
                glow: null, // Will be created dynamically
                buoyMesh: buoyMesh,
                icon: icon,
                textSprite: textSprite,
                interactionRing: null, // Will be created for interaction feedback
                isGLB: true
            };

            buoys.push(buoyGroup);
            scene.add(buoyGroup);
        });
    }, (progress) => {
        console.log('Buoy loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
        console.error('Error loading buoy model:', error);
        console.log('Falling back to simple geometry buoys');
        // Fallback to simple geometry if GLB fails
        createFallbackBuoys(scene, THREE);
    });

    // If model takes too long to load, show fallback after 5 seconds
    setTimeout(() => {
        if (buoys.length === 0) {
            console.log('Buoy model loading timeout, using fallback');
            createFallbackBuoys(scene, THREE);
        }
    }, 5000);

    return buoys;
}

// Fallback buoy creation if GLB loading fails
function createFallbackBuoys(scene, THREE) {
    buoyPositions.forEach((pos, index) => {
        const buoyGroup = new THREE.Group();

        // Main buoy body (cylinder)
        const buoyGeometry = new THREE.CylinderGeometry(1, 1.2, 3, 8);
        const buoyMaterial = new THREE.MeshLambertMaterial({
            color: 0xff4444, // Red color for visibility
            transparent: true,
            opacity: 0.8
        });
        const buoyMesh = new THREE.Mesh(buoyGeometry, buoyMaterial);

        // Top marker (smaller cylinder)
        const markerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 6);
        const markerMaterial = new THREE.MeshLambertMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.9
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.y = 1.5;

        // Light on top
        const lightGeometry = new THREE.SphereGeometry(0.2, 8, 6);
        const lightMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.y = 2;

        buoyGroup.add(buoyMesh);
        buoyGroup.add(marker);
        buoyGroup.add(light);

        buoyGroup.position.set(pos.x, 0, pos.z);
        buoyGroup.userData = {
            id: index + 1,
            originalColor: buoyMaterial.color.clone(),
            content: buoyContent[index],
            state: 'idle', // idle, highlighted, visited
            glow: null,
            buoyMesh: buoyMesh,
            isGLB: false
        };

        buoys.push(buoyGroup);
        scene.add(buoyGroup);
    });
}

// Update buoy positions and interactions
export function updateBuoys(time, boatPosition, THREE, scene) {
    buoys.forEach((buoy, index) => {
        // Update buoy position based on waves
        const waveData = sampleWaveHeight(buoy.position, time);

        // Apply wave displacement (gentler than boat)
        buoy.position.y = waveData.height * 0.3; // Less wave influence than boat

        // Calculate surface normal for slight buoy rotation
        const normal = new THREE.Vector3(-waveData.dx, 1, -waveData.dz).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
        buoy.setRotationFromQuaternion(quaternion);

        // Add gentle bob animation
        const bobOffset = Math.sin(time * 0.5 + index) * 0.1;
        buoy.position.y += bobOffset;

        // Check proximity to boat for interaction
        const distance = buoy.position.distanceTo(boatPosition);
        updateBuoyState(buoy, distance, THREE);
    });
}

// Update buoy visual state based on proximity
function updateBuoyState(buoy, distance, THREE) {
    let glow = buoy.userData.glow;

    if (distance <= INTERACTION_DISTANCE) {
        // Within interaction range - ensure glow is visible
        if (!glow) {
            // Create glow sphere if it doesn't exist
            const glowGeometry = new THREE.SphereGeometry(6.0, 6, 6); // Larger glow sphere to match 5x buoy scale
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x666666,
                transparent: true
            });
            glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.set(0, 1, 0);
            buoy.add(glow);
            buoy.userData.glow = glow;
        }

        if (buoy.userData.state === 'visited') {
            // Visited buoy - show dark gray glow and icon
            glow.material.opacity = 0.2;
            glow.material.color.setHex(0x333333);
            // Animate to dark gray if not already
            if (buoy.userData.icon.material.color.getHex() !== 0x555555) {
                animateBuoyColor(buoy.userData.icon, 0x555555, 600);
                animateBuoyScale(buoy.userData.icon, 1.0, 500);
                // Update text sprite color to dark gray
                buoy.userData.textSprite.material.color.setHex(0x555555);
                // Start pulsing animation for visited buoys
                startPulseAnimation(buoy.userData.icon);
            }
        } else {
            // Highlighted state - player is close enough to interact
            if (buoy.userData.state !== 'highlighted') {
                buoy.userData.state = 'highlighted';
                glow.material.opacity = 0.15; // Subtle gray glow when close
                glow.material.color.setHex(0x666666);

                // Animate icon to medium gray with scale up
                animateBuoyColor(buoy.userData.icon, 0x888888, 400);
                animateBuoyScale(buoy.userData.icon, 1.2, 400);

                // Update text sprite color to medium gray
                buoy.userData.textSprite.material.color.setHex(0x888888);

                // Add interaction ring instead of changing opacity
                if (!buoy.userData.interactionRing) {
                    buoy.userData.interactionRing = createInteractionRing(buoy);
                    buoy.add(buoy.userData.interactionRing);
                }

                // Start pulsing animation
                startPulseAnimation(buoy.userData.icon);
            }
        }
        currentHighlightedBuoy = buoy;
    } else {
        // Outside interaction range
        if (buoy.userData.state === 'visited') {
            // Visited buoy - keep golden glow but more subtle
            if (!glow) {
                // Create glow sphere if it doesn't exist
                const glowGeometry = new THREE.SphereGeometry(6.0, 6, 6); // Larger glow sphere to match 5x buoy scale
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: 0x333333,
                    transparent: true
                });
                glow = new THREE.Mesh(glowGeometry, glowMaterial);
                glow.position.set(0, 1, 0);
                buoy.add(glow);
                buoy.userData.glow = glow;
            }
            glow.material.opacity = 0.1;
            glow.material.color.setHex(0x333333);
        } else {
            // Idle state - remove glow entirely
            if (glow) {
                buoy.remove(glow);
                glow.geometry.dispose();
                glow.material.dispose();
                buoy.userData.glow = null;
            }
            if (buoy.userData.state !== 'idle') {
                buoy.userData.state = 'idle';
                // Animate back to default light gray
                animateBuoyColor(buoy.userData.icon, 0xcccccc, 600);
                animateBuoyScale(buoy.userData.icon, 1.0, 500);

                // Reset text sprite color to light gray
                buoy.userData.textSprite.material.color.setHex(0xcccccc);

                // Remove interaction ring
                removeInteractionRing(buoy);

                // Stop pulsing animation
                stopPulseAnimation(buoy.userData.icon);
            }
        }
        if (currentHighlightedBuoy === buoy) {
            currentHighlightedBuoy = null;
        }
    }
}



// Handle interaction (called when E key is pressed)
export function interactWithBuoy(THREE, scene, startCinematicCallback, switchToFollowModeCallback) {
    if (currentHighlightedBuoy) {

        // Mark as visited
        currentHighlightedBuoy.userData.state = 'visited';
        const glow = currentHighlightedBuoy.userData.glow;
        if (glow) {
            glow.material.opacity = 0.2; // Show dark gray glow for visited
            glow.material.color.setHex(0x333333);
        }
        // Animate icon to dark gray with celebration scale
        animateBuoyColor(currentHighlightedBuoy.userData.icon, 0x555555, 500);
        animateBuoyOpacity(currentHighlightedBuoy.userData.icon, 1.0, 300);
        // Celebration scale up then back to normal
        animateBuoyScale(currentHighlightedBuoy.userData.icon, 1.5, 300);
        setTimeout(() => {
            animateBuoyScale(currentHighlightedBuoy.userData.icon, 1.0, 400);
        }, 300);

        // Trigger cinematic camera transition
        if (startCinematicCallback) {
            startCinematicCallback(currentHighlightedBuoy);
        }

        // Show HTML modal with project details (delayed to sync with cinematic)
        setTimeout(() => {
            showProjectModal(currentHighlightedBuoy.userData.content, switchToFollowModeCallback);
        }, CINEMATIC_DURATION * 0.7); // Show modal when camera is 70% through transition

        return true;
    }
    return false;
}



// Update text sprites to face camera
export function updateTextSprites(camera) {
    buoys.forEach(buoy => {
        if (buoy.userData.textSprite) {
            buoy.userData.textSprite.lookAt(camera.position);
        }
    });
}

// Get current highlighted buoy for UI feedback
export function getCurrentHighlightedBuoy() {
    return currentHighlightedBuoy;
}

// Get all buoys for external access
export function getBuoys() {
    return buoys;
}

// Modal functions are already exported above
