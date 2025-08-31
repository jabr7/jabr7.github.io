// Buoy system module
import { sampleWaveHeight } from './wave-sampling.js';

// Buoy state
export let buoys = [];
const buoyPositions = [
    { x: 20, z: 15 },   // North-east
    { x: -25, z: 10 },  // North-west
    { x: 30, z: -20 },  // South-east
    { x: -15, z: -25 }, // South-west
    { x: 0, z: 35 }     // Far north
];

const INTERACTION_DISTANCE = 12;
let currentHighlightedBuoy = null;

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
            state: 'idle' // idle, highlighted, visited
        };

        buoys.push(buoyGroup);
        scene.add(buoyGroup);
    });

    console.log('Buoy system initialized with', buoys.length, 'buoys');
    return buoys;
}

// Update buoy positions and interactions
export function updateBuoys(time, boatPosition, THREE) {
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
    const buoyMesh = buoy.children[0]; // Main buoy mesh
    const light = buoy.children[2]; // Light on top

    if (distance <= INTERACTION_DISTANCE) {
        // Highlighted state - player is close enough to interact
        if (buoy.userData.state !== 'highlighted') {
            buoy.userData.state = 'highlighted';
            buoyMesh.material.color.setHex(0x00ff00); // Green when highlighted
            light.material.color.setHex(0x00ff00); // Green light
            buoyMesh.material.emissive = new THREE.Color(0x004400);
            console.log('Buoy', buoy.userData.id, 'highlighted - Press E to interact');
        }
        currentHighlightedBuoy = buoy;
    } else {
        // Idle state - reset to original appearance
        if (buoy.userData.state !== 'idle') {
            buoy.userData.state = 'idle';
            buoyMesh.material.color.copy(buoy.userData.originalColor);
            light.material.color.setHex(0x00ff00); // Reset light
            buoyMesh.material.emissive = new THREE.Color(0x000000);
        }
        if (currentHighlightedBuoy === buoy) {
            currentHighlightedBuoy = null;
        }
    }
}

// Handle interaction (called when E key is pressed)
export function interactWithBuoy() {
    if (currentHighlightedBuoy) {
        console.log('Interacting with buoy', currentHighlightedBuoy.userData.id);
        console.log('Content:', currentHighlightedBuoy.userData.content);

        // Mark as visited
        currentHighlightedBuoy.userData.state = 'visited';
        currentHighlightedBuoy.children[0].material.emissive = new THREE.Color(0x444400); // Golden glow

        // TODO: Open UI card with content
        showBuoyCard(currentHighlightedBuoy.userData.content);

        return true;
    }
    return false;
}

// Show buoy information card (placeholder for now)
function showBuoyCard(content) {
    console.log('=== PROJECT CARD ===');
    console.log('Title:', content.title);
    console.log('Problem:', content.problem);
    console.log('Timeline:', content.timeline);
    console.log('Solution:', content.solution);
    console.log('Tags:', content.tags.join(', '));
    console.log('===================');

    // TODO: Create actual 3D card UI
    alert(`${content.title}\n\nProblem: ${content.problem}\n\nTimeline: ${content.timeline}\n\nSolution: ${content.solution}\n\nTags: ${content.tags.join(', ')}`);
}

// Get current highlighted buoy for UI feedback
export function getCurrentHighlightedBuoy() {
    return currentHighlightedBuoy;
}

// Get all buoys for external access
export function getBuoys() {
    return buoys;
}
