/* ============================================================
   VBF LOGO FX — the footer "signature": the main Visuals by
   Fiets mark rendered as flowing liquid metal in the site's
   own colorway, reacting to the cursor. Self-contained WebGL,
   no dependencies, theme-aware (recolors with gold ↔ violet),
   reduced-motion + no-WebGL fallbacks.

   Mounts on any <div data-logo-fx>. The logo texture is the
   transparent white mark (assets/img/logo-white.png); its
   tight bounding box is measured at load so the mark fills
   the frame with no dead margin.
   ============================================================ */

(function () {
  "use strict";
  const containers = document.querySelectorAll("[data-logo-fx]");
  if (!containers.length) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LOGO_SRC = "assets/img/logo-white.png";

  /* theme → [deep, base, highlight] as 0..1 rgb */
  const THEMES = {
    gold: {
      A: [0.227, 0.165, 0.071],  // bronze
      B: [0.902, 0.835, 0.733],  // beige #e6d5bb
      C: [1.000, 0.957, 0.878]   // warm cream
    },
    violet: {
      A: [0.141, 0.075, 0.329],  // deep indigo
      B: [0.725, 0.651, 1.000],  // lavender #b9a6ff
      C: [0.937, 0.918, 1.000]   // lilac highlight
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
    uniform vec2 uUvMin;
    uniform vec2 uUvSize;
    uniform float uTime;
    uniform vec2 uPointer;   // 0..1, y up
    uniform float uActive;   // pointer strength 0..1
    uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
    uniform float uReduced;

    float hash(vec2 p){ p = fract(p*vec2(123.34,345.45)); p += dot(p,p+34.345); return fract(p.x*p.y); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
      return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),
                 mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);
    }
    float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.03+vec2(11.0,7.0); a*=0.5;} return v; }

    void main(){
      vec2 uv = vUv;
      vec2 pp = uPointer;
      float pd = distance(uv, pp);
      float pinf = exp(-pd*pd*8.0) * uActive;
      float rm = 1.0 - uReduced;

      float t = uTime * 0.15;
      vec2 flow = vec2(fbm(uv*3.0 + vec2(0.0, t)), fbm(uv*3.0 + vec2(5.2, -t))) - 0.5;
      float amp = (0.010 + 0.05*pinf) * rm;
      vec2 disp = flow * amp;
      vec2 dir = normalize(uv - pp + 0.0001);
      disp += dir * pinf * 0.02 * rm;

      vec2 s = uUvMin + (uv + disp) * uUvSize;
      float ca = (0.0022 + 0.006*pinf) * rm;   // subtle liquid-glass split, stays in palette
      float aR = texture2D(uLogo, s + vec2(ca, 0.0)).a;
      float aG = texture2D(uLogo, s).a;
      float aB = texture2D(uLogo, s - vec2(ca, 0.0)).a;
      float alpha = aG;
      if (alpha < 0.01) discard;

      float g = fbm(uv*2.2 + vec2(-t*1.3, t));
      g = clamp(g + (uv.y - 0.2) * 0.5 + pinf * 0.6, 0.0, 1.0);
      vec3 col = mix(uA, uB, smoothstep(0.15, 0.55, g));
      col = mix(col, uC, smoothstep(0.60, 0.95, g));
      col.r *= 0.98 + (aR - aG) * 0.32;         // warm-side glint only
      col.b *= 0.98 + (aB - aG) * 0.32;
      col += uC * pinf * 0.35;

      gl_FragColor = vec4(col * alpha, alpha);  // premultiplied
    }`;

  /* measure the logo's tight bounding box (crop transparent margins) */
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
    const pad = Math.round(Math.min(w, h) * 0.02);
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(w, maxX + pad); maxY = Math.min(h, maxY + pad);
    return {
      uvMin: [minX / w, 1 - maxY / h],           // flip Y for GL
      uvSize: [(maxX - minX) / w, (maxY - minY) / h],
      aspect: (maxX - minX) / (maxY - minY)
    };
  }

  function initOne(container, img, box) {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);
    container.style.aspectRatio = box.aspect.toFixed(4);

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) { fallback(container); return; }

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
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
    ["uLogo", "uUvMin", "uUvSize", "uTime", "uPointer", "uActive", "uA", "uB", "uC", "uReduced"]
      .forEach(n => U[n] = gl.getUniformLocation(prog, n));

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(U.uLogo, 0);
    gl.uniform2fv(U.uUvMin, box.uvMin);
    gl.uniform2fv(U.uUvSize, box.uvSize);
    gl.uniform1f(U.uReduced, reduced ? 1 : 0);

    /* colors, tweened on theme change */
    const cur = { A: THEMES.gold.A.slice(), B: THEMES.gold.B.slice(), C: THEMES.gold.C.slice() };
    let tgt = THEMES[themeName()];
    // start already on the active theme (no first-frame flash)
    cur.A = tgt.A.slice(); cur.B = tgt.B.slice(); cur.C = tgt.C.slice();

    /* pointer */
    const ptr = { x: 0.5, y: 0.5, active: 0, targetActive: 0 };
    if (!reduced) {
      window.addEventListener("pointermove", (e) => {
        const r = container.getBoundingClientRect();
        const inside =
          e.clientX >= r.left - r.width * 0.4 && e.clientX <= r.right + r.width * 0.4 &&
          e.clientY >= r.top - r.height * 0.8 && e.clientY <= r.bottom + r.height * 0.8;
        ptr.x = (e.clientX - r.left) / r.width;
        ptr.y = 1 - (e.clientY - r.top) / r.height;
        ptr.targetActive = inside ? 1 : 0;
      }, { passive: true });
      window.addEventListener("pointerleave", () => { ptr.targetActive = 0; });
    }

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
    let raf = null, inView = true;

    function lerp3(a, b, k) { for (let i = 0; i < 3; i++) a[i] += (b[i] - a[i]) * k; }
    function render(now) {
      resize();
      const t = reduced ? 0 : (now - start) / 1000;
      ptr.active += (ptr.targetActive - ptr.active) * 0.08;
      lerp3(cur.A, tgt.A, 0.08); lerp3(cur.B, tgt.B, 0.08); lerp3(cur.C, tgt.C, 0.08);
      gl.uniform1f(U.uTime, t);
      gl.uniform2f(U.uPointer, ptr.x, ptr.y);
      gl.uniform1f(U.uActive, ptr.active);
      gl.uniform3fv(U.uA, cur.A);
      gl.uniform3fv(U.uB, cur.B);
      gl.uniform3fv(U.uC, cur.C);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop(now) { render(now); raf = requestAnimationFrame(loop); }

    function play() { if (!raf) { raf = requestAnimationFrame(loop); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    if (reduced) {
      render(performance.now());               // one static frame
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

    /* recolor with the theme engine (matches its ~0.9s cross-fade) */
    new MutationObserver(() => {
      tgt = THEMES[themeName()];
      if (reduced) {
        // short manual tween so reduced-motion still transitions smoothly
        let i = 0;
        const step = () => {
          lerp3(cur.A, tgt.A, 0.15); lerp3(cur.B, tgt.B, 0.15); lerp3(cur.C, tgt.C, 0.15);
          render(performance.now());
          if (i++ < 40) requestAnimationFrame(step);
        };
        step();
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  function fallback(container) {
    const img = document.createElement("img");
    img.src = LOGO_SRC;
    img.alt = "Visuals by Fiets";
    img.style.cssText = "width:100%;height:auto;display:block;";
    container.appendChild(img);
  }

  /* load once, mount everywhere */
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const box = measureLogo(img);
    containers.forEach(c => initOne(c, img, box));
  };
  img.onerror = () => containers.forEach(fallback);
  img.src = LOGO_SRC;
})();
