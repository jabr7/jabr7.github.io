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
    { x: 0, z: 65 },    // Far north (much farther)
    { x: 0, z: -75 },   // Far south (LLMNL)
    { x: -70, z: 0 },   // Far west (Ponus)
    { x: 72, z: 58 },   // North-east far (CharruaDevs)
    { x: -58, z: -62 }  // South-west far (Gaussian Splatting)
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
export const buoyContent = [
    {
        id: 1,
        title: "Workshop ERP",
        subtitle: "Enterprise automotive operations orchestrator",
        hook: "Automotive operations, .NET + Angular",
        country: "Spain",
        problem: "A leading automotive service network faced significant operational friction due to decentralized management of service centers, fragmented inventory tracking, and complex workforce scheduling across multiple European regions.",
        timeline: "2025 - 4 months • Full-stack Engineer (Team of 6)",
        solution: "Co-engineered a comprehensive enterprise resource planning (ERP) system tailored for the automotive sector. Developed a high-concurrency .NET backend utilizing Clean Architecture and Domain-Driven Design (DDD) to synchronize multi-center inventory, automate order processing, and manage complex tire and service margins. Built a feature-rich Angular 16 frontend with NgRx for robust state management, implementing a sophisticated resource-timeline calendar system for real-time staff and maintenance scheduling. The platform integrated Azure AD for enterprise security, Chart.js for operational analytics, and automated reporting engines, centralizing the management of thousands of vehicle life cycles and service orders.",
        tags: [".NET", "Angular", "NgRx", "SQL Server", "Resource Scheduling", "Clean Architecture", "Azure AD"]
    },
    {
        id: 2,
        title: "The 4-Minute Manual",
        subtitle: "AI-powered operations manual synthesizer",
        hook: "6 months of drafting, down to 4 minutes",
        country: "Uruguay",
        problem: "A major international financial institution required up to 6 months and over $15,000 in expert labor to manually synthesize a single Operations Manual (MOP). The process involved cross-referencing thousands of pages of technical specifications, legal frameworks, and complex financial matrices, creating a massive bottleneck for project deployment.",
        timeline: "2024 - 2 months • Lead Full-stack AI Engineer",
        solution: "Architected a production-ready RAG pipeline that automates the end-to-end synthesis of technical documentation. Integrated Azure Document Intelligence for high-fidelity extraction of unstructured data and tables, coupled with Azure AI Search for semantic context retrieval. Engineered a sophisticated orchestration layer using GPT-4o to generate compliant document sections, including hierarchical objectives, result matrices, and multi-year financial disbursement schedules, with strict JSON-schema validation and automated DOCX assembly. The system reduced document generation time from 6 months to just 4 minutes, with operational costs dropping from thousands of dollars to cents per execution.",
        tags: ["GPT-4o", "Azure AI Search", "Document Intelligence", "RAG", "FastAPI", "Automated Synthesis", "DOCX Automation"]
    },
    {
        id: 3,
        title: "Ecuador Legal RAG",
        subtitle: "Legal research AI orchestrator",
        hook: "Cited answers over Ecuadorian law",
        country: "Ecuador",
        problem: "Navigating vast, unstructured legal knowledge bases in Ecuador required high precision and context-aware retrieval to avoid hallucinations in sensitive legal advice.",
        timeline: "2024 - 6 months • Sole Full-stack AI Engineer",
        solution: "End-to-end delivery of a multi-node LangGraph orchestration system for Ecuadorian law, handling everything from client requirements and UI/UX design to backend architecture and DevOps. Implemented a dual-model strategy using Azure OpenAI (GPT-4o & SLMs) for real-time query refinement, topic classification, and automated filter inference. Engineered a robust RAG pipeline with multi-stage relevance validation and vector search, integrated with Langfuse for full-trace observability and a custom citation engine for verifiable legal references.",
        tags: ["LangGraph", "Azure OpenAI", "RAG", "Legal AI", "Langfuse", "SLM", "Ecuadorian Law"]
    },
    {
        id: 4,
        title: "Financial Companion",
        subtitle: "Multi-agent financial companion",
        hook: "Multi-agent money coach",
        country: "USA",
        problem: "Traditional financial management is often fragmented, reactive, and emotionally taxing. Users struggle to maintain context across long-term goals, while tools remain disconnected from the nuanced emotional relationship people have with their money.",
        timeline: "2025 - 2026 - 6 months• Lead Architect (Team of 10)",
        solution: "Engineered a sophisticated multi-agentic system (MAS) powered by LangGraph. The system employs a multi-model strategy: Cerebras for ultra-low latency intent classification and AWS Bedrock for specialized agent execution. A Supervisor-led orchestration with strict state isolation delegates to specialized agents for Finance (SQL-driven analysis), Capture (structured entries), Wealth (KB-backed education), and Goals. A three-tier memory architecture (Episodic, Semantic, Procedural) ensures the companion learns and evolves with the user while maintaining high-performance retrieval via a Hot/Cold path separation.",
        tags: ["LangGraph", "Multi-Agent Systems", "AWS Bedrock", "Cerebras", "SQL Generation", "Vector RAG"]
    },
    {
        id: 5,
        title: "Fleet Copilot",
        subtitle: "Automotive sector conversational AI platform",
        hook: "Agentic assistant for vehicle fleets",
        country: "Spain",
        problem: "Legacy customer service workflows created long turnaround times for vehicle-related queries. Users needed to navigate multiple disconnected systems to access vehicle information, service history, and scheduling, leading to fragmented experiences and increased support overhead. Knowledge base updates required manual processes, and proactive notifications for vehicle maintenance were non-existent.",
        timeline: "3 months • Sole Full-stack Engineer",
        solution: "Built and shipped two coordinated production systems. (1) An agentic customer-facing assistant implemented as a LangGraph state machine, integrating directly with existing workshop APIs to let fleet customers query vehicles, service history, invoices, and upcoming scheduling without navigating large operational datasets. The agent streams responses/events for UI feedback, maintains session-level memory, supports multilingual interactions, and can retrieve internal knowledge from a Confluence-backed vector store. (2) A separate notification/sync service: a Celery + RabbitMQ rule engine that evaluates maintenance, ITV, washing and daily summary rules against large CosmosDB-backed historical data (plus external signals like weather), then dispatches notifications across channels (in-app/chat surfaces and WhatsApp via Twilio).",
        tags: ["Agentic Systems", "LangGraph", "Azure OpenAI", "FastAPI", "CosmosDB", "Celery", "RabbitMQ", "Twilio", "Vector Search"]
    },
    {
        id: 6,
        title: "LLMNL",
        hook: "AI data-QA that investigates like a senior dev",
        country: "Ireland",
        problem: "Zyte crawls huge volumes of web data for clients. Before that data ships, someone has to answer a deceptively simple question: is it actually right? Are the fields filled in, are the images real, did we miss any products, does it match the live site? Spot-checking by hand doesn't scale to thousands of jobs, and dumb rule-checks miss everything that needs judgment.",
        timeline: "2026 • AI/ML Engineer @ Zyte",
        solution: "Built LLMNL (pronounced \"liminal\"), an AI data-QA engine that doesn't just rule-check: it investigates like a senior developer. Each of its six checks is a sandboxed LangGraph deep agent that reads the spider's own source code, profiles the dataset deterministically (HyperLogLog, reservoir sampling, no ML overhead), and re-crawls the live site or calls the Zyte API on demand, only when a verdict actually needs it. It returns an auditable pass / fail / needs-review backed by concrete evidence, callable directly over MCP. Evolution, a Next.js + FastAPI platform on top, runs it on a schedule or straight from Jira/Freshdesk tickets. In production today, fully traced in Langfuse, at roughly $0.15 to $0.80 per run.",
        tags: ["LLM", "MCP", "Deep Agents", "LangGraph", "Gemini", "FastAPI", "Next.js", "Langfuse", "Celery", "GCP"]
    },
    {
        id: 7,
        title: "Ponus",
        hook: "Cycling analytics, synced with Garmin",
        country: "Uruguay",
        problem: "Cyclists had to pay around $30 a month for the training analytics their competitors locked behind a subscription, even though the raw data already lived on their own devices.",
        timeline: "2023 - 2025 • Co-Founder",
        solution: "Co-founded Ponus, a cycling app that synced with Garmin to compute a rider's full training metrics. Riders could track their analytics, sign up for events, and connect with their coaches, who sent workouts and instructions straight through the app. Built as an Angular PWA on a .NET Core backend with MongoDB, deployed on AWS.",
        tags: [".NET Core", "Angular", "PWA", "MongoDB", "Garmin API", "AWS"]
    },
    {
        id: 8,
        title: "CharruaDevs",
        hook: "An SLM that talks like r/CharruaDevs",
        country: "Uruguay",
        category: "lab",
        problem: "I wanted to actually understand how model training works under the hood, not just call an API. The concrete goal: take a small open model and make it talk like r/CharruaDevs, the Uruguayan dev subreddit, with its Rioplatense Spanish and its very particular opinions.",
        timeline: "2026 • Personal fine-tuning project",
        solution: "Fine-tuned Qwen3-4B-Instruct with QLoRA (4-bit base, LoRA rank 32, alpha 64) on ~11k real post and comment pairs scraped from the subreddit, trained entirely at home on a single RTX 4060 Ti with 8GB of VRAM. The adapters target only the attention projections and leave the MLP blocks frozen, so the model changes how it speaks without relearning what it knows. Shipped as a LoRA adapter plus GGUF on Hugging Face and the Ollama registry, in two variants: a raw one for maximum flavor and a chat one that can hold a multi-turn conversation.",
        tags: ["QLoRA", "Unsloth", "Qwen3-4B", "PyTorch", "LoRA", "GGUF", "Ollama", "Hugging Face"]
    },
    {
        id: 9,
        title: "Gaussian Splatting",
        hook: "My bookshelf as a navigable 3D scene",
        country: "Uruguay",
        category: "lab",
        problem: "A weekend rabbit hole: turn a handful of ordinary phone photos into a 3D scene you can fly through in real time, and understand every step instead of running a black-box pipeline.",
        timeline: "2026 • Weekend project",
        solution: "Captured my bookshelf with normal photos, recovered every camera pose with COLMAP (Structure from Motion), then trained a scene made of millions of tiny oriented gaussians, each carrying a position, a shape, a color and an opacity. Because the rendering is differentiable, the whole thing optimizes with plain gradient descent: render from a known angle, compare against the real photo, nudge every parameter, and repeat a few thousand times. The result is navigable live, embedded right in the project.",
        tags: ["Gaussian Splatting", "3DGS", "COLMAP", "Structure from Motion", "Differentiable Rendering", "PyTorch"]
    }
];

// Build a rounded-rect label texture for a buoy. Pass hook='' for a name-only
// (compact) label, or the hook string for the full name + subtitle label.
function buildLabelTexture(THREE, title, hook) {
    const fontSize = 120;
    const hookFontSize = 60;
    const lineGap = 30;
    const padding = 60;
    const outlineWidth = 8;
    const cornerRadius = 35;

    const measureCanvas = document.createElement('canvas');
    const measureContext = measureCanvas.getContext('2d');

    measureContext.font = `600 ${fontSize}px "IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif`;
    const titleMetrics = measureContext.measureText(title);
    const titleWidth = titleMetrics.width;
    const titleHeight =
        Number.isFinite(titleMetrics.actualBoundingBoxAscent) && Number.isFinite(titleMetrics.actualBoundingBoxDescent)
            ? titleMetrics.actualBoundingBoxAscent + titleMetrics.actualBoundingBoxDescent
            : fontSize * 1.2;

    let hookWidth = 0;
    let hookHeight = 0;
    if (hook) {
        measureContext.font = `500 ${hookFontSize}px "IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif`;
        const hookMetrics = measureContext.measureText(hook);
        hookWidth = hookMetrics.width;
        hookHeight =
            Number.isFinite(hookMetrics.actualBoundingBoxAscent) && Number.isFinite(hookMetrics.actualBoundingBoxDescent)
                ? hookMetrics.actualBoundingBoxAscent + hookMetrics.actualBoundingBoxDescent
                : hookFontSize * 1.2;
    }

    const measuredTextWidth = Math.max(titleWidth, hookWidth);
    const measuredTextHeight = titleHeight + (hook ? lineGap + hookHeight : 0);

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

    // Draw rounded background rectangle
    context.fillStyle = 'rgba(10, 10, 12, 0.62)';
    context.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    context.lineWidth = 2;

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

    // Draw the text (title, plus optional hook line underneath)
    const blockTop = (bgHeight - measuredTextHeight) / 2;
    context.save();
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    context.shadowBlur = 10;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    context.font = `600 ${fontSize}px "IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif`;
    context.fillStyle = 'rgba(255, 255, 255, 0.94)';
    context.fillText(title, bgWidth / 2, blockTop + titleHeight / 2);

    if (hook) {
        context.font = `500 ${hookFontSize}px "IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif`;
        context.fillStyle = 'rgba(255, 255, 255, 0.62)';
        context.fillText(hook, bgWidth / 2, blockTop + titleHeight + lineGap + hookHeight / 2);
    }
    context.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false; // Prevent texture blurring
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    return { texture, bgWidth, bgHeight };
}

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

            // Idle color: lab/experiment buoys rest at a soft teal so they read
            // as a different category at a glance; everything else stays light gray.
            const idleColor = buoyContent[index].category === 'lab' ? 0x7fd6c2 : 0xcccccc;

            // Add simple monochromatic icon above buoy
            const iconGeometry = new THREE.SphereGeometry(0.8, 8, 8); // Simpler geometry
            const iconMaterial = new THREE.MeshBasicMaterial({
                color: idleColor, // Light gray, or teal for lab projects
                transparent: true,
                opacity: 0.9
            });
            const icon = new THREE.Mesh(iconGeometry, iconMaterial);
            icon.position.set(0, 8, 0); // Position above buoy

            // Two label versions: compact (name only) shown at rest, and full
            // (name + hook) swapped in when the boat gets close. Keeps the far
            // ocean readable while the pitch appears on approach.
            const title = buoyContent[index].title;
            const hook = buoyContent[index].hook || '';
            const pixelsPerWorldUnitX = 1836 / 18;
            const pixelsPerWorldUnitY = 384 / 4.5;

            const compactLabel = buildLabelTexture(THREE, title, '');
            const fullLabel = hook ? buildLabelTexture(THREE, title, hook) : compactLabel;

            const labelCompact = {
                map: compactLabel.texture,
                scale: new THREE.Vector2(compactLabel.bgWidth / pixelsPerWorldUnitX, compactLabel.bgHeight / pixelsPerWorldUnitY)
            };
            const labelFull = {
                map: fullLabel.texture,
                scale: new THREE.Vector2(fullLabel.bgWidth / pixelsPerWorldUnitX, fullLabel.bgHeight / pixelsPerWorldUnitY)
            };

            const textMaterial = new THREE.SpriteMaterial({
                map: labelCompact.map,
                transparent: true,
                opacity: 1.0,  // Fully opaque for better visibility
                color: idleColor  // Matches the icon's resting color (teal for lab buoys)
            });
            const textSprite = new THREE.Sprite(textMaterial);
            textSprite.scale.set(labelCompact.scale.x, labelCompact.scale.y, 1);
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
                idleColor: idleColor, // resting icon/text color (teal for lab buoys)
                glow: null, // Will be created dynamically
                buoyMesh: buoyMesh,
                icon: icon,
                textSprite: textSprite,
                labelCompact: labelCompact, // name-only label (far / at rest)
                labelFull: labelFull,       // name + hook label (on approach)
                labelExpanded: false,       // which label is currently shown
                interactionRing: null, // Will be created for interaction feedback
                isGLB: true
            };

            buoys.push(buoyGroup);
            scene.add(buoyGroup);
        });
    }, (progress) => {
    }, (error) => {
        console.error('Error loading buoy model:', error);
        // Fallback to simple geometry if GLB fails
        createFallbackBuoys(scene, THREE);
    });

    // If model takes too long to load, show fallback after 5 seconds
    setTimeout(() => {
        if (buoys.length === 0) {
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
// Swap a buoy's label between compact (name only) and full (name + hook).
// Only touches the sprite when the state actually changes, so it is cheap to
// call every frame.
function setLabelExpanded(buoy, expanded) {
    if (buoy.userData.labelExpanded === expanded) return;
    const target = expanded ? buoy.userData.labelFull : buoy.userData.labelCompact;
    if (!target) return;
    buoy.userData.labelExpanded = expanded;
    const sprite = buoy.userData.textSprite;
    sprite.material.map = target.map;
    sprite.material.needsUpdate = true;
    sprite.scale.set(target.scale.x, target.scale.y, 1);
}

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
        // Close enough: reveal the name + hook label
        setLabelExpanded(buoy, true);
        currentHighlightedBuoy = buoy;
    } else {
        // Outside interaction range: show the compact name-only label
        setLabelExpanded(buoy, false);
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
                // Animate back to this buoy's resting color (teal for lab buoys)
                animateBuoyColor(buoy.userData.icon, buoy.userData.idleColor, 600);
                animateBuoyScale(buoy.userData.icon, 1.0, 500);

                // Reset text sprite color to the resting color
                buoy.userData.textSprite.material.color.setHex(buoy.userData.idleColor);

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
