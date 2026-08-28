"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { isCaseStudyPath } from "@/lib/case-study-href";

const MAX_DPR = 2;
const SHOOTING_STAR_COUNT = 8;
const SHOOTING_STAR_LIFE = 2.15;

const VERTEX_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SRC = `
precision mediump float;

uniform float u_dpr;
uniform float u_time;
uniform float u_twinkle;
uniform vec2  u_resolution;
uniform vec2  u_mouse;
uniform float u_mouseActive;
uniform vec2  u_starOrigin[8];
uniform vec2  u_starDir[8];
uniform float u_starAge[8];

const vec3 SKY = vec3(0.027, 0.024, 0.047);

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float n = hash21(p);
  return vec2(n, hash21(p + n));
}

float softStar(vec2 px, float cell, float chance, float radiusPx, float t, vec2 mouseInfluence) {
  vec2 id = floor(px / cell);
  vec2 local = px - (id + 0.5) * cell;

  vec2 h = hash22(id);
  if (h.x > chance) return 0.0;

  vec2 offset = (h - 0.5) * (cell * 0.55);

  float distToMouse = length((id * cell + offset) - mouseInfluence);
  float pull = exp(-distToMouse * 0.004) * u_mouseActive * 18.0;
  offset += normalize(mouseInfluence - (id * cell)) * pull * 0.35;

  float d = length(local - offset);

  float core  = exp(-d * d / max(radiusPx * radiusPx * 0.22, 0.06));
  float halo  = exp(-d * d / max(radiusPx * radiusPx * 1.8,  0.4));
  float spark = exp(-d * d / max(radiusPx * 0.09, 0.03));

  float phase = h.y * 6.2831853;
  float rate  = 0.18 + h.x * 0.6;
  float tw    = 0.78 + 0.22 * sin(t * rate + phase);
  tw = mix(1.0, tw, u_twinkle);

  float mouseTw = 1.0 + 0.55 * exp(-distToMouse * 0.012) * u_mouseActive;
  tw *= mouseTw;

  float brightness = 0.42 + 0.58 * h.y;
  return (core * 0.55 + halo * 0.28 + spark * 0.22) * brightness * tw;
}

float dustLayer(vec2 px, float scale) {
  vec2 id = floor(px / scale);
  float n = hash21(id);
  return n * n;
}

float horizonGlow(vec2 uv) {
  float y = uv.y;
  float band = smoothstep(0.0, 0.22, y) * (1.0 - smoothstep(0.18, 0.55, y));
  float xVar = 0.85 + 0.15 * sin(uv.x * 3.5 + u_time * 0.07);
  return band * xVar;
}

float shootingStar(vec2 uv, vec2 origin, vec2 dir, float age) {
  const float LIFE = 2.15;
  const float SPEED = 0.24;
  const float TAIL = 0.038;
  if (age < 0.0 || age > LIFE) return 0.0;

  float t = clamp(age / LIFE, 0.0, 1.0);
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 n = normalize(dir);
  vec2 head = origin * aspect + n * (t * SPEED);
  vec2 p = uv * aspect;
  vec2 delta = p - head;
  vec2 perp = vec2(-n.y, n.x);

  float along = -dot(delta, n);
  float across = abs(dot(delta, perp));
  float px = length(delta) * u_resolution.y;

  float point = exp(-px * px / (1.35 * max(u_dpr, 1.0)));

  float tailT = clamp(along / TAIL, 0.0, 1.0);
  float inTail = step(0.0, along) * step(along, TAIL);
  float tailFade = (1.0 - tailT);
  tailFade *= tailFade * tailFade;
  float tailWidth = mix(0.9, 2.8, tailT) * max(u_dpr, 1.0);
  float tail = inTail * tailFade * exp(-(across * u_resolution.y) / tailWidth);

  float fade = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.72, 1.0, t));
  return (point * 1.45 + tail * 0.5) * fade;
}

void main() {
  vec2 px = gl_FragCoord.xy / max(u_dpr, 1.0);
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time;

  vec2 mousePx = u_mouse * u_resolution / max(u_dpr, 1.0);

  float dust   = softStar(px,                22.0, 0.09,  0.55, t, mousePx);
  float mid    = softStar(px + vec2(13.0, 7.0), 48.0, 0.06,  1.05, t, mousePx);
  float bright = softStar(px + vec2(37.0,19.0), 96.0, 0.032, 1.65, t, mousePx);
  float rare   = softStar(px + vec2(61.0,41.0), 170.0, 0.018, 2.4,  t, mousePx);
  float deep   = softStar(px + vec2(91.0,53.0), 280.0, 0.012, 3.1,  t, mousePx);

  float micro  = dustLayer(px * 0.7 + t * 2.0, 9.0) * 0.018;

  vec3 color = SKY;

  float n = hash21(floor(px * 0.31));
  color += vec3(0.015, 0.013, 0.028) * n;

  color += vec3(0.72, 0.80, 0.95) * dust   * 0.32;
  color += vec3(0.82, 0.88, 1.00) * mid    * 0.68;
  color += vec3(0.92, 0.95, 1.00) * bright * 1.05;
  color += vec3(0.95, 0.97, 1.00) * rare   * 1.25;
  color += vec3(0.85, 0.90, 1.00) * deep   * 0.9;

  color += vec3(0.55, 0.62, 0.85) * micro;

  float hGlow = horizonGlow(uv);
  vec3 warm = vec3(1.0, 0.28, 0.08) * 0.55 + vec3(1.0, 0.55, 0.15) * 0.35;
  color += warm * hGlow * 0.85;

  color *= 0.88 + 0.12 * smoothstep(0.0, 0.65, uv.y);

  float ss = 0.0;
  for (int i = 0; i < 8; i++) {
    ss += shootingStar(uv, u_starOrigin[i], u_starDir[i], u_starAge[i]);
  }
  color += vec3(0.84, 0.91, 1.0) * ss * 0.78;

  float breathe = 1.0 + 0.012 * sin(t * 0.15);
  color *= breathe;

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
  if (!vert || !frag) {
    if (vert) gl.deleteShader(vert);
    if (frag) gl.deleteShader(frag);
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    return null;
  }
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function StarfieldBackground() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visible = theme === "dark" && !isCaseStudyPath(pathname);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const syncRef = useRef<(() => void) | null>(null);
  const [contextGeneration, setContextGeneration] = useState(0);

  // Acquire WebGL once per canvas node. Never call WEBGL_lose_context on this
  // element: a lost context cannot be replaced, so the next dark-mode visit
  // would fade in a blank opaque canvas over the page.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    if (gl.isContextLost()) {
      setContextGeneration((generation) => generation + 1);
      return;
    }

    const program = createProgram(gl);
    if (!program) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const aPosition = gl.getAttribLocation(program, "a_position");
    const uDpr = gl.getUniformLocation(program, "u_dpr");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uTwinkle = gl.getUniformLocation(program, "u_twinkle");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uMouseActive = gl.getUniformLocation(program, "u_mouseActive");
    const uStarOrigin = gl.getUniformLocation(program, "u_starOrigin[0]");
    const uStarDir = gl.getUniformLocation(program, "u_starDir[0]");
    const uStarAge = gl.getUniformLocation(program, "u_starAge[0]");

    gl.useProgram(program);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;

    let rafId = 0;
    let running = false;
    let disposed = false;
    const startedAt = performance.now();
    let dpr = 1;

    let mouseX = 0.5;
    let mouseY = 0.5;
    let mouseActive = 0;
    let targetMouseActive = 0;

    const starOrigins = new Float32Array(SHOOTING_STAR_COUNT * 2);
    const starDirs = new Float32Array(SHOOTING_STAR_COUNT * 2);
    const starAges = new Float32Array(SHOOTING_STAR_COUNT);
    const stars: {
      x: number;
      y: number;
      dx: number;
      dy: number;
      startedAt: number;
    }[] = [];

    const spawnShootingStar = (clientX: number, clientY: number) => {
      const yaw = (Math.random() * 2 - 1) * 0.7;
      const next = {
        x: clientX / window.innerWidth,
        y: 1.0 - clientY / window.innerHeight,
        dx: Math.sin(yaw),
        dy: -Math.cos(yaw),
        startedAt: performance.now(),
      };
      if (stars.length < SHOOTING_STAR_COUNT) {
        stars.push(next);
        return;
      }
      let oldest = 0;
      for (let i = 1; i < stars.length; i++) {
        if (stars[i].startedAt < stars[oldest].startedAt) oldest = i;
      }
      stars[oldest] = next;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.max(1, Math.floor(window.innerWidth * dpr));
      const height = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const draw = (now: number) => {
      if (disposed || gl.isContextLost()) return;
      resize();

      const time = reducedMotion ? 0 : (now - startedAt) * 0.001;
      mouseActive += (targetMouseActive - mouseActive) * 0.06;

      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uTwinkle, reducedMotion ? 0 : 1);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.uniform1f(uMouseActive, reducedMotion ? 0 : mouseActive);

      starOrigins.fill(0);
      starDirs.fill(0);
      starAges.fill(SHOOTING_STAR_LIFE + 1);
      if (!reducedMotion) {
        const expiry = SHOOTING_STAR_LIFE * 1000;
        for (let i = stars.length - 1; i >= 0; i--) {
          if (now - stars[i].startedAt > expiry) stars.splice(i, 1);
        }
        for (let i = 0; i < stars.length; i++) {
          const star = stars[i];
          starOrigins[i * 2] = star.x;
          starOrigins[i * 2 + 1] = star.y;
          starDirs[i * 2] = star.dx;
          starDirs[i * 2 + 1] = star.dy;
          starAges[i] = (now - star.startedAt) * 0.001;
        }
      }
      gl.uniform2fv(uStarOrigin, starOrigins);
      gl.uniform2fv(uStarDir, starDirs);
      gl.uniform1fv(uStarAge, starAges);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const loop = (now: number) => {
      if (!running || disposed) return;
      draw(now);
      rafId = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const sync = () => {
      if (disposed) return;
      const shouldAnimate =
        !document.hidden && !reducedMotion && visibleRef.current;
      if (shouldAnimate) {
        if (!running) {
          running = true;
          rafId = requestAnimationFrame(loop);
        }
        return;
      }
      stop();
      if (visibleRef.current) {
        draw(performance.now());
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = 1.0 - e.clientY / window.innerHeight;
      targetMouseActive = 1;
    };

    const onPointerLeave = () => {
      targetMouseActive = 0;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (reducedMotion) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (
        target.closest(
          "a, button, article, nav, header, [role='dialog'], [role='tab']",
        )
      ) {
        return;
      }
      spawnShootingStar(e.clientX, e.clientY);
    };

    const onVisibility = () => sync();
    const onMotionChange = () => {
      reducedMotion = motionQuery.matches;
      sync();
    };
    const onResize = () => {
      if (!running) draw(performance.now());
    };
    const onContextLost = () => {
      stop();
      setContextGeneration((generation) => generation + 1);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    motionQuery.addEventListener("change", onMotionChange);
    canvas.addEventListener("webglcontextlost", onContextLost);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointerdown", onPointerDown);

    syncRef.current = sync;
    sync();

    return () => {
      disposed = true;
      syncRef.current = null;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      motionQuery.removeEventListener("change", onMotionChange);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointerdown", onPointerDown);

      if (!gl.isContextLost()) {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      }
    };
  }, [contextGeneration]);

  useEffect(() => {
    syncRef.current?.();
  }, [visible]);

  return (
    <canvas
      ref={canvasRef}
      key={contextGeneration}
      className="starfield-bg"
      data-visible={visible ? "true" : "false"}
      aria-hidden
      tabIndex={-1}
    />
  );
}