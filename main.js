import { vertexShader, fragmentShader } from './shaders.js';

// Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
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

camera.position.set(18, 16, 24);
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

// Material for points
const material = new THREE.ShaderMaterial({
	vertexShader,
	fragmentShader,
	uniforms: {
		uTime: { value: 0 },
		uAmplitude: { value: 1.2 },
		uFrequency: { value: 0.4 },
		uSpeed: { value: 1.0 },
		uFogColor: { value: new THREE.Color(0.0, 0.0, 0.0) },
		uFogNear: { value: 20.0 },
		uFogFar: { value: 220.0 },
		uSpanHalf: { value: span * 0.5 },
		uFadeWidth: { value: 60.0 }
	},
	transparent: true
});

const dots = new THREE.Points(geometry, material);
dots.rotation.x = 0;
scene.add(dots);

function animate() {
	requestAnimationFrame(animate);
	material.uniforms.uTime.value += 0.02;
	controls.update();

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
