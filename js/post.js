// VICTORY LAP — post.js
// The bloom chain. ~200 lines, no examples/jsm.
//
// ⚠️ WHY THIS IS HAND-WRITTEN rather than vendored. three.js ships EffectComposer
// + RenderPass + ShaderPass + UnrealBloomPass + CopyShader +
// LuminosityHighPassShader + MaskPass + OutputPass in examples/jsm — eight files,
// every one importing bare 'three' which does not resolve against our vendored
// lib/three.module.js, so all eight need their imports rewritten and re-checked
// on every three.js bump. This is a third of the code, has no import surface, and
// most importantly lets us own the ORDER of the tone map, which is the one thing
// in a post chain that is easy to get silently wrong.
//
// ⚠️⚠️ THE COLOUR TRAP, and it is the whole reason this file needs care.
// three.js applies renderer.toneMapping ONLY when the render target is the canvas
// (WebGLProgram checks currentRenderTarget === null). The moment the scene renders
// into an RT instead, it lands there as LINEAR HDR and nothing tone-maps it. If
// the composite then draws that to the canvas without re-applying the tone map,
// the entire game loses ACES the day post is switched on — and it does not look
// broken, it looks like the ACES commit was reverted. So the composite material
// carries `toneMapped: true` and re-applies ACES + sRGB itself, and every
// INTERMEDIATE material carries `toneMapped: false` so the grade is applied
// exactly once.
// ⚠️ THE GATE for all of that is one test: with strength 0, post-ON must match
// post-OFF. If those two frames differ, the colour pipeline is wrong, whatever
// the bloom looks like. `__vlPostCheck()` in main.js runs exactly that.
//
// ⚠️ sceneRT.samples = 4 or turning post on silently costs the canvas's MSAA and
// the whole game goes jaggy — a regression that is very easy to ship blind
// because nothing errors.

import * as THREE from '../lib/three.module.js';

const VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// ⚠️ BRIGHT PASS. `threshold` is in LINEAR light, not display units, and that
// distinction is the difference between bloom and a white-out. Under ACES the
// display-white point sits near linear 1.0, so a threshold of 1.0 uses the HDR
// headroom itself as the gate: ordinary lit surfaces never reach it, and only
// things that are genuinely emitting — lit signs at emissiveIntensity 2.4, shop
// windows, muzzle flashes — get through. Lowering it to "get more bloom" makes
// the ROAD glow. Brighten the source instead.
const BRIGHT = `
uniform sampler2D tDiffuse;
uniform float threshold;
uniform float knee;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  // soft knee so a surface crossing the threshold fades in instead of popping
  float w = clamp((l - threshold + knee) / (2.0 * knee + 1e-5), 0.0, 1.0);
  w = w * w * (l > threshold - knee ? 1.0 : 0.0);
  float contrib = max(l - threshold, 0.0);
  contrib = mix(contrib, l, w * 0.25) / max(l, 1e-5);
  gl_FragColor = vec4(c * clamp(contrib, 0.0, 1.0), 1.0);
}
`;

// separable 9-tap gaussian; `dir` carries the texel step and the axis at once
const BLUR = `
uniform sampler2D tDiffuse;
uniform vec2 dir;
varying vec2 vUv;
void main() {
  vec3 s = texture2D(tDiffuse, vUv).rgb * 0.2270270270;
  s += texture2D(tDiffuse, vUv + dir * 1.3846153846).rgb * 0.3162162162;
  s += texture2D(tDiffuse, vUv - dir * 1.3846153846).rgb * 0.3162162162;
  s += texture2D(tDiffuse, vUv + dir * 3.2307692308).rgb * 0.0702702703;
  s += texture2D(tDiffuse, vUv - dir * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(s, 1.0);
}
`;

// ⚠️ The ONLY material in this file with toneMapped = true. See the colour trap.
const COMP = `
uniform sampler2D tScene;
uniform sampler2D tBloom0;
uniform sampler2D tBloom1;
uniform sampler2D tBloom2;
uniform float strength;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tScene, vUv).rgb;
  vec3 b = texture2D(tBloom0, vUv).rgb * 1.00
         + texture2D(tBloom1, vUv).rgb * 0.70
         + texture2D(tBloom2, vUv).rgb * 0.45;
  gl_FragColor = vec4(c + b * strength, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export class Post {
  // ⚠️ Takes ONLY the renderer. The scene and camera arrive per frame in
  // render(), because capturing them here is an ordering bug waiting to happen:
  // the first draft was constructed alongside this.scene, which is built BEFORE
  // this.camera, so it captured an undefined camera and threw inside
  // WebGLRenderer.render with a message ("cannot read 'parent'") that names
  // neither the camera nor this file. Per-frame arguments cannot go stale.
  constructor(renderer) {
    this.renderer = renderer;
    this.available = false;
    // ⚠️ WebGL2 only: a half-float colour target plus MSAA resolve is a WebGL2
    // feature. The caller falls back to a plain render when this stays false, so
    // an old machine loses bloom and loses nothing else.
    if (!renderer.capabilities.isWebGL2) return;

    this.p = {
      // linear-light gate; see the BRIGHT note before touching it
      threshold: 1.0,
      knee: 0.35,
      strength: 0.62,
    };

    const opts = { type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace,
                   minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    this.sceneRT = new THREE.WebGLRenderTarget(1, 1, opts);
    this.sceneRT.samples = 4;      // ⚠️ or post silently costs you the canvas MSAA
    this.sceneRT.depthBuffer = true;

    // three mip levels: 1/2, 1/4, 1/8. Cheap, and the wide one is what makes a
    // sign read as GLOWING rather than merely outlined.
    this.mips = [];
    for (let i = 0; i < 3; i++) {
      this.mips.push({
        a: new THREE.WebGLRenderTarget(1, 1, opts),
        b: new THREE.WebGLRenderTarget(1, 1, opts),
      });
    }

    const quad = new THREE.PlaneGeometry(2, 2);
    const mk = (frag, uniforms, toneMapped = false) => {
      const m = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag,
        uniforms, depthTest: false, depthWrite: false });
      m.toneMapped = toneMapped;
      return m;
    };
    this.mBright = mk(BRIGHT, { tDiffuse: { value: null },
      threshold: { value: this.p.threshold }, knee: { value: this.p.knee } });
    this.mBlur = mk(BLUR, { tDiffuse: { value: null }, dir: { value: new THREE.Vector2() } });
    this.mComp = mk(COMP, { tScene: { value: null },
      tBloom0: { value: null }, tBloom1: { value: null }, tBloom2: { value: null },
      strength: { value: this.p.strength } }, true);   // ⚠️ the one that grades

    this.fsScene = new THREE.Scene();
    this.fsQuad = new THREE.Mesh(quad, this.mBright);
    this.fsQuad.frustumCulled = false;
    this.fsScene.add(this.fsQuad);
    this.fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.available = true;
  }

  setSize(w, h) {
    if (!this.available) return;
    const dpr = this.renderer.getPixelRatio();
    const W = Math.max(1, Math.floor(w * dpr)), H = Math.max(1, Math.floor(h * dpr));
    this.sceneRT.setSize(W, H);
    for (let i = 0; i < this.mips.length; i++) {
      const d = 2 << i;                      // 2, 4, 8
      const mw = Math.max(1, Math.floor(W / d)), mh = Math.max(1, Math.floor(H / d));
      this.mips[i].a.setSize(mw, mh);
      this.mips[i].b.setSize(mw, mh);
    }
  }

  _draw(mat, target) {
    this.fsQuad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.clear();
    this.renderer.render(this.fsScene, this.fsCam);
  }

  render(scene, camera) {
    if (!this.available) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(scene, camera);
      return;
    }
    const r = this.renderer;

    // 1. the scene, into an HDR target. ⚠️ NOT tone-mapped here — three.js only
    //    grades when the target is the canvas, which is exactly what we want:
    //    bloom has to be measured against LINEAR light, not display values.
    r.setRenderTarget(this.sceneRT);
    r.clear();
    r.render(scene, camera);

    // 2. bright-pass into mip 0, then downsample the chain
    this.mBright.uniforms.tDiffuse.value = this.sceneRT.texture;
    this.mBright.uniforms.threshold.value = this.p.threshold;
    this.mBright.uniforms.knee.value = this.p.knee;
    this._draw(this.mBright, this.mips[0].a);

    for (let i = 0; i < this.mips.length; i++) {
      const m = this.mips[i];
      if (i > 0) {   // downsample from the previous level's blurred result
        this.mBlur.uniforms.tDiffuse.value = this.mips[i - 1].a.texture;
        this.mBlur.uniforms.dir.value.set(1 / this.mips[i - 1].a.width, 0);
        this._draw(this.mBlur, m.a);
      }
      // separable blur: horizontal into b, vertical back into a
      this.mBlur.uniforms.tDiffuse.value = m.a.texture;
      this.mBlur.uniforms.dir.value.set(1 / m.a.width, 0);
      this._draw(this.mBlur, m.b);
      this.mBlur.uniforms.tDiffuse.value = m.b.texture;
      this.mBlur.uniforms.dir.value.set(0, 1 / m.a.height);
      this._draw(this.mBlur, m.a);
    }

    // 3. composite to the canvas — the ONE place ACES + sRGB are applied
    this.mComp.uniforms.tScene.value = this.sceneRT.texture;
    this.mComp.uniforms.tBloom0.value = this.mips[0].a.texture;
    this.mComp.uniforms.tBloom1.value = this.mips[1].a.texture;
    this.mComp.uniforms.tBloom2.value = this.mips[2].a.texture;
    this.mComp.uniforms.strength.value = this.p.strength;
    this._draw(this.mComp, null);
    r.setRenderTarget(null);
  }
}
