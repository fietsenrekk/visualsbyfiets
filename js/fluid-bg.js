/* ============================================================
   FLUID BG — the "puddle": a domain-warped fluid gradient that
   drifts on its own and swirls around the cursor. Pure WebGL,
   no dependencies. Palette-locked to the site: black, bronze,
   molten amber, cream #e6d5bb, and a deep slate-blue counter-
   tone (the cool side of the risk reference).

   Mounts itself as a fixed full-screen canvas behind the page.
   Include this script on any page; nothing else needed.
   ============================================================ */

(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.createElement("canvas");
  canvas.className = "fluid-bg";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;";
  document.body.insertBefore(canvas, document.body.firstChild);

  const gl = canvas.getContext("webgl", {
    alpha: false, antialias: false, depth: false, stencil: false,
    powerPreference: "high-performance"
  });
  if (!gl) { canvas.remove(); return; }

  const VERT = `
    attribute vec2 a;
    void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

  const FRAG = `
    precision mediump float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform vec2 u_mouse;   // 0..1, y up
    uniform float u_mstr;   // mouse energy 0..~1

    float hash(vec2 p){
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++){
        v += a * noise(p);
        p = p * 2.03 + vec2(17.0, 9.0);
        a *= 0.5;
      }
      return v;
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      float aspect = u_res.x / u_res.y;
      vec2 p = vec2(uv.x * aspect, uv.y) * 1.6;
      float t = u_time * 0.045;

      /* cursor swirl: local push of the warp domain */
      vec2 mp = vec2(u_mouse.x * aspect, u_mouse.y) * 1.6;
      vec2 dm = p - mp;
      float md = length(dm);
      float minf = exp(-md * md * 3.5) * u_mstr;

      /* Inigo-Quilez-style double domain warp */
      vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t * 0.8));
      vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 1.4),
                    fbm(p + 3.2 * q + vec2(8.3, 2.8) - t));
      r += normalize(dm + 0.0001) * minf * 0.9;
      r += vec2(-dm.y, dm.x) * minf * 0.7;   /* rotational component */

      float f = fbm(p + 3.0 * r);
      float hue = fbm(p * 0.5 + q * 0.8 - t * 0.5); /* warm vs cool regions */

      /* palette */
      vec3 black  = vec3(0.0);
      vec3 bronze = vec3(0.16, 0.10, 0.04);
      vec3 amber  = vec3(0.76, 0.45, 0.13);
      vec3 cream  = vec3(0.90, 0.84, 0.73);   /* #e6d5bb */
      vec3 slate  = vec3(0.07, 0.16, 0.30);
      vec3 iceblu = vec3(0.32, 0.48, 0.62);

      vec3 warm = mix(bronze, amber, smoothstep(0.42, 0.62, f));
      warm = mix(warm, cream, smoothstep(0.64, 0.80, f));
      vec3 cool = mix(slate * 0.7, slate, smoothstep(0.38, 0.55, f));
      cool = mix(cool, iceblu, smoothstep(0.60, 0.78, f));

      vec3 ribbon = mix(cool, warm, smoothstep(0.35, 0.65, hue));
      float body = smoothstep(0.30, 0.52, f);          /* dark dominates */
      vec3 col = mix(black, ribbon, body);

      /* cursor adds molten glow */
      col += warm * minf * 0.55 * body;

      /* vignette keeps edges quiet for the page chrome */
      vec2 vg = uv - 0.5;
      col *= 1.0 - dot(vg, vg) * 0.9;

      gl_FragColor = vec4(col, 1.0);
    }`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("fluid-bg shader:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.remove(); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "u_res");
  const uTime = gl.getUniformLocation(prog, "u_time");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");
  const uMstr = gl.getUniformLocation(prog, "u_mstr");

  /* render at reduced resolution — it's a soft gradient anyway */
  const SCALE = 0.5;
  function resize() {
    canvas.width = Math.max(2, Math.floor(innerWidth * SCALE));
    canvas.height = Math.max(2, Math.floor(innerHeight * SCALE));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener("resize", resize);

  /* mouse spring: position eases, energy builds with movement and decays */
  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, str: 0 };
  window.addEventListener("pointermove", (e) => {
    const nx = e.clientX / innerWidth;
    const ny = 1 - e.clientY / innerHeight;
    mouse.str = Math.min(1.1, mouse.str + Math.hypot(nx - mouse.tx, ny - mouse.ty) * 6);
    mouse.tx = nx; mouse.ty = ny;
  }, { passive: true });

  let raf, t0 = performance.now(), last = t0, elapsed = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;
    mouse.x += (mouse.tx - mouse.x) * 0.07;
    mouse.y += (mouse.ty - mouse.y) * 0.07;
    mouse.str *= Math.pow(0.35, dt);          /* energy decays in ~1s */
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reduced ? 0 : elapsed);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uMstr, reduced ? 0 : mouse.str + 0.12); /* faint idle life */
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else { last = performance.now(); raf = requestAnimationFrame(frame); }
  });

  /* debug/testing: render one frame at time t and sample pixels */
  window.__VBF_FLUID = {
    snapshot(t = 20, mstr = 0.8) {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, 0.5, 0.5);
      gl.uniform1f(uMstr, mstr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const w = canvas.width, h = canvas.height;
      const px = new Uint8Array(4);
      const samples = [];
      [[0.5, 0.5], [0.25, 0.6], [0.75, 0.4], [0.5, 0.25]].forEach(([x, y]) => {
        gl.readPixels(Math.floor(w * x), Math.floor(h * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        samples.push([px[0], px[1], px[2]]);
      });
      return samples;
    }
  };
})();
