// Wave sampling utilities for CPU-side Gerstner wave calculations
// These match the shader parameters for consistent boat floating
import * as THREE from 'three';

// Wave parameters (should match main.js)
let waveDirs, waveAmp, waveLen, waveSpeed, waveSteep, wavePhase;

// Initialize with wave parameters from main scene
export function initWaveSampling(dirs, amp, len, speed, steep, phase) {
	waveDirs = dirs;
	waveAmp = amp;
	waveLen = len;
	waveSpeed = speed;
	waveSteep = steep;
	wavePhase = phase;
}

// Wave sampling function for CPU-side calculations (matches shader)
export function sampleWaveHeight(position, time) {
	const x = position.x;
	const z = position.z;
	let height = 0;
	let dx = 0, dz = 0;

	// Use first 7 waves to match shader WAVE_COUNT
	const waveCount = Math.min(7, waveDirs.length);

	for (let i = 0; i < waveCount; i++) {
		const dir = waveDirs[i];
		const amp = waveAmp[i];
		const len = waveLen[i];
		const speed = waveSpeed[i];
		const steep = waveSteep[i];
		const phase = wavePhase[i];

		const k = 6.28318530718 / Math.max(0.001, len);
		const phaseVal = dir.x * x * k + dir.y * z * k + time * speed + phase;

		const cosPhase = Math.cos(phaseVal);
		const sinPhase = Math.sin(phaseVal);

		height += amp * sinPhase;
		dx += steep * amp * dir.x * cosPhase;
		dz += steep * amp * dir.y * cosPhase;
	}

	return { height, dx, dz };
}
