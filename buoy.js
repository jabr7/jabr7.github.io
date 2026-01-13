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
        title: "Enterprise Automotive Operations Orchestrator",
        country: "Spain",
        problem: "A leading automotive service network faced significant operational friction due to decentralized management of service centers, fragmented inventory tracking, and complex workforce scheduling across multiple European regions.",
        timeline: "2025 - 4 months • Full-stack Engineer (Team of 6)",
        solution: "Co-engineered a comprehensive enterprise resource planning (ERP) system tailored for the automotive sector. Developed a high-concurrency .NET backend utilizing Clean Architecture and Domain-Driven Design (DDD) to synchronize multi-center inventory, automate order processing, and manage complex tire and service margins. Built a feature-rich Angular 16 frontend with NgRx for robust state management, implementing a sophisticated resource-timeline calendar system for real-time staff and maintenance scheduling. The platform integrated Azure AD for enterprise security, Chart.js for operational analytics, and automated reporting engines, centralizing the management of thousands of vehicle life cycles and service orders.",
        tags: [".NET", "Angular", "NgRx", "SQL Server", "Resource Scheduling", "Clean Architecture", "Azure AD"]
    },
    {
        id: 2,
        title: "AI-Powered Operations Manual Synthesizer",
        country: "Uruguay",
        problem: "A major international financial institution required up to 6 months and over $15,000 in expert labor to manually synthesize a single Operations Manual (MOP). The process involved cross-referencing thousands of pages of technical specifications, legal frameworks, and complex financial matrices, creating a massive bottleneck for project deployment.",
        timeline: "2024 - 2 months • Lead Full-stack AI Engineer",
        solution: "Architected a production-ready RAG pipeline that automates the end-to-end synthesis of technical documentation. Integrated Azure Document Intelligence for high-fidelity extraction of unstructured data and tables, coupled with Azure AI Search for semantic context retrieval. Engineered a sophisticated orchestration layer using GPT-4o to generate compliant document sections—including hierarchical objectives, result matrices, and multi-year financial disbursement schedules—with strict JSON-schema validation and automated DOCX assembly. The system reduced document generation time from 6 months to just 4 minutes, with operational costs dropping from thousands of dollars to cents per execution.",
        tags: ["GPT-4o", "Azure AI Search", "Document Intelligence", "RAG", "FastAPI", "Automated Synthesis", "DOCX Automation"]
    },
    {
        id: 3,
        title: "Legal Research AI Orchestrator",
        country: "Ecuador",
        problem: "Navigating vast, unstructured legal knowledge bases in Ecuador required high precision and context-aware retrieval to avoid hallucinations in sensitive legal advice.",
        timeline: "2024 - 6 months • Sole Full-stack AI Engineer",
        solution: "End-to-end delivery of a multi-node LangGraph orchestration system for Ecuadorian law, handling everything from client requirements and UI/UX design to backend architecture and DevOps. Implemented a dual-model strategy using Azure OpenAI (GPT-4o & SLMs) for real-time query refinement, topic classification, and automated filter inference. Engineered a robust RAG pipeline with multi-stage relevance validation and vector search, integrated with Langfuse for full-trace observability and a custom citation engine for verifiable legal references.",
        tags: ["LangGraph", "Azure OpenAI", "RAG", "Legal AI", "Langfuse", "SLM", "Ecuadorian Law"]
    },
    {
        id: 4,
        title: "Multi-Agent Financial Companion",
        country: "USA",
        problem: "Traditional financial management is often fragmented, reactive, and emotionally taxing. Users struggle to maintain context across long-term goals, while tools remain disconnected from the nuanced emotional relationship people have with their money.",
        timeline: "2025 - 2026 - 6 months• Lead Architect (Team of 10)",
        solution: "Engineered a sophisticated multi-agentic system (MAS) powered by LangGraph. The system employs a multi-model strategy: Cerebras for ultra-low latency intent classification and AWS Bedrock for specialized agent execution. A Supervisor-led orchestration with strict state isolation delegates to specialized agents for Finance (SQL-driven analysis), Capture (structured entries), Wealth (KB-backed education), and Goals. A three-tier memory architecture (Episodic, Semantic, Procedural) ensures the companion learns and evolves with the user while maintaining high-performance retrieval via a Hot/Cold path separation.",
        tags: ["LangGraph", "Multi-Agent Systems", "AWS Bedrock", "Cerebras", "SQL Generation", "Vector RAG"]
    },
    {
        id: 5,
        title: "Automotive Sector Conversational AI Platform",
        country: "Spain",
        problem: "Legacy customer service workflows created long turnaround times for vehicle-related queries. Users needed to navigate multiple disconnected systems to access vehicle information, service history, and scheduling, leading to fragmented experiences and increased support overhead. Knowledge base updates required manual processes, and proactive notifications for vehicle maintenance were non-existent.",
        timeline: "3 months • Sole Full-stack Engineer",
        solution: "Built and shipped two coordinated production systems. (1) An agentic customer-facing assistant implemented as a LangGraph state machine, integrating directly with existing workshop APIs to let fleet customers query vehicles, service history, invoices, and upcoming scheduling without navigating large operational datasets. The agent streams responses/events for UI feedback, maintains session-level memory, supports multilingual interactions, and can retrieve internal knowledge from a Confluence-backed vector store. (2) A separate notification/sync service: a Celery + RabbitMQ rule engine that evaluates maintenance, ITV, washing and daily summary rules against large CosmosDB-backed historical data (plus external signals like weather), then dispatches notifications across channels (in-app/chat surfaces and WhatsApp via Twilio).",
        tags: ["Agentic Systems", "LangGraph", "Azure OpenAI", "FastAPI", "CosmosDB", "Celery", "RabbitMQ", "Twilio", "Vector Search"]
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
            const title = buoyContent[index].title;
            const fontSize = 120;
            const padding = 60;
            const borderWidth = 4;
            const outlineWidth = 8;
            const cornerRadius = 35;

            const measureCanvas = document.createElement('canvas');
            const measureContext = measureCanvas.getContext('2d');
            measureContext.font = `Bold ${fontSize}px Arial`;

            const metrics = measureContext.measureText(title);
            const measuredTextWidth = metrics.width;
            const measuredTextHeight =
                Number.isFinite(metrics.actualBoundingBoxAscent) && Number.isFinite(metrics.actualBoundingBoxDescent)
                    ? metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
                    : fontSize * 1.2;

            const bgWidth = Math.ceil(measuredTextWidth + (padding * 2) + (outlineWidth * 2));
            const bgHeight = Math.ceil(measuredTextHeight + (padding * 2) + (outlineWidth * 2));

            const maxCanvasWidth = 4096;
            const maxCanvasHeight = 2048;
            const devicePixelRatio = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
            let dpr = Math.min(devicePixelRatio, 2);
            dpr = Math.min(dpr, maxCanvasWidth / bgWidth, maxCanvasHeight / bgHeight);
            dpr = Math.max(dpr, 0.5);

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = Math.ceil(bgWidth * dpr);
            canvas.height = Math.ceil(bgHeight * dpr);

            context.scale(dpr, dpr);
            context.clearRect(0, 0, bgWidth, bgHeight);

            context.font = `Bold ${fontSize}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            // Draw rounded background rectangle
            context.fillStyle = 'rgba(0, 0, 0, 0.8)';
            context.strokeStyle = '#ffffff';
            context.lineWidth = borderWidth;

            context.beginPath();
            if (context.roundRect) {
                context.roundRect(0, 0, bgWidth, bgHeight, cornerRadius);
            } else {
                context.moveTo(cornerRadius, 0);
                context.arcTo(bgWidth, 0, bgWidth, cornerRadius, cornerRadius);
                context.arcTo(bgWidth, bgHeight, bgWidth - cornerRadius, bgHeight, cornerRadius);
                context.arcTo(0, bgHeight, 0, bgHeight - cornerRadius, cornerRadius);
                context.arcTo(0, 0, cornerRadius, 0, cornerRadius);
                context.closePath();
            }
            context.fill();
            context.stroke();

            // Draw the text
            context.fillStyle = '#ffffff';
            context.strokeStyle = '#000000';
            context.lineWidth = outlineWidth;
            context.strokeText(title, bgWidth / 2, bgHeight / 2);
            context.fillText(title, bgWidth / 2, bgHeight / 2);

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
            const pixelsPerWorldUnitX = 1836 / 18;
            const pixelsPerWorldUnitY = 384 / 4.5;
            textSprite.scale.set(bgWidth / pixelsPerWorldUnitX, bgHeight / pixelsPerWorldUnitY, 1);
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
