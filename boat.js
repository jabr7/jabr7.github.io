// Boat system module
import * as THREE from 'three';
import { sampleWaveHeight } from './wave-sampling.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.167.1/examples/jsm/loaders/GLTFLoader.js';

// Boat state
export let boatPosition;
export let boatVelocity;
export let boatRotation = 0;
export const boatSpeed = 0.01; // Tuned for better control
export const boatTurnSpeed = 0.02; // Tuned turning speed

// Boat geometry
export let boatGeometry;

// Keyboard controls state
export const keys = {
	forward: false,
	backward: false,
	left: false,
	right: false,
	boost: false
};

// Initialize boat system
export function initBoat(scene, THREE) {
	// Initialize boat state
	boatPosition = new THREE.Vector3(0, 0, 0);
	boatVelocity = new THREE.Vector3(0, 0, 0);

	// Create temporary placeholder while GLB loads
	boatGeometry = new THREE.Group();
	const placeholderGeometry = new THREE.BoxGeometry(2, 0.5, 6);
	const placeholderMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
	const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
	boatGeometry.add(placeholder);
	boatGeometry.position.copy(boatPosition);
	scene.add(boatGeometry);

	// Load the GLB boat model
	const loader = new GLTFLoader();
	loader.load('./Boat.glb', (gltf) => {
		// Remove placeholder
		boatGeometry.remove(placeholder);
		placeholder.geometry.dispose();
		placeholder.material.dispose();

		// Add the loaded boat model
		const loadedBoat = gltf.scene;

		// Scale and position the boat appropriately
		loadedBoat.scale.set(0.02, 0.02, 0.02); // Adjust scale as needed
		loadedBoat.position.set(0, -0.5, 0); // Center and lower slightly
		loadedBoat.rotation.y = Math.PI / 2; // Face forward (90 degrees)

		// Add to boat geometry group
		boatGeometry.add(loadedBoat);

		console.log('Boat model loaded successfully');
	}, (progress) => {
		console.log('Boat loading progress:', (progress.loaded / progress.total * 100) + '%');
	}, (error) => {
		console.error('Error loading boat model:', error);
	});

	// Add lighting for the boat
	const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(10, 10, 5);
	scene.add(directionalLight);

	// Setup keyboard controls
	setupKeyboardControls();

	return boatGeometry;
}

// Setup keyboard event listeners
function setupKeyboardControls() {
	document.addEventListener('keydown', (event) => {
		switch (event.code) {
			case 'KeyW':
			case 'ArrowUp':
				keys.forward = true;
				event.preventDefault();
				break;
			case 'KeyS':
			case 'ArrowDown':
				keys.backward = true;
				event.preventDefault();
				break;
			case 'KeyA':
			case 'ArrowLeft':
				keys.left = true;
				event.preventDefault();
				break;
			case 'KeyD':
			case 'ArrowRight':
				keys.right = true;
				event.preventDefault();
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				keys.boost = true;
				event.preventDefault();
				break;
		}
	});

	document.addEventListener('keyup', (event) => {
		switch (event.code) {
			case 'KeyW':
			case 'ArrowUp':
				keys.forward = false;
				break;
			case 'KeyS':
			case 'ArrowDown':
				keys.backward = false;
				break;
			case 'KeyA':
			case 'ArrowLeft':
				keys.left = false;
				break;
			case 'KeyD':
			case 'ArrowRight':
				keys.right = false;
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				keys.boost = false;
				break;
		}
	});
}

// Update boat physics and controls
export function updateBoat(time, amplitude, THREE) {
	// Update boat position and rotation based on waves
	const waveData = sampleWaveHeight(boatPosition, time);

	// Apply wave displacement
	boatGeometry.position.copy(boatPosition);
	boatGeometry.position.y += waveData.height * amplitude;

	// Calculate surface normal for boat rotation
	const normal = new THREE.Vector3(-waveData.dx, 1, -waveData.dz).normalize();
	const up = new THREE.Vector3(0, 1, 0);
	const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
	boatGeometry.setRotationFromQuaternion(quaternion);

	// Add boat rotation (steering)
	boatGeometry.rotateY(boatRotation);

	// Boat physics (simple momentum)
	const forward = new THREE.Vector3(0, 0, -1);
	forward.applyQuaternion(boatGeometry.quaternion);
	forward.y = 0; // Keep boat on water surface
	forward.normalize();

	// Apply velocity
	boatPosition.add(boatVelocity);

	// Friction
	boatVelocity.multiplyScalar(0.96); // Slightly more friction for better control

	// Handle boat controls
	let currentSpeed = boatSpeed;
	if (keys.boost) currentSpeed *= 1.8; // Reduced boost multiplier for better control

	if (keys.forward) {
		boatVelocity.x -= Math.sin(boatRotation) * currentSpeed;
		boatVelocity.z -= Math.cos(boatRotation) * currentSpeed;
	}
	if (keys.backward) {
		boatVelocity.x += Math.sin(boatRotation) * currentSpeed * 0.6;
		boatVelocity.z += Math.cos(boatRotation) * currentSpeed * 0.6;
	}
	if (keys.left) {
		boatRotation += boatTurnSpeed;
	}
	if (keys.right) {
		boatRotation -= boatTurnSpeed;
	}

	// Calculate boat forward direction from its transformation matrix
	const boatForward = new THREE.Vector3(0, 0, -1); // Local forward direction
	boatForward.applyQuaternion(boatGeometry.quaternion); // Transform to world space
	boatForward.y = 0; // Keep on water surface
	boatForward.normalize();

	// Return data needed for trails system
	return {
		velocity: boatVelocity.clone(),
		direction: boatForward
	};
}
