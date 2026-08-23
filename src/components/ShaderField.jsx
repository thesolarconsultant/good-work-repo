import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../lib/motion";

// Raw WebGL rather than three.js. This is one fullscreen triangle and a
// fragment shader — a 3D engine would be ~150kB to do nothing it does.
const VERT = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`;

// Domain-warped flow between the four brand colours. No texture, no noise
// lookup — cheap enough to run on integrated graphics.
const FRAG = `
precision mediump float;
uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;

vec3 BLUE    = vec3(0.200, 0.400, 1.000);
vec3 VIOLET  = vec3(0.478, 0.361, 1.000);
vec3 MAGENTA = vec3(1.000, 0.176, 0.702);
vec3 CORAL   = vec3(1.000, 0.420, 0.369);

float wave(vec2 uv, float t, float f, vec2 dir) {
  return sin(dot(uv, dir) * f + t);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 aspect = vec2(u_res.x / u_res.y, 1.0);
  vec2 p = uv * aspect;
  float t = u_time * 0.16;

  // The cursor pulls the field towards it, softly and with a long falloff.
  vec2 m = u_mouse * aspect;
  float pull = 0.20 / (0.16 + distance(p, m) * 1.5);
  p += (m - p) * pull * 0.30;

  // Two rounds of domain warping give the slow liquid drift.
  vec2 q = vec2(
    wave(p, t, 3.1, vec2(0.9, 0.4)),
    wave(p, t * 1.21, 2.6, vec2(-0.5, 0.9))
  );
  vec2 r = vec2(
    wave(p + q * 0.45, t * 0.83, 2.2, vec2(0.6, -0.8)),
    wave(p + q * 0.45, t * 1.05, 1.9, vec2(0.8, 0.7))
  );

  float a = 0.5 + 0.5 * r.x;
  float b = 0.5 + 0.5 * r.y;
  float d = 0.5 + 0.5 * wave(p + r * 0.5, t * 0.7, 1.4, vec2(1.0, 0.3));

  vec3 col = mix(BLUE, VIOLET, smoothstep(0.0, 1.0, a));
  col = mix(col, MAGENTA, smoothstep(0.15, 0.95, b));
  col = mix(col, CORAL, smoothstep(0.35, 1.0, d) * 0.75);

  // Washed most of the way to white. At full strength these are the brand
  // colours at their advertising weight, which turns a white page into a pink
  // one — the ground stays white and the colour is a tint moving across it.
  col = mix(vec3(1.0), col, 0.42);

  // Lightest over the column the type sits in, strongest out at the right
  // where there is nothing to read. Text legibility beats the light show.
  float alpha = 0.09 + 0.20 * smoothstep(0.18, 0.88, uv.x);

  gl_FragColor = vec4(col, alpha);
}
`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("shader:", gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

/**
 * The animated gradient field behind a hero.
 *
 * Renders nothing at all when WebGL is unavailable or the visitor has asked
 * for reduced motion — the CSS aurora underneath is the fallback, so the hero
 * never ends up blank.
 */
export default function ShaderField() {
  const canvasRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [wide, setWide] = useState(false);

  // Desktop only. The field reacts to a cursor that a phone does not have, and
  // phones have both the weakest GPUs and the battery to worry about — the CSS
  // aurora covers the hero there on its own.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced || !wide) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl");
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // One oversized triangle covers the viewport with no index buffer.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const mouse = { x: 0.5, y: 0.6 };
    const target = { x: 0.5, y: 0.6 };

    // Rendered at roughly a third of CSS pixels and scaled back up. The canvas
    // is behind a heavy CSS blur, so there is nothing in the output above that
    // frequency to lose — but a full-resolution buffer costs ~10x the fill and
    // pushes a much larger layer through the blur on every frame. On a 1440px
    // hero that is a 432px buffer instead of a 2160px one.
    const SCALE = 0.3;
    const resize = () => {
      const w = Math.max(2, Math.floor(canvas.clientWidth * SCALE));
      const h = Math.max(2, Math.floor(canvas.clientHeight * SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const onPointer = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = 1 - (e.clientY - r.top) / r.height;
    };

    let frame = 0;
    let running = false;
    let last = 0;
    const start = performance.now();
    // A field this slow says nothing at 60fps that it doesn't say at 30, and
    // halving the draws halves what it costs a weak GPU.
    const MIN_FRAME_MS = 1000 / 30;

    const draw = (now) => {
      if (!running) return;
      if (now - last < MIN_FRAME_MS) {
        frame = requestAnimationFrame(draw);
        return;
      }
      last = now;
      resize();
      // Ease towards the cursor so the field glides rather than snapping.
      mouse.x += (target.x - mouse.x) * 0.045;
      mouse.y += (target.y - mouse.y) * 0.045;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(draw);
    };

    // Never burn GPU on a hero that has scrolled away.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        frame = requestAnimationFrame(draw);
      } else if (!entry.isIntersecting) {
        running = false;
        cancelAnimationFrame(frame);
      }
    });
    observer.observe(canvas);

    window.addEventListener("pointermove", onPointer, { passive: true });

    // Tell the page a real field is running. The CSS aurora then holds still
    // instead of animating four blobs inside a 70px blur, which forces the
    // whole blurred layer to re-rasterise every frame — measured at roughly
    // half the frame budget on software rendering. One moving background
    // layer, not two. If this never fires (no WebGL, reduced motion, small
    // screen) the aurora keeps animating and remains the only motion there.
    document.documentElement.dataset.gwShader = "on";

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
      delete document.documentElement.dataset.gwShader;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduced, wide]);

  if (reduced || !wide) return null;
  return <canvas className="gw-shader" ref={canvasRef} aria-hidden="true" />;
}
