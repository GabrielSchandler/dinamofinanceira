import * as THREE from 'three';
import { Reflector } from './vendor/jsm/objects/Reflector.js';

// Periodic noise keeps the stone seamless, including in grazing-angle reflections.
function stoneTexture() {
  const size = 512;
  const pixels = new Uint8Array(size * size * 4);
  const hash = (x, y) => {
    let n = Math.imul(x + 37, 374761393) + Math.imul(y + 19, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const noise = (x, y, period) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(ix % period, iy % period);
    const b = hash((ix + 1) % period, iy % period);
    const c = hash(ix % period, (iy + 1) % period);
    const d = hash((ix + 1) % period, (iy + 1) % period);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const n = noise(x / size * 6, y / size * 6, 6) * 0.34
      + noise(x / size * 24, y / size * 24, 24) * 0.3
      + noise(x / size * 96, y / size * 96, 96) * 0.24
      + noise(x / size * 256, y / size * 256, 256) * 0.12;
    const value = Math.round(95 + n * 150);
    const i = (y * size + x) * 4;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    pixels[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function brushedTexture() {
  const size = 512;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 11;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const lines = Array.from({ length: size }, () => 190 + random() * 20);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const value = Math.round(lines[x] + random() * 6);
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    pixels[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function createSurfaces() {
  const stone = stoneTexture();
  const brushed = brushedTexture();
  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xefbc69, metalness: 1, roughness: 0.3,
    roughnessMap: brushed, bumpMap: brushed, bumpScale: 0.0003,
    clearcoat: 0,
  });
  const graphite = new THREE.MeshPhysicalMaterial({
    color: 0x151b1d, metalness: 0.2, roughness: 0.72, envMapIntensity: 0.45,
    map: stone, bumpMap: stone, bumpScale: 0.014, roughnessMap: stone,
    clearcoat: 0.08, clearcoatRoughness: 0.45,
  });
  const wallMap = stone.clone();
  wallMap.repeat.set(60, 24);
  const wall = new THREE.MeshStandardMaterial({
    color: 0x232a2d, roughness: 0.95, metalness: 0, envMapIntensity: 0.25,
    map: wallMap, bumpMap: wallMap, bumpScale: 0.055,
  });
  return { gold, graphite, wall, stone, brushed };
}

export function studioEnvironment(renderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x242627);
  const panel = (w, h, color, intensity, position) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide,
    }));
    mesh.position.set(...position);
    mesh.lookAt(0, 2, 0);
    studio.add(mesh);
  };
  panel(10, 7, 0xfff5e5, 2.2, [-4, 9, 7]);
  panel(4, 13, 0xffffff, 3.0, [-9, 4, 4]);
  panel(3, 12, 0xffdfb1, 2.5, [10, 5, 2]);
  panel(9, 3, 0xfff3df, 1.6, [0, 1, 12]);
  panel(9, 5, 0xfff1dc, 1.5, [-6, -3, 9]);
  panel(4, 10, 0x050606, 1, [4, 4, 10]);
  panel(12, 4, 0xffdca3, 1.7, [0, 7, -8]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(studio, 0.04).texture;
  pmrem.dispose();
  studio.traverse((object) => {
    object.geometry?.dispose();
    object.material?.dispose();
  });
  return texture;
}

export function createStoneFloor(stone, mobile) {
  const resolution = mobile ? 512 : 1024;
  const floor = new Reflector(new THREE.PlaneGeometry(140, 40), {
    textureWidth: resolution, textureHeight: resolution, multisample: 0,
    clipBias: 0.001,
    shader: {
      uniforms: {
        color: { value: new THREE.Color(0x222827) },
        tDiffuse: { value: null },
        textureMatrix: { value: new THREE.Matrix4() },
        stoneMap: { value: stone },
      },
      vertexShader: `
        uniform mat4 textureMatrix;
        varying vec4 reflectionUv;
        varying vec3 worldPoint;
        #include <common>
        #include <logdepthbuf_pars_vertex>
        void main() {
          reflectionUv = textureMatrix * vec4(position, 1.0);
          worldPoint = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D stoneMap;
        uniform vec3 color;
        varying vec4 reflectionUv;
        varying vec3 worldPoint;
        #include <common>
        #include <logdepthbuf_pars_fragment>
        void main() {
          #include <logdepthbuf_fragment>
          vec2 grainUv = worldPoint.xz * 0.68;
          float grain = texture2D(stoneMap, grainUv).r;
          vec2 distortion = vec2(grain - 0.65, texture2D(stoneMap, grainUv + 0.23).r - 0.65);
          vec2 uv = reflectionUv.xy / reflectionUv.w + distortion * 0.0015;
          vec3 reflected = texture2D(tDiffuse, uv, 2.0 + grain * 2.0).rgb;
          float grazing = 1.0 - abs(normalize(cameraPosition - worldPoint).y);
          float reflection = (0.04 + 0.18 * pow(grazing, 3.0)) * (1.1 - grain * 0.35);
          gl_FragColor = vec4(color * (0.65 + grain * 0.7) + reflected * reflection, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    },
    color: 0x222827,
  });
  floor.getRenderTarget().texture.generateMipmaps = true;
  floor.getRenderTarget().texture.minFilter = THREE.LinearMipmapLinearFilter;
  floor.rotation.x = -Math.PI / 2;
  return floor;
}
