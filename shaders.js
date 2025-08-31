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

	// Spray displacement uniforms for dynamic trail effect (multiple segments)
const int MAX_TRAIL_SEGMENTS = 50;
uniform vec3 displacementPositions[MAX_TRAIL_SEGMENTS];
uniform float displacementHeights[MAX_TRAIL_SEGMENTS];
uniform float displacementRadii[MAX_TRAIL_SEGMENTS];
uniform vec3 displacementDirections[MAX_TRAIL_SEGMENTS]; // Direction for each trail segment

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

						// Dynamic spray displacement for multiple trail segments (V-shaped wake pattern)
			// Iterate through all active trail segments and apply their effects
		for (int i = 0; i < MAX_TRAIL_SEGMENTS; i++) {
			if (displacementHeights[i] > 0.01) {
				// Check if this particle is near the current trail segment
				vec3 displacementVector = pos - displacementPositions[i];
				float distanceToDisplacement = length(displacementVector.xz); // Only X,Z distance for water surface

				// If particle is within displacement radius, apply spray effect for this segment
				if (distanceToDisplacement < displacementRadii[i]) {
					// Calculate angle relative to trail segment direction for V-shaped wake trail
					vec2 toParticle = normalize(displacementVector.xz);
					vec2 trailDir2D = normalize(displacementDirections[i].xz);

					// Create V-shaped wake: only apply displacement to particles behind the boat
					float angleToTrailDir = acos(dot(toParticle, -trailDir2D)); // Angle from trail's reverse direction

					// V-shape: 90 degrees wide (45 degrees on each side of center line)
					float maxAngle = 3.14159 * 0.25; // 45 degrees in radians
					float trailStrength = 1.0 - smoothstep(0.0, maxAngle, abs(angleToTrailDir));

					// Only apply effect to particles behind the boat (within the V-shape)
					if (abs(angleToTrailDir) <= maxAngle) {
						// Distance falloff - stronger effect closer to trail segment
						float distanceFalloff = 1.0 - (distanceToDisplacement / displacementRadii[i]);
						distanceFalloff = smoothstep(0.0, 1.0, distanceFalloff);

						// Combine for final displacement strength, scaled by segment height
						float sprayStrength = trailStrength * distanceFalloff * (displacementHeights[i] / 3.0);
						sprayStrength = smoothstep(0.0, 1.0, sprayStrength);

						// Apply displacement for wake trail effect (turbo segments are more powerful)
						if (sprayStrength > 0.01) {
							// Determine if this is a turbo segment based on height (turbo segments are taller)
							bool isTurboSegment = displacementHeights[i] > 6.0; // Turbo segments start with height > 6.0

							// Turbo segments have much more dramatic displacement
							float verticalMultiplier = isTurboSegment ? 1.2 : 0.6; // Turbo: 2x more vertical lift
							float spreadMultiplier = isTurboSegment ? 1.5 : 0.8; // Turbo: 1.875x more spread
							float lateralMultiplier = isTurboSegment ? 0.8 : 0.4; // Turbo: 2x more lateral movement
							float variationMultiplier = isTurboSegment ? 0.4 : 0.2; // Turbo: 2x more variation

							// Vertical displacement (foam rising) - scaled by segment strength
							pos.y += displacementHeights[i] * sprayStrength * verticalMultiplier;

							// Horizontal displacement along wake direction
							vec2 wakeDir = -trailDir2D; // Opposite of trail direction
							float wakeSpread = sprayStrength * distanceToDisplacement * spreadMultiplier;
							pos.xz += wakeDir * wakeSpread;

							// Add lateral movement for realistic wake
							vec2 lateralDir = vec2(-trailDir2D.y, trailDir2D.x); // Perpendicular to wake direction
							float lateralAmount = sin(distanceToDisplacement * 4.0 + float(i)) * sprayStrength * lateralMultiplier;
							pos.xz += lateralDir * lateralAmount;

							// Wave-like vertical variation
							pos.y += sin(distanceToDisplacement * 3.0 + displacementPositions[i].x * 0.1 + float(i) * 0.5) * sprayStrength * variationMultiplier;
						}
					}
				}
			}
		}

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
