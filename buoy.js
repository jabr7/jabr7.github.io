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
        country: "Spain",
        problem: "Users lost context across long, multi-topic conversations, leading to repetitive interactions and fragmented user experiences in agentic workflows.",
        timeline: "6-8 weeks • Lead researcher",
        solution: "Engineered a hierarchical memory architecture consisting of Episodic, Semantic, and Procedural tiers. Developed a background 'Memory Consolidation' service that extracts persistent user preferences and facts (Semantic) while maintaining short-term interaction logs (Episodic). Implemented a hot/cold storage strategy using Redis for low-latency retrieval and ChromaDB for long-term vector consolidation, reducing context-window overhead by 40% and significantly curbing hallucination rates in long-running sessions.",
        tags: ["LLM", "Memory Systems", "Redis", "VectorDB", "State Management"]
    },
    {
        id: 2,
        title: "Advanced RAG Pipeline",
        country: "Spain",
        problem: "Low precision and high latency in retrieval-augmented generation when querying large, unstructured internal knowledge bases.",
        timeline: "8-10 weeks • Full-stack + MLOps",
        solution: "Built a sophisticated multi-stage RAG pipeline featuring hybrid search (BM25 keyword matching + Vector embeddings) and a Cross-Encoder reranking stage. Integrated Query Transformation techniques (HyDE) to improve retrieval performance for ambiguous user queries. Designed an automated document synchronization engine that processes Confluence and S3 data with RecursiveCharacterTextSplitter and HNSW indexing, resulting in a 65% improvement in retrieval hit rates and sub-second end-to-end response times.",
        tags: ["RAG", "Hybrid Search", "Azure", "ChromaDB", "Cross-Encoders"]
    },
    {
        id: 3,
        title: "Legal Research AI Orchestrator",
        country: "Ecuador",
        problem: "Navigating vast, unstructured legal knowledge bases in Ecuador required high precision and context-aware retrieval to avoid hallucinations in sensitive legal advice.",
        timeline: "6 months • Sole Full-stack AI Engineer",
        solution: "End-to-end delivery of a multi-node LangGraph orchestration system for Ecuadorian law, handling everything from client requirements and UI/UX design to backend architecture and DevOps. Implemented a dual-model strategy using Azure OpenAI (GPT-4o & SLMs) for real-time query refinement, topic classification, and automated filter inference. Engineered a robust RAG pipeline with multi-stage relevance validation and vector search, integrated with Langfuse for full-trace observability and a custom citation engine for verifiable legal references.",
        tags: ["LangGraph", "Azure OpenAI", "RAG", "Legal AI", "Langfuse", "SLM", "Ecuadorian Law"]
    },
    {
        id: 4,
        title: "Multi-Agent Financial Companion",
        country: "USA",
        problem: "Traditional financial management is often fragmented, reactive, and emotionally taxing. Users struggle to maintain context across long-term goals, while tools remain disconnected from the nuanced emotional relationship people have with their money.",
        timeline: "2025 - 2026 • Lead Architect",
        solution: "Engineered a sophisticated multi-agentic system (MAS) powered by LangGraph. The system employs a multi-model strategy: Cerebras for ultra-low latency intent classification and AWS Bedrock for specialized agent execution. A Supervisor-led orchestration with strict state isolation delegates to specialized agents for Finance (SQL-driven analysis), Capture (structured entries), Wealth (KB-backed education), and Goals. A three-tier memory architecture (Episodic, Semantic, Procedural) ensures the companion learns and evolves with the user while maintaining high-performance retrieval via a Hot/Cold path separation.",
        tags: ["LangGraph", "Multi-Agent Systems", "AWS Bedrock", "Cerebras", "SQL Generation", "Vector RAG"]
    },
    {
        id: 5,
        title: "Automotive Sector Conversational AI Platform",
        country: "Spain",
        problem: "Legacy customer service workflows created long turnaround times for vehicle-related queries. Users needed to navigate multiple disconnected systems to access vehicle information, service history, and scheduling, leading to fragmented experiences and increased support overhead. Knowledge base updates required manual processes, and proactive notifications for vehicle maintenance were non-existent.",
        timeline: "3 months • Sole Full-stack Engineer",
        solution: "Independently architected and built a production-ready dual-service conversational AI platform, managing the entire lifecycle from client relationship and QA to deployment. Main chatbot service: LangGraph state machine orchestrating GPT-4o agent with 13+ specialized tools (vehicle info, ITV calculations, service history, invoices, addresses, insurance, purchase data, Confluence RAG queries). Implemented strict Pydantic schema validation, API-aware tool tracking, and dynamic upselling detection with reactive UI components. Built custom RAG pipeline: ChromaDB with HNSW indexing, RecursiveCharacterTextSplitter (1500/200 overlap), Azure OpenAI embeddings, synchronized from Confluence via dedicated sync service with BeautifulSoup HTML parsing and incremental updates. Notification engine: Rule-based system (ITV expiration, maintenance mileage/annual, tire maintenance, biweekly/rain washes, daily service summaries) with Celery workers, RabbitMQ, SQL Server backend, multi-channel support (chatbot, WhatsApp via Twilio), snooze functionality, and CloudEvents v1.0 compliant Azure Event Grid webhook for real-time order status changes. Session management: In-memory store with TTL (24h), automatic cleanup, thread-safe locks. Observability: Langfuse tracing, conversation history in CosmosDB with optimized indexing policies. Multi-language: ES/EN/FR/IT with translation system and language-aware prompts. ITV calculator: Multi-country support (Spain, France, UK, Italy, Germany, Chile, Mexico, Costa Rica, Colombia) with complex vehicle classification logic based on chassis type, weight, and seat count. Security: Content filtering with graceful fallbacks, rate limiting (100 req/min for Event Grid), pre-commit hooks (Bandit, Flake8, secrets detection). Deployment: Docker Compose with service profiles, ChromaDB persistence, Celery beat scheduler, async task processing. Testing: RAGAS evaluation framework for agent metrics. All with comprehensive error handling, message sequence validation, and context truncation strategies.",
        tags: ["LangGraph", "FastAPI", "RAG", "ChromaDB", "Azure OpenAI", "Celery", "RabbitMQ", "SQL Server", "Event Grid", "Twilio", "CosmosDB", "Langfuse", "Docker", "Pydantic", "Multi-language"]
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
