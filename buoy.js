// Buoy system module
import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.167.1/examples/jsm/loaders/GLTFLoader.js';
import { sampleWaveHeight } from './wave-sampling.js';
import * as TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@18.6.4/dist/tween.esm.js';

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
                opacity: 0.8
            });
            const icon = new THREE.Mesh(iconGeometry, iconMaterial);
            icon.position.set(0, 8, 0); // Position above buoy

            // Add bobbing animation
            const bobAnimation = new TWEEN.Tween({ y: 8 })
                .to({ y: 8.5 }, 2000 + Math.random() * 1000)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .yoyo(true)
                .repeat(Infinity)
                .onUpdate(function(obj) {
                    icon.position.y = obj.y;
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
                animateBuoyOpacity(buoy.userData.icon, 1.0, 400);
                animateBuoyScale(buoy.userData.icon, 1.0, 500);
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
                animateBuoyOpacity(buoy.userData.icon, 1.0, 300);
                animateBuoyScale(buoy.userData.icon, 1.2, 400);
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
                animateBuoyOpacity(buoy.userData.icon, 0.8, 400);
                animateBuoyScale(buoy.userData.icon, 1.0, 500);
                // Stop pulsing animation
                stopPulseAnimation(buoy.userData.icon);
            }
        }
        if (currentHighlightedBuoy === buoy) {
            currentHighlightedBuoy = null;
        }
    }
}

// Beautiful modal using SweetAlert2
function showProjectModal(content) {
    Swal.fire({
        title: content.title,
        html: `
            <div style="text-align: left; color: #ddd; font-size: 1.1em; line-height: 1.6;">
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #888; margin-bottom: 10px; font-size: 1.2em; text-transform: uppercase; letter-spacing: 1px;">PROBLEM</h3>
                    <p style="margin: 0; color: #ccc;">${content.problem}</p>
                </div>

                <div style="margin-bottom: 25px;">
                    <h3 style="color: #888; margin-bottom: 10px; font-size: 1.2em; text-transform: uppercase; letter-spacing: 1px;">TIMELINE</h3>
                    <p style="margin: 0; color: #fff; font-weight: bold; font-size: 1.1em;">${content.timeline}</p>
                </div>

                <div style="margin-bottom: 25px;">
                    <h3 style="color: #888; margin-bottom: 10px; font-size: 1.2em; text-transform: uppercase; letter-spacing: 1px;">SOLUTION</h3>
                    <p style="margin: 0; color: #ccc;">${content.solution}</p>
                </div>

                <div>
                    <h3 style="color: #888; margin-bottom: 10px; font-size: 1.2em; text-transform: uppercase; letter-spacing: 1px;">TECHNOLOGIES</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${content.tags.map(tag => `<span style="background: #333; color: #888; padding: 4px 10px; border-radius: 15px; font-size: 0.85em; border: 1px solid #555;">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `,
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#666',
        confirmButtonText: 'Close',
        width: '700px',
        padding: '30px',
        backdrop: 'rgba(0, 0, 0, 0.8)',
        showClass: {
            popup: 'animate__animated animate__fadeInUp animate__faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutDown animate__faster'
        },
        customClass: {
            popup: 'project-modal',
            title: 'modal-title',
            confirmButton: 'modal-close-btn'
        }
    });
}

// Handle interaction (called when E key is pressed)
export function interactWithBuoy(THREE, scene) {
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

        // Show HTML modal with project details
        showProjectModal(currentHighlightedBuoy.userData.content);

        return true;
    }
    return false;
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
