/* ============================================================
   Chrome spinning VBF logo — Three.js hero
   Loaded as an ES module from index.html.
   Falls back to a static <img> if WebGL is unavailable.
   ============================================================ */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("hero-canvas");

function fallback() {
  if (!canvas) return;
  const img = document.createElement("img");
  img.src = "assets/img/logo-white.png";
  img.alt = "Visuals by Fiets";
  img.style.cssText =
    "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(520px,70vw);opacity:.9;";
  canvas.replaceWith(img);
}

try {
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: true, powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  // studio reflections → the chrome look
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const loader = new THREE.TextureLoader();
  const logoTex = loader.load("assets/img/logo-white.png");
  logoTex.colorSpace = THREE.SRGBColorSpace;
  logoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const maskTex = loader.load("assets/img/logo-mask.png");

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.16,
    transparent: true,
    map: logoTex,          // PNG alpha provides the cutout
    alphaTest: 0.15,
    bumpMap: maskTex,      // blurred mask fakes a beveled edge
    bumpScale: 6,
    side: THREE.DoubleSide,
    envMapIntensity: 1.6
  });

  // slightly curved plane so reflections sweep across the face
  const geo = new THREE.PlaneGeometry(5.4, 5.4, 64, 64);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, Math.sin((x / 5.4) * Math.PI) * 0.22);
  }
  geo.computeVertexNormals();

  const logo = new THREE.Mesh(geo, mat);
  scene.add(logo);

  // rim lights for extra pop
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe6d5bb, 0.7);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  // floating chrome particles
  const pGeo = new THREE.BufferGeometry();
  const N = 90;
  const pts = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i += 3) {
    pts[i] = (Math.random() - 0.5) * 16;
    pts[i + 1] = (Math.random() - 0.5) * 10;
    pts[i + 2] = -2 - Math.random() * 6;
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x8a8a85, size: 0.025, transparent: true, opacity: 0.7
  }));
  scene.add(particles);

  // mouse parallax
  const target = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep logo fully visible on narrow screens
    camera.position.z = camera.aspect < 0.9 ? 9.5 : 7.2;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  let raf;
  function render() {
    const t = clock.getElapsedTime();
    logo.rotation.y = Math.sin(t * 0.55) * 0.85 + target.x * 0.25;
    logo.rotation.x = Math.sin(t * 0.4) * 0.07 + target.y * 0.14;
    logo.position.y = Math.sin(t * 0.8) * 0.12;
    particles.rotation.y = t * 0.02;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(render);
  }
  render();

  // pause when tab hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else render();
  });
} catch (err) {
  console.warn("WebGL unavailable, falling back to static logo", err);
  fallback();
}
