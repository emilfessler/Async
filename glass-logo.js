import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function makeMask(image) {
  const canvas = document.createElement('canvas');
  canvas.width = 185;
  canvas.height = 129;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, 185, 129);
  context.drawImage(image, 0, 0, 185, 129, 0, 0, 185, 129);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function makeOpticalNormal() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const pixels = context.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const verticalFlow = x * 0.42 + Math.sin(y * 0.052) * 2.7 + Math.sin(y * 0.015) * 4.2;
      const nx = Math.sin(verticalFlow) * 0.62 + Math.sin(verticalFlow * 0.47 + 1.4) * 0.24;
      const ny = Math.cos(y * 0.065 + x * 0.012) * 0.13;
      pixels.data[index] = Math.round(128 + nx * 102);
      pixels.data[index + 1] = Math.round(128 + ny * 82);
      pixels.data[index + 2] = 248;
      pixels.data[index + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.28, 1);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function makeEnvironment() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const base = context.createLinearGradient(0, 0, 512, 256);
  base.addColorStop(0, '#01030a');
  base.addColorStop(0.24, '#0b2462');
  base.addColorStop(0.48, '#5a9fff');
  base.addColorStop(0.55, '#eaf6ff');
  base.addColorStop(0.63, '#153985');
  base.addColorStop(1, '#01030a');
  context.fillStyle = base;
  context.fillRect(0, 0, 512, 256);
  const flare = context.createRadialGradient(390, 54, 0, 390, 54, 145);
  flare.addColorStop(0, 'rgba(255,255,255,0.95)');
  flare.addColorStop(0.18, 'rgba(120,196,255,0.58)');
  flare.addColorStop(1, 'rgba(21,65,180,0)');
  context.fillStyle = flare;
  context.fillRect(0, 0, 512, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

async function attachGlass(host) {
  if (host.dataset.glassLogo === 'ready' || !host.c) return;
  host.dataset.glassLogo = 'ready';

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
  host.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (error) {
    canvas.remove();
    return;
  }

  const image = await loadImage('./assets/async-blanc.png').catch(() => null);
  if (!image || !host.isConnected) {
    renderer.dispose();
    canvas.remove();
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 7.5);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;

  const background = new THREE.CanvasTexture(host.c);
  background.colorSpace = THREE.SRGBColorSpace;
  background.minFilter = THREE.LinearFilter;
  background.magFilter = THREE.LinearFilter;
  background.generateMipmaps = false;
  scene.background = background;
  scene.environment = makeEnvironment();

  const mask = makeMask(image);
  const normal = makeOpticalNormal();
  const geometry = new THREE.PlaneGeometry(1, 129 / 185, 64, 44);
  const basePositions = geometry.attributes.position.array.slice();

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.97,
    alphaMap: mask,
    alphaTest: 0.055,
    side: THREE.DoubleSide,
    transmission: 1,
    thickness: 1.55,
    ior: 1.24,
    dispersion: 0.045,
    roughness: 0.055,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    specularIntensity: 1,
    specularColor: new THREE.Color(0xddecff),
    attenuationColor: new THREE.Color(0x6f9eff),
    attenuationDistance: 2.2,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.58, 0.21),
    depthWrite: false
  });

  const group = new THREE.Group();
  const front = new THREE.Mesh(geometry, glass);
  front.renderOrder = 12;
  group.add(front);

  const sideMaterial = new THREE.MeshBasicMaterial({
    color: 0x75b7ff,
    transparent: true,
    opacity: 0.024,
    alphaMap: mask,
    alphaTest: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  for (let layer = 1; layer <= 8; layer++) {
    const shell = new THREE.Mesh(geometry, sideMaterial);
    shell.position.z = -layer * 0.018;
    shell.renderOrder = 4 + layer;
    group.add(shell);
  }
  scene.add(group);

  const key = new THREE.PointLight(0xeef8ff, 42, 18, 1.4);
  key.position.set(3.8, 3.2, 5.2);
  scene.add(key);
  const blue = new THREE.PointLight(0x367cff, 34, 16, 1.6);
  blue.position.set(-3.2, -2.1, 3.4);
  scene.add(blue);
  scene.add(new THREE.AmbientLight(0x9bbcff, 0.42));

  let width = 0;
  let height = 0;
  let pointerX = 0;
  let pointerY = 0;
  let currentX = 0;
  let currentY = 0;
  let stopped = false;
  const start = performance.now();

  const resize = () => {
    const nextWidth = Math.max(1, host.clientWidth);
    const nextHeight = Math.max(1, host.clientHeight);
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
    const visibleWidth = visibleHeight * camera.aspect;
    const portrait = width < height;
    const logoWidth = Math.min(visibleWidth * (portrait ? 0.72 : 0.45), visibleHeight * 0.78);
    const logoHeight = logoWidth * 129 / 185;
    const rightMargin = visibleWidth * (portrait ? 0.045 : 0.072);
    const topMargin = visibleHeight * (portrait ? 0.18 : 0.145);
    group.scale.setScalar(logoWidth);
    group.position.x = visibleWidth * 0.5 - logoWidth * 0.5 - rightMargin;
    group.position.y = visibleHeight * 0.5 - logoHeight * 0.5 - topMargin;
  };

  host.addEventListener('pointermove', (event) => {
    const bounds = host.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
    pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
  }, { passive: true });
  host.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
  }, { passive: true });

  const render = (now) => {
    if (stopped || !host.isConnected) return;
    resize();
    const time = reducedMotion ? 0 : (now - start) / 1000;
    currentX += (pointerX - currentX) * 0.035;
    currentY += (pointerY - currentY) * 0.035;
    group.rotation.y = -0.24 + currentX * 0.16 + Math.sin(time * 0.22) * 0.018;
    group.rotation.x = 0.105 - currentY * 0.11 + Math.cos(time * 0.19) * 0.014;
    group.rotation.z = -0.018 + Math.sin(time * 0.13) * 0.008;
    group.position.z = Math.sin(time * 0.31) * 0.035;

    const position = geometry.attributes.position;
    for (let index = 0; index < position.array.length; index += 3) {
      const x = basePositions[index];
      const y = basePositions[index + 1];
      position.array[index] = x;
      position.array[index + 1] = y;
      position.array[index + 2] = reducedMotion ? 0 :
        Math.sin(y * 18 + time * 0.58) * 0.010 +
        Math.sin(x * 15 - time * 0.41) * 0.007 +
        Math.sin((x + y) * 29 + time * 0.27) * 0.003;
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    normal.offset.x = (time * 0.011) % 1;
    normal.offset.y = Math.sin(time * 0.08) * 0.018;
    background.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  requestAnimationFrame(render);
  window.addEventListener('pagehide', () => {
    stopped = true;
    observer.disconnect();
    renderer.dispose();
    geometry.dispose();
    glass.dispose();
    sideMaterial.dispose();
    mask.dispose();
    normal.dispose();
    background.dispose();
  }, { once: true });
}

function boot() {
  const hosts = [...document.querySelectorAll('async-arcs')];
  if (!hosts.length || hosts.some((host) => !host.c)) {
    requestAnimationFrame(boot);
    return;
  }
  hosts.forEach((host) => attachGlass(host));
}

boot();
