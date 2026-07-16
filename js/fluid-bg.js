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
    precision highp float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform vec2 u_mouse;   // 0..1, y up
    uniform float u_mstr;   // mouse energy 0..~1

    /* precision-safe hash (no giant sin multipliers → no grid artifacts) */
    float hash(vec2 p){
      p = fract(p * vec2(123.34, 345.45));
      p += dot(p, p + 34.345);
      return fract(p.x * p.y);
    }
    /* value noise with quintic interpolation → buttery gradients */
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    /* 3 low-frequency octaves — large smooth blobs, no grain */
    float fbm(vec2 p){
      float v = 0.5 * noise(p);
      v += 0.3 * noise(p * 1.9 + vec2(11.0, 7.0));
      v += 0.2 * noise(p * 3.4 + vec2(3.0, 21.0));
      return v;
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      float aspect = u_res.x / u_res.y;
      vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 2.2;
      float t = u_time * 0.05;

      /* big smooth cursor lens — a circle, not a point */
      vec2 mpos = (u_mouse - 0.5) * vec2(aspect, 1.0) * 2.2;
      vec2 dm = p - mpos;
      float dist = length(dm);
      float R = 0.55;
      float lens = 1.0 - smoothstep(0.0, R, dist);
      lens = lens * lens;
      float energy = 0.35 + u_mstr;

      /* smooth domain warp */
      vec2 q = vec2(fbm(p * 0.8 + vec2(0.0, t)),
                    fbm(p * 0.8 + vec2(3.7, -t * 0.8)));
      vec2 w = p + 1.8 * (q - 0.5);
      /* the lens refracts the field outward */
      w += (dm / max(dist, 0.001)) * lens * 0.5 * energy;

      float m = fbm(w * 0.55 + t * 0.35);          /* zone mask: warm vs cool */
      float f = fbm(w * 1.05 - t * 0.25 + q * 0.6); /* shading inside zones */

      /* palette — site identity, risk structure */
      vec3 nightNavy = vec3(0.02, 0.07, 0.16);
      vec3 steel     = vec3(0.15, 0.33, 0.52);
      vec3 sky       = vec3(0.34, 0.56, 0.76);
      vec3 ember     = vec3(0.38, 0.08, 0.02);
      vec3 amber     = vec3(0.85, 0.42, 0.10);
      vec3 cream     = vec3(0.94, 0.87, 0.73);   /* #e6d5bb-ish */

      vec3 cool = mix(nightNavy, steel, smoothstep(0.30, 0.62, f));
      cool = mix(cool, sky, smoothstep(0.62, 0.85, f));
      vec3 warm = mix(ember, amber, smoothstep(0.35, 0.62, f));
      warm = mix(warm, cream, smoothstep(0.70, 0.92, f));

      float zone = smoothstep(0.42, 0.58, m);
      vec3 col = mix(cool, warm, zone);

      /* molten rim where the two zones meet — the signature glow */
      float b = m - 0.5;
      float rim = exp(-b * b * 160.0);
      col = mix(col, vec3(1.0, 0.45, 0.08), rim * 0.8);
      col = mix(col, cream, rim * rim * 0.45);

      /* deep shadow pockets keep the type readable */
      float pocket = smoothstep(0.60, 0.28, f) * (1.0 - rim);
      col *= mix(1.0, 0.10, pocket * 0.85);

      /* faint visible ring at the lens edge (like the reference) */
      float ring = exp(-pow((dist - R * 0.8) * 14.0, 2.0)) * energy * 0.30;
      col += cream * ring;

      /* gentle vignette */
      vec2 vg = uv - 0.5;
      col *= 1.0 - dot(vg, vg) * 0.55;

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
  const SCALE = 0.6;
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
    gl.uniform1f(uMstr, reduced ? 0 : mouse.str); /* baseline lens lives in the shader */
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
