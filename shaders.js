export const vertexShader = `
	uniform float uTime;
	uniform float uAmplitude;
	uniform float uFrequency;
	uniform float uSpeed;
	uniform float uFogNear;
	uniform float uFogFar;
	uniform float uSpanHalf;   // half of grid span in world units
	uniform float uFadeWidth;  // fade width inward from edges (world units)
	// Shimmer (visual-only) controls
	uniform float uShimmerAmp;
	uniform float uShimmerFreq;
	uniform float uShimmerSpeed;
	// Crest-only micro ripple controls
	uniform float uRippleAmp;
	uniform float uRippleFreq;
	uniform float uRippleSpeed;
	uniform float uCrestLow;
	uniform float uCrestHigh;
	// Gerstner waves (multi-directional)
	const int WAVE_COUNT = 7;
	uniform vec2 uWaveDir[WAVE_COUNT];
	uniform float uWaveAmp[WAVE_COUNT];
	uniform float uWaveLen[WAVE_COUNT];
	uniform float uWaveSpeed[WAVE_COUNT];
	uniform float uWaveSteep[WAVE_COUNT];
	uniform float uWavePhase[WAVE_COUNT]; // per-wave static phase offset
	// Group mask (two-layer value noise like the article)
	uniform float uGroupStrength; // 0..1 how strongly to apply mask
	uniform float uGroupFreq;     // layer 1 spatial frequency
	uniform vec2 uGroupVel;       // layer 1 velocity
	uniform float uGroupFreq2;    // layer 2 spatial frequency
	uniform vec2 uGroupVel2;      // layer 2 velocity (moves opposite)
	// Domain warp controls
	uniform float uWarpAmp;
	uniform float uWarpFreq;
	uniform vec2 uWarpVel;
	// Tiny phase-noise field (option 2)
	uniform float uPhaseNoiseAmp;
	uniform float uPhaseNoiseFreq;
	uniform vec2 uPhaseNoiseVel;

	varying float vGray;
	varying float vFogFactor;
	varying float vEdge;       // edge fade factor
	varying float vShimmer;    // for fragment brightness modulation

	// 2D value noise (cheap)
	float hash(vec2 p) {
		return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
	}
	float noise2(vec2 p) {
		vec2 i = floor(p);
		vec2 f = fract(p);
		float a = hash(i);
		float b = hash(i + vec2(1.0, 0.0));
		float c = hash(i + vec2(0.0, 1.0));
		float d = hash(i + vec2(1.0, 1.0));
		vec2 u = f * f * (3.0 - 2.0 * f);
		return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
	}

	void main() {
		vec3 pos = position;
		float t = uTime;

		// Two-layer value-noise mask (article-style), opposite scrolling
		vec2 g1 = pos.xz * uGroupFreq + t * uGroupVel;
		vec2 g2 = pos.xz * uGroupFreq2 - t * uGroupVel2;
		float m1 = noise2(g1);
		float m2 = noise2(g2);
		float M = smoothstep(0.25, 0.85, 0.5 * (m1 + m2));
		float group = mix(1.0, M, clamp(uGroupStrength, 0.0, 1.0));

		// Domain warp vector (tiny) for bending crest coordinates
		vec2 wCoord = pos.xz * uWarpFreq + t * uWarpVel;
		float wx = noise2(wCoord + vec2(12.3, 54.7)) - 0.5;
		float wz = noise2(wCoord + vec2(-32.1, 7.9)) - 0.5;
		vec2 warp = vec2(wx, wz) * uWarpAmp;

		// Tiny phase-noise field (per-location/time)
		float pn = (noise2(pos.xz * uPhaseNoiseFreq + t * uPhaseNoiseVel) - 0.5) * uPhaseNoiseAmp;

		// Sum of Gerstner waves with group mask on amplitude, sampled at warped coords
		vec3 disp = vec3(0.0);
		for (int i = 0; i < WAVE_COUNT; i++) {
			vec2 D = normalize(uWaveDir[i]);
			float k = 6.28318530718 / max(0.001, uWaveLen[i]); // 2*pi / lambda
			float phase = dot(D, pos.xz + warp) * k + t * uWaveSpeed[i] + uWavePhase[i] + pn;
			float A = uWaveAmp[i] * group * uAmplitude;
			float Q = uWaveSteep[i];
			disp.x += Q * A * D.x * cos(phase);
			disp.z += Q * A * D.y * cos(phase);
			disp.y += A * sin(phase);
		}
		pos.xz += disp.xz;
		pos.y  += disp.y;

		float hBase = disp.y;
		// Base grayscale from base height only (preserve texture look)
		vGray = clamp(hBase * 0.5 + 0.5, 0.0, 1.0);

		// Crest-only micro ripples: tiny high-frequency displacement on positive crests
		float crestMask = smoothstep(uCrestLow, uCrestHigh, max(hBase, 0.0));
		float rip = sin(pos.x * uRippleFreq + t * uRippleSpeed) *
		            sin(pos.z * (uRippleFreq * 1.21) - t * (uRippleSpeed * 0.83));
		pos.y += rip * uRippleAmp * crestMask;

		// Edge fade: compute distance to nearest edge and remap over fade width
		float distToEdgeX = uSpanHalf - abs(pos.x);
		float distToEdgeZ = uSpanHalf - abs(pos.z);
		float edgeDist = min(distToEdgeX, distToEdgeZ);
		vEdge = clamp(edgeDist / max(0.0001, uFadeWidth), 0.0, 1.0);

		vec4 mv = modelViewMatrix * vec4(pos, 1.0);
		float dist = length(mv.xyz);
		vFogFactor = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);

		// Shimmer factor (keep simple)
		float s = sin(dot(position.xz, vec2(uShimmerFreq, uShimmerFreq * 1.37)) + t * uShimmerSpeed);
		vShimmer = 1.5 + s * uShimmerAmp;

		// Point size
		float ps = 2.0 + abs(hBase) * 1.5;
		ps *= (120.0 / max(1.0, -mv.z));
		ps *= vShimmer;
		gl_PointSize = clamp(ps, 1.0, 6.0);

		gl_Position = projectionMatrix * mv;
	}
`;

export const fragmentShader = `
	uniform vec3 uFogColor;

	varying float vGray;
	varying float vFogFactor;
	varying float vEdge;
	varying float vShimmer;

	void main() {
		// Circular dot
		vec2 uv = gl_PointCoord - vec2(0.5);
		float r = length(uv);
		if (r > 0.5) discard;

		vec3 bw = vec3(vGray);
		vec3 color = mix(bw, uFogColor, vFogFactor);
		// subtle brightness shimmer
		color *= (1.0 + (vShimmer - 1.0) * 0.5);
		color *= vEdge; // fade to black near edges
		gl_FragColor = vec4(color, 1.0);
	}
`;
