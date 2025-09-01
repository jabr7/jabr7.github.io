import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.167.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.167.1/examples/jsm/loaders/GLTFLoader.js';
import { vertexShader, fragmentShader } from './shaders.js';
import * as TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@18.6.4/dist/tween.esm.js';

// Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Neutral monochromatic lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.4); // Subtle ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x808080, 0.6);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = false; // Keep it simple
scene.add(directionalLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.rotateSpeed = 0.9;
controls.zoomSpeed = 0.9;
controls.minDistance = 2;
controls.maxDistance = 200; // allow bigger overshoot
controls.target.set(0, 0, 0);
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

// Bounce-back config/state
const MAX_DISTANCE = 200;
const BOUNCE_DISTANCE = 150;
const BOUNCE_DURATION_MS = 2000;
let isBouncing = false;
let bounceStartMs = 0;
let bounceFromRadius = 0;
const bounceDir = new THREE.Vector3();

// Camera system
const CAMERA_MODES = {
    FOLLOW: 'follow',
    ORBIT: 'orbit',
    CINEMATIC: 'cinematic'
};
let currentCameraMode = CAMERA_MODES.FOLLOW;

// Follow camera settings
const FOLLOW_DISTANCE = 30;
const FOLLOW_HEIGHT = 12;
const FOLLOW_LAG = 0.15; // Very responsive following for turns
const CAMERA_LAG_POSITION = 0.12; // Separate lag for position
const CAMERA_LAG_TARGET = 0.08; // Separate lag for target
const targetCameraPosition = new THREE.Vector3();
const currentCameraTarget = new THREE.Vector3();

// Cinematic camera settings
const CINEMATIC_DURATION = 1500;
let cinematicStartTime = 0;
let cinematicStartPosition = new THREE.Vector3();
let cinematicStartTarget = new THREE.Vector3();
let cinematicEndPosition = new THREE.Vector3();
let cinematicEndTarget = new THREE.Vector3();
let isInCinematic = false;

// Temp objects for angle logging
const _tmpOffset = new THREE.Vector3();
const _tmpSph = new THREE.Spherical();
let _lastAngleLogMs = 0;

// Camera control functions
function updateFollowCamera(boatPosition, deltaTime) {
    // Safety check: ensure boatPosition is defined
    if (!boatPosition) return;

    // Get boat's actual visual direction (considering wave rotation)
    const boatDirection = new THREE.Vector3(0, 0, -1); // Default forward direction
    if (boatGeometry) {
        // Apply the boat's actual rotation to get its visual direction
        boatDirection.applyQuaternion(boatGeometry.quaternion);
        boatDirection.y = 0; // Keep on horizontal plane
        boatDirection.normalize();
    } else {
        // Fallback to movement rotation if geometry not available
        boatDirection.set(Math.sin(boatRotation), 0, Math.cos(boatRotation));
    }

    // Calculate right vector for proper camera positioning
    const rightVector = new THREE.Vector3();
    rightVector.crossVectors(boatDirection, new THREE.Vector3(0, 1, 0)).normalize();

    // Position camera behind and slightly to the side of the boat for better view
    targetCameraPosition.copy(boatPosition);
    targetCameraPosition.addScaledVector(boatDirection, -FOLLOW_DISTANCE); // Behind
    targetCameraPosition.addScaledVector(rightVector, 2); // Slightly to the right
    targetCameraPosition.y += FOLLOW_HEIGHT;

    // Calculate target look-at position (slightly ahead and above the boat)
    currentCameraTarget.copy(boatPosition);
    currentCameraTarget.addScaledVector(boatDirection, 8); // Further ahead for better anticipation
    currentCameraTarget.y += 3; // Higher look-at point

    // Use separate lag values for more responsive following
    camera.position.lerp(targetCameraPosition, CAMERA_LAG_POSITION);
    controls.target.lerp(currentCameraTarget, CAMERA_LAG_TARGET);

    // Make camera look in the same direction as the boat
    const lookTarget = new THREE.Vector3();
    lookTarget.copy(boatPosition);
    lookTarget.addScaledVector(boatDirection, 15); // Look 15 units ahead in boat's direction
    lookTarget.y += 2; // Look slightly up

    // Use lookAt to rotate camera towards the target point
    camera.lookAt(lookTarget);

}

function startCinematicTransition(targetBuoy) {
    if (isInCinematic) return;

    isInCinematic = true;
    currentCameraMode = CAMERA_MODES.CINEMATIC;
    cinematicStartTime = performance.now();

    // Store starting positions
    cinematicStartPosition.copy(camera.position);
    cinematicStartTarget.copy(controls.target);

    // Calculate cinematic end position (close to buoy, elevated)
    const buoyPos = targetBuoy.position;
    cinematicEndPosition.copy(buoyPos);
    cinematicEndPosition.add(new THREE.Vector3(8, 12, 8)); // Offset position

    cinematicEndTarget.copy(buoyPos);
    cinematicEndTarget.y += 5; // Look slightly above buoy
}

function updateCinematicCamera() {
    if (!isInCinematic) return;

    const elapsed = performance.now() - cinematicStartTime;
    const progress = Math.min(elapsed / CINEMATIC_DURATION, 1);

    // Smooth easing function
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out

    // Interpolate camera position
    camera.position.lerpVectors(cinematicStartPosition, cinematicEndPosition, easeProgress);

    // Interpolate camera target
    controls.target.lerpVectors(cinematicStartTarget, cinematicEndTarget, easeProgress);

    // End cinematic when complete
    if (progress >= 1) {
        isInCinematic = false;
        currentCameraMode = CAMERA_MODES.ORBIT; // Switch to orbit mode after cinematic
    }
}

function switchCameraMode(mode) {
    if (mode === CAMERA_MODES.FOLLOW) {
        currentCameraMode = CAMERA_MODES.FOLLOW;
        controls.enabled = false; // Disable orbit controls

        // Safety check: ensure boatPosition is defined
        if (!boatPosition) {
            console.warn('Boat position not ready yet, deferring follow camera initialization');
            return;
        }

        // Set initial follow camera position immediately
        const boatDirection = new THREE.Vector3(0, 0, -1); // Default forward direction
        if (boatGeometry) {
            // Apply the boat's actual rotation to get its visual direction
            boatDirection.applyQuaternion(boatGeometry.quaternion);
            boatDirection.y = 0; // Keep on horizontal plane
            boatDirection.normalize();
        } else {
            // Fallback to movement rotation if geometry not available
            boatDirection.set(Math.sin(boatRotation), 0, Math.cos(boatRotation));
        }

        // Calculate right vector for proper camera positioning
        const rightVector = new THREE.Vector3();
        rightVector.crossVectors(boatDirection, new THREE.Vector3(0, 1, 0)).normalize();

        // Position camera behind and slightly to the side of the boat
        targetCameraPosition.copy(boatPosition);
        targetCameraPosition.addScaledVector(boatDirection, -FOLLOW_DISTANCE);
        targetCameraPosition.addScaledVector(rightVector, 2);
        targetCameraPosition.y += FOLLOW_HEIGHT;

        camera.position.copy(targetCameraPosition);

        currentCameraTarget.copy(boatPosition);
        currentCameraTarget.addScaledVector(boatDirection, 8);
        currentCameraTarget.y += 3;

        controls.target.copy(currentCameraTarget);

        // Set initial camera rotation to match boat direction
        const initialLookTarget = new THREE.Vector3();
        initialLookTarget.copy(boatPosition);
        initialLookTarget.addScaledVector(boatDirection, 15);
        initialLookTarget.y += 2;

        camera.lookAt(initialLookTarget);

    } else if (mode === CAMERA_MODES.ORBIT) {
        currentCameraMode = CAMERA_MODES.ORBIT;
        controls.enabled = true; // Enable orbit controls
        isInCinematic = false; // Cancel any ongoing cinematic
    }
}

// Camera mode indicator
const cameraModeIndicator = document.createElement('div');
cameraModeIndicator.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    color: #fff;
    font-family: monospace;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.5);
    padding: 5px 10px;
    border-radius: 3px;
    border: 1px solid #444;
`;
cameraModeIndicator.textContent = 'CAMERA: FOLLOW';
document.body.appendChild(cameraModeIndicator);

// Update camera mode indicator
function updateCameraModeIndicator() {
    let modeText = 'CAMERA: ';
    if (isInCinematic) {
        modeText += 'CINEMATIC';
        cameraModeIndicator.style.background = 'rgba(100, 100, 150, 0.7)';
    } else if (currentCameraMode === CAMERA_MODES.FOLLOW) {
        modeText += 'FOLLOW';
        cameraModeIndicator.style.background = 'rgba(0, 0, 0, 0.5)';
    } else if (currentCameraMode === CAMERA_MODES.ORBIT) {
        modeText += 'ORBIT';
        cameraModeIndicator.style.background = 'rgba(0, 0, 0, 0.5)';
    }
    cameraModeIndicator.textContent = modeText;
}

// Set up initial camera position for orbit mode reference
camera.position.set(18, 16, 24);
controls.target.set(0, 0, 0);

// Set initial spherical angles for orbit controls
{
	const target = controls.target.clone();
	const radius = camera.position.distanceTo(target);
	const sph = new THREE.Spherical(
		radius,
		THREE.MathUtils.degToRad(76.2),
		THREE.MathUtils.degToRad(37.2)
	);
	camera.position.copy(new THREE.Vector3().setFromSpherical(sph).add(target));
}
camera.lookAt(controls.target);
controls.update();

// Point grid geometry
const span = 400;
const grid = 600; // density
const positions = [];
for (let i = 0; i <= grid; i++) {
	for (let j = 0; j <= grid; j++) {
		const x = (i / grid - 0.5) * span;
		const z = (j / grid - 0.5) * span;
		positions.push(x, 0, z);
	}
}
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

// Golden-angle wave bank (10 waves)
const N = 10;
const golden = Math.PI * (3 - Math.sqrt(5)); // ~2.3999632
const waveDirs = Array.from({ length: N }, (_, i) => {
	const ang = i * golden;
	return new THREE.Vector2(Math.cos(ang), Math.sin(ang)).normalize();
});
const waveAmp = Array.from({ length: N }, (_, i) => 0.6 * Math.pow(0.78, i));
const waveLen = Array.from({ length: N }, (_, i) => 24.0 / Math.pow(1.28, i));
const waveSpeed = Array.from({ length: N }, (_, i) => 1.1 + i * 0.15);
const waveSteep = Array.from({ length: N }, (_, i) => 0.5 * Math.pow(0.9, i));
const wavePhase = Array.from({ length: N }, (_, i) => Math.random() * Math.PI * 2);

// Material for points
const material = new THREE.ShaderMaterial({
	vertexShader,
	fragmentShader,
	uniforms: {
		uTime: { value: 0 },
		uAmplitude: { value: 1.3 },
		uFrequency: { value: 0.4 },
		uSpeed: { value: 1.0 },
		uFogColor: { value: new THREE.Color(0.0, 0.0, 0.0) },
		uFogNear: { value: 20.0 },
		uFogFar: { value: 220.0 },
		uSpanHalf: { value: span * 0.5 },
		uFadeWidth: { value: 60.0 },
		// shimmer (visual-only)
		uShimmerAmp: { value: 0.12 },
		uShimmerFreq: { value: 0.25 },
		uShimmerSpeed: { value: 1.7 },
		// crest-only tiny ripples
		uRippleAmp: { value: 0.04 },
		uRippleFreq: { value: 2.6 },
		uRippleSpeed: { value: 2.2 },
		uCrestLow: { value: 0.05 },
		uCrestHigh: { value: 0.35 },
		// gerstner wave bank
		uWaveDir: { value: waveDirs },
		uWaveAmp: { value: waveAmp },
		uWaveLen: { value: waveLen },
		uWaveSpeed: { value: waveSpeed },
		uWaveSteep: { value: waveSteep },
		uWavePhase: { value: wavePhase },
		// group mask (two-layer value noise)
		uGroupStrength: { value: 0.65 },
		uGroupFreq: { value: 0.05 },
		uGroupVel: { value: new THREE.Vector2(0.03, 0.02) },
		uGroupFreq2: { value: 0.043 },
		uGroupVel2: { value: new THREE.Vector2(0.025, -0.018) },
		// domain warp
		uWarpAmp: { value: 1.0 },
		uWarpFreq: { value: 0.06 },
		uWarpVel: { value: new THREE.Vector2(0.06, -0.04) },
		// phase-noise field (tiny)
		uPhaseNoiseAmp: { value: 0.22 },
		uPhaseNoiseFreq: { value: 0.06 },
		uPhaseNoiseVel: { value: new THREE.Vector2(0.02, -0.017) }
	},
	transparent: true
});

const dots = new THREE.Points(geometry, material);
dots.rotation.x = 0;
scene.add(dots);

// Import and initialize boat system
import { initBoat, updateBoat, boatPosition, boatRotation, boatGeometry, keys } from './boat.js';
import { initWaveSampling } from './wave-sampling.js';
import { initBuoys, updateBuoys, interactWithBuoy, getCurrentHighlightedBuoy, updateTextSprites } from './buoy.js';
import { showControlsModal } from './modal.js';
import { initTrails, updateTrails } from './trails.js';


// Initialize wave sampling with our wave parameters
initWaveSampling(waveDirs, waveAmp, waveLen, waveSpeed, waveSteep, wavePhase);

// Initialize water spray system (integrates with ocean particles)
initTrails(dots);

// Initialize boat
const boat = initBoat(scene, THREE);

// Initialize camera in follow mode (after boat is ready)
switchCameraMode(CAMERA_MODES.FOLLOW);

// Mobile control functions - Clean D-pad style
function createMobileControls() {
    // Create control container
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'mobile-controls';
    controlsContainer.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 30px;
        z-index: 100;
        pointer-events: none;
    `;

    // D-pad container (4 directional buttons in a cross pattern)
    const dpadContainer = document.createElement('div');
    dpadContainer.style.cssText = `
        position: relative;
        width: 180px;
        height: 180px;
        pointer-events: auto;
    `;

    // Center point for positioning
    const centerX = 90;
    const centerY = 90;
    const buttonSize = 50;
    const spacing = 55;

    // Create directional buttons
    const directions = [
        { key: 'forward', symbol: '↑', x: centerX - buttonSize/2, y: centerY - spacing - buttonSize/2 },
        { key: 'backward', symbol: '↓', x: centerX - buttonSize/2, y: centerY + spacing - buttonSize/2 },
        { key: 'left', symbol: '←', x: centerX - spacing - buttonSize/2, y: centerY - buttonSize/2 },
        { key: 'right', symbol: '→', x: centerX + spacing - buttonSize/2, y: centerY - buttonSize/2 }
    ];

    directions.forEach(dir => {
        const button = document.createElement('button');
        button.textContent = dir.symbol;
        button.style.cssText = `
            position: absolute;
            left: ${dir.x}px;
            top: ${dir.y}px;
            width: ${buttonSize}px;
            height: ${buttonSize}px;
            border: 3px solid #fff;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.7);
            color: #fff;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        `;

        // Add event listeners
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys[dir.key] = true;
            button.style.transform = 'scale(0.9)';
            button.style.background = 'rgba(255, 255, 255, 0.3)';
            if (navigator.vibrate) navigator.vibrate(40);
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[dir.key] = false;
            button.style.transform = 'scale(1)';
            button.style.background = 'rgba(0, 0, 0, 0.7)';
        });

        button.addEventListener('touchcancel', (e) => {
            keys[dir.key] = false;
            button.style.transform = 'scale(1)';
            button.style.background = 'rgba(0, 0, 0, 0.7)';
        });

        dpadContainer.appendChild(button);
    });

    // Action buttons (right side)
    const actionContainer = document.createElement('div');
    actionContainer.style.cssText = `
        position: absolute;
        left: 220px;
        top: 50px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        pointer-events: auto;
    `;

    // Interact button
    const interactBtn = createControlButton('🎯', 'interact-btn', () => {
        const event = new KeyboardEvent('keydown', { code: 'KeyE' });
        document.dispatchEvent(event);
        if (navigator.vibrate) navigator.vibrate(80);
    }, null, 60);

    // Camera toggle button
    const cameraBtn = createControlButton('📹', 'camera-btn', () => {
        const event = new KeyboardEvent('keydown', { code: 'KeyC' });
        document.dispatchEvent(event);
        if (navigator.vibrate) navigator.vibrate(60);
    }, null, 60);

    actionContainer.appendChild(interactBtn);
    actionContainer.appendChild(cameraBtn);

    controlsContainer.appendChild(dpadContainer);
    controlsContainer.appendChild(actionContainer);
    document.body.appendChild(controlsContainer);
}

function createControlButton(text, className, onPress, onRelease = null, size = 50) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        border: 3px solid #fff;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        font-size: ${size * 0.4}px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
    `;

    button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        button.style.transform = 'scale(0.9)';
        button.style.background = 'rgba(255, 255, 255, 0.3)';
        if (onPress) onPress();
    });

    button.addEventListener('touchend', (e) => {
        e.preventDefault();
        button.style.transform = 'scale(1)';
        button.style.background = 'rgba(0, 0, 0, 0.7)';
        if (onRelease) onRelease();
    });

    button.addEventListener('touchcancel', (e) => {
        button.style.transform = 'scale(1)';
        button.style.background = 'rgba(0, 0, 0, 0.7)';
        if (onRelease) onRelease();
    });

    return button;
}

function updateMobileHUD() {
    const hud = document.getElementById('hud');
    if (hud) {
        // Preserve original positioning for info button
        hud.style.position = 'relative';
        hud.style.fontSize = '11px';
        hud.style.bottom = '220px';
        hud.style.top = 'auto';
        hud.style.left = '10px';
        hud.style.right = '10px';
        hud.style.textAlign = 'center';

        // Ensure info button stays visible and properly positioned
        const infoBtn = document.getElementById('info-btn');
        if (infoBtn) {
            infoBtn.style.position = 'fixed';
            infoBtn.style.top = '10px';
            infoBtn.style.left = '10px';
            infoBtn.style.zIndex = '1000';
        }
    }
}

// Force landscape orientation on mobile
function enforceLandscape() {
    if (isMobile && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(err => {
            console.log('Could not lock to landscape:', err);
        });
    }

    // Create orientation warning for portrait
    if (window.innerHeight > window.innerWidth && isMobile) {
        const warning = document.createElement('div');
        warning.id = 'orientation-warning';
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
        `;
        warning.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
            <h2>Please rotate your device</h2>
            <p>This experience works best in landscape mode</p>
            <div style="font-size: 24px; margin-top: 20px;">↻</div>
        `;

        document.body.appendChild(warning);

        // Hide warning when rotated to landscape
        const checkOrientation = () => {
            if (window.innerWidth > window.innerHeight) {
                const warning = document.getElementById('orientation-warning');
                if (warning) {
                    warning.remove();
                }
            }
        };

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
    }
}

// Mobile detection and touch controls
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

if (isMobile) {
    createMobileControls();
    updateMobileHUD();
    enforceLandscape();
}

// Initialize buoys
const buoySystem = initBuoys(scene, THREE);

// Mobile touch event handling
if (isMobile) {
    // Prevent default touch behaviors that interfere with 3D scene
    document.addEventListener('touchstart', (e) => {
        // Only prevent if not touching mobile controls
        if (!e.target.closest('#mobile-controls')) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        // Allow touchmove on mobile controls but prevent others
        if (!e.target.closest('#mobile-controls')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Prevent context menu on mobile
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// Handle E key for buoy interaction and Escape to close modals
document.addEventListener('keydown', (event) => {
	if (event.code === 'KeyE') {
		event.preventDefault();
		console.log('E key pressed - checking for modal or interaction');

		// Check if SweetAlert2 modal is currently open
		if (document.querySelector('.swal2-container')) {
			console.log('Modal is open, ignoring E key');
			return; // Don't process E key if modal is open
		}

		console.log('No modal open, processing E key for interaction');
		interactWithBuoy(THREE, scene, startCinematicTransition, () => switchCameraMode(CAMERA_MODES.FOLLOW));
	}
	if (event.code === 'KeyC') {
		event.preventDefault();
		// Toggle between follow and orbit camera modes
		if (currentCameraMode === CAMERA_MODES.FOLLOW) {
			switchCameraMode(CAMERA_MODES.ORBIT);
		} else if (currentCameraMode === CAMERA_MODES.ORBIT && !isInCinematic) {
			switchCameraMode(CAMERA_MODES.FOLLOW);
		}
	}
	if (event.code === 'Escape') {
		event.preventDefault();
		// Escape is now handled by the HTML modal itself
	}
});

function animate() {
	requestAnimationFrame(animate);

	// Update all animations
	TWEEN.update();

	// Update camera based on current mode
	if (currentCameraMode === CAMERA_MODES.FOLLOW && !isInCinematic) {
		updateFollowCamera(boatPosition, 0.02);
	} else if (currentCameraMode === CAMERA_MODES.CINEMATIC || isInCinematic) {
		updateCinematicCamera();
	}

	// Update camera mode indicator
	updateCameraModeIndicator();

	material.uniforms.uTime.value += 0.02;

	// Only update orbit controls if in orbit mode
	if (currentCameraMode === CAMERA_MODES.ORBIT && !isInCinematic) {
		controls.update();
	}

	// Update boat
	const time = material.uniforms.uTime.value;
	const amplitude = material.uniforms.uAmplitude.value;
	const boatData = updateBoat(time, amplitude, THREE);

	// Update bioluminescent trails
	const boatVelocity = boatData ? boatData.velocity : new THREE.Vector3();
	const boatDirection = boatData ? boatData.direction : new THREE.Vector3(0, 0, -1);
	updateTrails(0.02, boatPosition, boatVelocity, boatDirection, keys);

	// Update buoys
	updateBuoys(time, boatPosition, THREE, scene);

	// Update text sprites to face camera
	updateTextSprites(camera);

	// HTML modal handles its own closing logic

	// Bounce-back when hitting the outer limit
	const now = performance.now();

	const currentRadius = camera.position.distanceTo(controls.target);
	if (!isBouncing && currentRadius >= MAX_DISTANCE - 0.01) {
		isBouncing = true;
		controls.enableZoom = false;
		bounceStartMs = now;
		bounceFromRadius = currentRadius;
		bounceDir.copy(camera.position).sub(controls.target).normalize();
	}
	if (isBouncing) {
		const t = Math.min(1, (now - bounceStartMs) / BOUNCE_DURATION_MS);
		// smoother step easing
		const ease = t * t * (3.0 - 2.0 * t);
		const newRadius = THREE.MathUtils.lerp(bounceFromRadius, BOUNCE_DISTANCE, ease);
		camera.position.copy(bounceDir).multiplyScalar(newRadius).add(controls.target);
		camera.updateMatrixWorld();
		controls.update();
		if (t >= 1) {
			isBouncing = false;
			controls.enableZoom = true;
		}
	}

	renderer.render(scene, camera);
}


// First-time visitor detection and info button setup
document.addEventListener('DOMContentLoaded', () => {
    const hasVisited = localStorage.getItem('oceanPortfolioVisited');

    // Show controls modal on first visit
    if (!hasVisited) {
        // Small delay to let the page load
        setTimeout(() => {
            showControlsModal();
            localStorage.setItem('oceanPortfolioVisited', 'true');
        }, 1000);
    }

    // Setup info button
    const infoBtn = document.getElementById('info-btn');
    if (infoBtn) {
        infoBtn.onclick = showControlsModal;

        // Add touch events for mobile
        infoBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });

        infoBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            showControlsModal();
        }, { passive: false });
    }
});

animate();

window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});
