export const vertexShader = `
	uniform float uTime;
	uniform float uAmplitude;
	uniform float uFrequency;
	uniform float uSpeed;
	uniform float uFogNear;
	uniform float uFogFar;
	uniform float uSpanHalf;   // half of grid span in world units
	uniform float uFadeWidth;  // fade width inward from edges (world units)

	varying float vGray;
	varying float vFogFactor;
	varying float vEdge;       // edge fade factor

	float height(vec2 xz, float t) {
		float e = 0.0;
		e += sin(xz.x * uFrequency + t * uSpeed) * sin(xz.y * uFrequency + t * uSpeed) * uAmplitude;
		e += sin(xz.x * uFrequency * 2.1 + t * uSpeed * 1.3) * sin(xz.y * uFrequency * 1.7 + t * uSpeed * 0.8) * uAmplitude * 0.4;
		e += sin(xz.x * uFrequency * 0.7 - t * uSpeed * 2.0) * sin(xz.y * uFrequency * 0.9 + t * uSpeed * 1.6) * uAmplitude * 0.25;
		return e;
	}

	void main() {
		vec3 pos = position;
		float t = uTime;
		float h = height(pos.xz, t);
		pos.y += h;

		// Height to grayscale
		vGray = clamp(h * 0.5 + 0.5, 0.0, 1.0);

		// Edge fade: compute distance to nearest edge and remap over fade width
		float distToEdgeX = uSpanHalf - abs(pos.x);
		float distToEdgeZ = uSpanHalf - abs(pos.z);
		float edgeDist = min(distToEdgeX, distToEdgeZ);
		vEdge = clamp(edgeDist / max(0.0001, uFadeWidth), 0.0, 1.0);

		vec4 mv = modelViewMatrix * vec4(pos, 1.0);
		float dist = length(mv.xyz);
		vFogFactor = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);

		// Point size
		float ps = 2.0 + abs(h) * 1.5;
		ps *= (120.0 / max(1.0, -mv.z));
		gl_PointSize = clamp(ps, 1.0, 6.0);

		gl_Position = projectionMatrix * mv;
	}
`;

export const fragmentShader = `
	uniform vec3 uFogColor;

	varying float vGray;
	varying float vFogFactor;
	varying float vEdge;

	void main() {
		// Circular dot
		vec2 uv = gl_PointCoord - vec2(0.5);
		float r = length(uv);
		if (r > 0.5) discard;

		vec3 bw = vec3(vGray);
		vec3 color = mix(bw, uFogColor, vFogFactor);
		color *= vEdge; // fade to black near edges
		gl_FragColor = vec4(color, 1.0);
	}
`;
