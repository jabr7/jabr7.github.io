// Modal system module
import * as THREE from 'three';
import { sampleWaveHeight } from './wave-sampling.js';

// Modal state
let activeModal = null;

// Create 3D text using high-quality canvas sprites
function createTextMesh(text, options = {}) {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');

	// High resolution for crisp text
	canvas.width = 2048;
	canvas.height = 1024;

	// Setup text rendering
	context.font = `Bold ${options.fontSize || 48}px Arial`;
	context.fillStyle = options.color ? `#${options.color.toString(16).padStart(6, '0')}` : '#ffffff';
	context.textAlign = 'left';
	context.textBaseline = 'top';

	// Word wrap the text
	const words = text.split(' ');
	const lines = [];
	let currentLine = '';
	const maxWidth = options.maxWidth || 1800;

	for (let i = 0; i < words.length; i++) {
		const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
		const metrics = context.measureText(testLine);
		if (metrics.width > maxWidth && currentLine) {
			lines.push(currentLine);
			currentLine = words[i];
		} else {
			currentLine = testLine;
		}
	}
	lines.push(currentLine);

	// Draw text lines
	const lineHeight = (options.fontSize || 48) * (options.lineHeight || 1.4);
	let totalHeight = 0;

	lines.forEach((line, index) => {
		const y = index * lineHeight;
		context.fillText(line, 20, y + 20);
		totalHeight = Math.max(totalHeight, y + lineHeight);
	});

	// Create texture and sprite
	const texture = new THREE.CanvasTexture(canvas);
	texture.anisotropy = 4;
	texture.generateMipmaps = false;

	const spriteMaterial = new THREE.SpriteMaterial({
		map: texture,
		transparent: true,
		alphaTest: 0.1
	});

	const sprite = new THREE.Sprite(spriteMaterial);

	// Scale sprite appropriately
	const aspectRatio = canvas.width / canvas.height;
	const scaleFactor = options.scale || 8;
	sprite.scale.set(scaleFactor * aspectRatio, scaleFactor, 1);

	return sprite;
}

function createRoundedRectGeometry(width, height, radius, segments = 6) {
	const shape = new THREE.Shape();
	const hw = width / 2;
	const hh = height / 2;
	const r = Math.min(radius, hw, hh);
	shape.moveTo(-hw + r, -hh);
	shape.lineTo(hw - r, -hh);
	shape.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0, false);
	shape.lineTo(hw, hh - r);
	shape.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false);
	shape.lineTo(-hw + r, hh);
	shape.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false);
	shape.lineTo(-hw, -hh + r);
	shape.absarc(-hw + r, -hh + r, r, Math.PI, 1.5 * Math.PI, false);
	return new THREE.ShapeGeometry(shape, segments);
}

// Create 3D modal for buoy content
export function createBuoyModal(buoy, content, THREE) {
	const modalGroup = new THREE.Group();

	// Grey rounded background
	const bgGeometry = createRoundedRectGeometry(30, 20, 1.6, 8);
	const bgMaterial = new THREE.MeshBasicMaterial({
		color: 0x222629, // dark grey
		transparent: true,
		opacity: 0.92,
		side: THREE.DoubleSide
	});
	const background = new THREE.Mesh(bgGeometry, bgMaterial);
	modalGroup.add(background);

	// Subtle grey border using a slightly larger rounded rect outline
	const outlineGeometry = createRoundedRectGeometry(30.6, 20.6, 1.8, 8);
	const outlineMaterial = new THREE.MeshBasicMaterial({
		color: 0x3a3f44,
		transparent: true,
		opacity: 0.35,
		side: THREE.DoubleSide,
		wireframe: true
	});
	const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
	outline.position.z = -0.01;
	modalGroup.add(outline);

	// Add big, readable text content using high-quality canvas sprites
	const titleText = createTextMesh(content.title, {
		fontSize: 64,
		maxWidth: 1800,
		color: 0xffffff,
		scale: 12
	});
	titleText.position.set(-14, 8, 0.1);
	modalGroup.add(titleText);

	const problemText = createTextMesh('PROBLEM:\n' + content.problem, {
		fontSize: 48,
		maxWidth: 1800,
		lineHeight: 1.6,
		color: 0xcfd6de,
		scale: 10
	});
	problemText.position.set(-14, 4.5, 0.1);
	modalGroup.add(problemText);

	const timelineText = createTextMesh('TIMELINE:\n' + content.timeline, {
		fontSize: 44,
		maxWidth: 1800,
		lineHeight: 1.6,
		color: 0xffd857,
		scale: 9
	});
	timelineText.position.set(-14, 1, 0.1);
	modalGroup.add(timelineText);

	const solutionText = createTextMesh('SOLUTION:\n' + content.solution, {
		fontSize: 48,
		maxWidth: 1800,
		lineHeight: 1.6,
		color: 0x9ff59f,
		scale: 10
	});
	solutionText.position.set(-14, -3, 0.1);
	modalGroup.add(solutionText);

	const tagsText = createTextMesh('TAGS:\n' + content.tags.join(', '), {
		fontSize: 40,
		maxWidth: 1800,
		lineHeight: 1.6,
		color: 0xff9a9a,
		scale: 8
	});
	tagsText.position.set(-14, -6.5, 0.1);
	modalGroup.add(tagsText);

	// Position modal high above buoy
	modalGroup.position.copy(buoy.position);
	modalGroup.position.y += 25;
	modalGroup.lookAt(buoy.position.x, buoy.position.y + 20, buoy.position.z - 1);

	// Store modal data
	modalGroup.userData = {
		buoy: buoy,
		content: content,
		type: 'modal'
	};

	return modalGroup;
}

// Show buoy information modal
export function showBuoyModal(buoy, content, THREE, scene) {
	// Hide existing modal if any
	if (activeModal) {
		scene.remove(activeModal);
		activeModal = null;
	}

	// Create and show new modal
	activeModal = createBuoyModal(buoy, content, THREE);
	scene.add(activeModal);
}

// Hide current modal
export function hideBuoyModal(scene) {
	if (activeModal) {
		scene.remove(activeModal);
		activeModal = null;
	}
}

// Update modal position/orientation
export function updateModal(camera, THREE) {
	if (activeModal) {
		// Make modal face camera
		activeModal.lookAt(camera.position);
		// Keep modal above its buoy at higher elevation
		const buoy = activeModal.userData.buoy;
		activeModal.position.x = buoy.position.x;
		activeModal.position.z = buoy.position.z;
		activeModal.position.y = buoy.position.y + 25;
	}
}
