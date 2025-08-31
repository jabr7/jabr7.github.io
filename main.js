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

// Temp objects for angle logging
const _tmpOffset = new THREE.Vector3();
const _tmpSph = new THREE.Spherical();
let _lastAngleLogMs = 0;

camera.position.set(18, 16, 24);
// Set initial spherical angles: phi=76.2°, theta=37.2° (keep same radius)
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
camera.lookAt(0, 0, 0);
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
import { initBoat, updateBoat, boatPosition } from './boat.js';
import { initWaveSampling } from './wave-sampling.js';
import { initBuoys, updateBuoys, interactWithBuoy, getCurrentHighlightedBuoy } from './buoy.js';


// Initialize wave sampling with our wave parameters
initWaveSampling(waveDirs, waveAmp, waveLen, waveSpeed, waveSteep, wavePhase);

// Initialize boat
const boat = initBoat(scene, THREE);

// Initialize buoys
const buoySystem = initBuoys(scene, THREE);

// Handle E key for buoy interaction and Escape to close modals
document.addEventListener('keydown', (event) => {
	if (event.code === 'KeyE') {
		event.preventDefault();
		interactWithBuoy(THREE, scene);
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

	material.uniforms.uTime.value += 0.02;
	controls.update();

	// Update boat
	const time = material.uniforms.uTime.value;
	const amplitude = material.uniforms.uAmplitude.value;
	updateBoat(time, amplitude, THREE);

	// Update buoys
	updateBuoys(time, boatPosition, THREE, scene);

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
animate();

window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});
