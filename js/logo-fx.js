/* ============================================================
   VBF LOGO FX — footer "signature scan".
   The Visuals by Fiets mark processed like a live telemetry
   feed: ordered-dither pixel matrix, sweeping scanlines,
   glitch-displaced blocks, chromatic split, drifting blocks in
   the background, cursor tracing that sharpens + ignites the
   pixels it passes over, and floating numeric readouts.

   Palette-locked to the site (gold ↔ violet, follows the theme
   engine). Self-contained WebGL + a DOM readout layer.
   Reduced-motion → single calm frame, no moving parts.
   ============================================================ */

(function () {
  "use strict";
  const containers = document.querySelectorAll("[data-logo-fx]");
  if (!containers.length) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LOGO_SRC = "assets/img/logo-white.png";
  const TRAIL = 8;

  /* theme → [deep, base, highlight] 0..1 rgb */
  const THEMES = {
    gold: {
      A: [0.180, 0.130, 0.055],
      B: [0.902, 0.835, 0.733],   // #e6d5bb
      C: [1.000, 0.965, 0.900]
    },
    violet: {
      A: [0.110, 0.060, 0.280],
      B: [0.725, 0.651, 1.000],   // #b9a6ff
      C: [0.945, 0.930, 1.000]
    }
  };
  const themeName = () =>
    document.documentElement.dataset.theme === "violet" ? "violet" : "gold";

  const VERT = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uLogo;
    uniform vec2  uUvMin;
    uniform vec2  uUvSize;
    uniform vec2  uRes;
    uniform float uTime;
    uniform vec3  uTrail[${TRAIL}];   // x, y, strength
    uniform vec3  uA; uniform vec3 uB; uniform vec3 uC;
    uniform float uReduced;

    float hash(vec2 p){ p = fract(p*vec2(123.34,345.45)); p += dot(p,p+34.345); return fract(p.x*p.y); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
      return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),
                 mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);
    }
    float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<3;i++){ v+=a*noise(p); p=p*2.03+vec2(11.0,7.0); a*=0.5;} return v; }

    /* ordered dither (analytic Bayer) — the pixel-matrix look */
    float bayer2(vec2 a){ a = floor(a); return fract(a.x/2.0 + a.y*a.y*0.75); }
    float bayer8(vec2 a){
      return bayer2(0.25*a)*0.0625 + bayer2(0.5*a)*0.25 + bayer2(a);
    }

    float logoAlpha(vec2 uv){
      vec2 s = uUvMin + clamp(uv, 0.0, 1.0) * uUvSize;
      return texture2D(uLogo, s).a;
    }

    void main(){
      float rm = 1.0 - uReduced;
      float t  = uTime;
      vec2 uv  = vUv;
      vec2 px  = gl_FragCoord.xy;

      /* ---- cursor trace: accumulate influence from the trail ---- */
      float trace = 0.0;
      vec2  traceDir = vec2(0.0);
      for (int i = 0; i < ${TRAIL}; i++) {
        vec2 tp = uTrail[i].xy;
        float s = uTrail[i].z;
        if (s <= 0.001) continue;
        float d = distance(uv, tp);
        float infl = exp(-d*d*70.0) * s;
        trace += infl;
        traceDir += normalize(uv - tp + 0.0001) * infl;
      }
      trace = clamp(trace, 0.0, 1.4);

      /* ---- glitch blocks: quantise uv, shove some blocks sideways ---- */
      vec2 bSize = vec2(0.075, 0.055);
      vec2 bId   = floor(uv / bSize);
      float bTick = floor(t * 3.0);
      float bh   = hash(bId + bTick * 1.37);
      float bActive = step(0.80, bh) * rm;               // ~20% of blocks
      vec2  bOff = vec2((hash(bId + 7.7) - 0.5) * 0.10,
                        (hash(bId + 3.1) - 0.5) * 0.025) * bActive;
      /* the cursor drags blocks too */
      bOff += traceDir * 0.05 * rm;

      /* ---- liquid flow underneath (kept subtle) ---- */
      vec2 flow = vec2(fbm(uv*3.0 + vec2(0.0, t*0.12)),
                       fbm(uv*3.0 + vec2(5.2, -t*0.12))) - 0.5;
      vec2 duv = uv + bOff + flow * (0.008 + 0.03 * trace) * rm;

      /* ---- chromatic split (stronger inside the trace) ---- */
      float ca = (0.0030 + 0.010 * trace) * rm;
      float aR = logoAlpha(duv + vec2(ca, 0.0));
      float aG = logoAlpha(duv);
      float aB = logoAlpha(duv - vec2(ca, 0.0));

      /* ---- shading value: metal gradient + flow ---- */
      float g = fbm(uv*2.2 + vec2(-t*0.20, t*0.14));
      g = clamp(g*0.9 + (uv.y - 0.15) * 0.55 + trace * 0.55, 0.0, 1.0);

      /* ---- pixel matrix: quantise to cells, then ordered-dither ---- */
      float cell = mix(4.0, 2.0, clamp(trace, 0.0, 1.0));   // sharper under the cursor
      vec2  cellId = floor(px / cell);
      float dith = bayer8(cellId);
      float cellG = clamp(g + (hash(cellId*0.017 + bTick*0.11) - 0.5) * 0.16, 0.0, 1.0);
      /* soft 1-bit-ish quantisation → visible dot grid, never full posterise */
      float lit = smoothstep(-0.10, 0.10, cellG - dith * 0.85);
      float shade = mix(cellG, mix(cellG * 0.45, 1.0, lit), 0.75);

      /* ---- scanlines + one bright sweeping line ---- */
      float lines = 0.80 + 0.20 * step(0.5, fract(px.y / 3.0));
      float sweepPos = fract(t * 0.10);
      float sweep = exp(-pow((fract(uv.y - sweepPos + 0.5) - 0.5) * 26.0, 2.0)) * rm;
      float sweep2 = exp(-pow((fract(uv.y - fract(t * 0.037 + 0.45) + 0.5) - 0.5) * 60.0, 2.0)) * rm;

      /* ---- colour from the palette ---- */
      vec3 col = mix(uA, uB, smoothstep(0.12, 0.58, shade));
      col = mix(col, uC, smoothstep(0.62, 0.98, shade));
      col *= lines;
      col += uC * (sweep * 0.35 + sweep2 * 0.55);
      col += uC * trace * 0.30;
      col.r *= 0.98 + (aR - aG) * 0.40;
      col.b *= 0.98 + (aB - aG) * 0.40;

      /* speckle: a few bright pixels riding the dither */
      float spark = step(0.9975, hash(cellId + floor(t * 8.0)));
      col += uC * spark * (0.35 + trace * 0.5);

      float alpha = aG;

      /* ---- background: faint drifting blocks outside the mark ---- */
      if (alpha < 0.02) {
        vec2 gSize = vec2(0.10, 0.075);
        vec2 gId = floor((uv + vec2(t * 0.010, -t * 0.006)) / gSize);
        float gh = hash(gId);
        float show = step(0.86, gh) * rm;
        float bgDith = step(bayer8(floor(px / 5.0)), 0.55);
        float bgA = show * bgDith * (0.030 + 0.10 * trace);
        if (bgA < 0.002) discard;
        vec3 bgCol = mix(uA, uB, 0.35 + 0.45 * hash(gId + 4.2)) * (0.6 + sweep);
        gl_FragColor = vec4(bgCol * bgA, bgA);
        return;
      }

      gl_FragColor = vec4(col * alpha, alpha);   // premultiplied
    }`;

  /* ---------- tight bounding box of the mark ---------- */
  function measureLogo(img) {
    const c = document.createElement("canvas");
    const w = c.width = img.naturalWidth;
    const h = c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
    try {
      const data = ctx.getImageData(0, 0, w, h).data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] > 24) {
            found = true;
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
      }
    } catch (e) { found = false; }
    if (!found) { minX = 0; minY = 0; maxX = w; maxY = h; }
    const pad = Math.round(Math.min(w, h) * 0.03);
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(w, maxX + pad); maxY = Math.min(h, maxY + pad);
    return {
      uvMin: [minX / w, 1 - maxY / h],
      uvSize: [(maxX - minX) / w, (maxY - minY) / h],
      aspect: (maxX - minX) / (maxY - minY)
    };
  }

  /* ---------- numeric readouts (the telemetry labels) ---------- */
  function buildReadouts(container) {
    const layer = document.createElement("div");
    layer.className = "logo-fx__readouts";
    layer.setAttribute("aria-hidden", "true");
    container.appendChild(layer);

    const SPOTS = [
      [0.09, 0.22], [0.20, 0.62], [0.33, 0.14], [0.44, 0.78],
      [0.57, 0.28], [0.66, 0.68], [0.78, 0.18], [0.88, 0.52],
      [0.15, 0.86], [0.72, 0.88]
    ];
    const labels = SPOTS.map(([x, y], i) => {
      const el = document.createElement("span");
      el.className = "logo-fx__num" + (i % 4 === 0 ? " is-boxed" : "");
      el.style.left = (x * 100).toFixed(1) + "%";
      el.style.top = (y * 100).toFixed(1) + "%";
      el.textContent = "0.0000";
      layer.appendChild(el);
      return { el, base: Math.random(), phase: Math.random() * Math.PI * 2, int: i % 3 === 0 };
    });

    let last = 0;
    return function update(now, trace) {
      if (now - last < 90) return;               // ~11 Hz: reads as instrumentation
      last = now;
      const t = now / 1000;
      labels.forEach((l, i) => {
        const wave = (Math.sin(t * 0.7 + l.phase) + 1) / 2;
        const v = (l.base * 0.6 + wave * 0.4 + trace * 0.25) % 1;
        l.el.textContent = l.int
          ? String(Math.round(1000 + v * 8999))
          : v.toFixed(4);
        const vis = 0.45 + wave * 0.40 + trace * 0.5;
        l.el.style.opacity = Math.min(1, vis).toFixed(2);
      });
    };
  }

  function initOne(container, img, box) {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);
    container.style.aspectRatio = box.aspect.toFixed(4);

    const gl = canvas.getContext("webgl", {
      alpha: true, premultipliedAlpha: true, antialias: false
    });
    if (!gl) { fallback(container); return; }

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("logo-fx:", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { fallback(container); return; }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    const U = {};
    ["uLogo", "uUvMin", "uUvSize", "uRes", "uTime", "uTrail", "uA", "uB", "uC", "uReduced"]
      .forEach(n => U[n] = gl.getUniformLocation(prog, n));

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(U.uLogo, 0);
    gl.uniform2fv(U.uUvMin, box.uvMin);
    gl.uniform2fv(U.uUvSize, box.uvSize);
    gl.uniform1f(U.uReduced, reduced ? 1 : 0);

    /* palette, tweened on theme change */
    const t0 = THEMES[themeName()];
    const cur = { A: t0.A.slice(), B: t0.B.slice(), C: t0.C.slice() };
    let tgt = t0;
    new MutationObserver(() => { tgt = THEMES[themeName()]; if (reduced) drawOnce(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    /* cursor trail */
    const trail = new Float32Array(TRAIL * 3);
    let traceLevel = 0;
    if (!reduced) {
      window.addEventListener("pointermove", (e) => {
        const r = container.getBoundingClientRect();
        const pad = 0.35;
        if (e.clientX < r.left - r.width * pad || e.clientX > r.right + r.width * pad ||
            e.clientY < r.top - r.height * pad || e.clientY > r.bottom + r.height * pad) return;
        const x = (e.clientX - r.left) / r.width;
        const y = 1 - (e.clientY - r.top) / r.height;
        // shift trail, newest first
        for (let i = TRAIL - 1; i > 0; i--) {
          trail[i * 3] = trail[(i - 1) * 3];
          trail[i * 3 + 1] = trail[(i - 1) * 3 + 1];
          trail[i * 3 + 2] = trail[(i - 1) * 3 + 2];
        }
        trail[0] = x; trail[1] = y; trail[2] = 1;
      }, { passive: true });
    }

    const updateReadouts = buildReadouts(container);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.round(container.clientWidth * dpr));
      const h = Math.max(2, Math.round(container.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }
    new ResizeObserver(resize).observe(container);
    resize();

    const start = performance.now();
    const lerp3 = (a, b, k) => { for (let i = 0; i < 3; i++) a[i] += (b[i] - a[i]) * k; };

    function draw(now) {
      resize();
      const t = reduced ? 2.5 : (now - start) / 1000;
      /* decay the trail */
      traceLevel = 0;
      if (!reduced) {
        for (let i = 0; i < TRAIL; i++) {
          trail[i * 3 + 2] *= 0.90 - i * 0.015;
          if (trail[i * 3 + 2] < 0.002) trail[i * 3 + 2] = 0;
          traceLevel = Math.max(traceLevel, trail[i * 3 + 2]);
        }
      }
      lerp3(cur.A, tgt.A, 0.08); lerp3(cur.B, tgt.B, 0.08); lerp3(cur.C, tgt.C, 0.08);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, t);
      gl.uniform3fv(U.uTrail, trail);
      gl.uniform3fv(U.uA, cur.A);
      gl.uniform3fv(U.uB, cur.B);
      gl.uniform3fv(U.uC, cur.C);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (pendingProbe) { pendingProbe(readPixelsNow()); pendingProbe = null; }
      updateReadouts(now, traceLevel);
    }

    /* read the framebuffer in the same frame as the draw (testing hook) */
    let pendingProbe = null;
    function readPixelsNow() {
      const w = canvas.width, h = canvas.height;
      const buf = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      let maxA = 0, maxL = 0, nonZero = 0, distinct = {};
      for (let i = 0; i < buf.length; i += 4) {
        const a = buf[i + 3];
        if (a > maxA) maxA = a;
        const l = (buf[i] + buf[i + 1] + buf[i + 2]) / 3;
        if (l > maxL) maxL = l;
        if (a > 8) {
          nonZero++;
          distinct[Math.round(l / 16)] = 1;
        }
      }
      return {
        maxA, maxL,
        coverage: +(nonZero / (w * h) * 100).toFixed(2),
        tonalSteps: Object.keys(distinct).length
      };
    }
    function drawOnce() { requestAnimationFrame(draw); }

    let raf = null, inView = true;
    const loop = (now) => { draw(now); raf = requestAnimationFrame(loop); };
    const play = () => { if (!raf && !reduced) raf = requestAnimationFrame(loop); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = null; } };

    if (reduced) {
      drawOnce();
    } else {
      new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
        if (inView && !document.hidden) play(); else stop();
      }, { threshold: 0.05 }).observe(container);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop(); else if (inView) play();
      });
      play();
    }

    window.__VBF_LOGOFX = {
      canvas,
      probe() {
        return new Promise(resolve => {
          pendingProbe = resolve;
          if (reduced) drawOnce();
        });
      },
      trace(x, y) { trail[0] = x; trail[1] = y; trail[2] = 1; },
      readouts: () => [...container.querySelectorAll(".logo-fx__num")]
        .map(el => el.textContent)
    };
  }

  function fallback(container) {
    const img = document.createElement("img");
    img.src = LOGO_SRC;
    img.alt = "Visuals by Fiets";
    img.style.cssText = "width:100%;height:auto;display:block;";
    container.appendChild(img);
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const box = measureLogo(img);
    containers.forEach(c => initOne(c, img, box));
  };
  img.onerror = () => containers.forEach(fallback);
  img.src = LOGO_SRC;
})();
