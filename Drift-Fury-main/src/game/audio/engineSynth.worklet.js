/* global AudioWorkletProcessor, registerProcessor, sampleRate */
// Moteur audio tournant sur le thread audio (AudioWorklet).
//
// Le principe : chaque allumage de cylindre injecte une impulsion de pression à l'angle de vilebrequin exact,
// donc la note est verrouillée sur le régime, échantillon par échantillon. Les impulsions de chaque banc
// d'échappement traversent les résonances de SON tuyau : la série de modes du tuyau (une longueur différente
// par banc, d'où le battement entre les deux lignes), décalée vers le haut à mesure que les gaz chauds font
// monter la vitesse du son — la température des gaz suit la charge.
//
// Autour de ce cœur : le grondement de combustion, la respiration de l'admission, le bruit mécanique, les
// pétarades de décélération, puis le turbocompresseur (montée en pression, sifflement, décharge au lever de
// pied avec son flutter). L'échappement est saturé puis filtré en fonction de la charge, l'air passe à côté,
// et une table de loudness mesurée sur toute la plage de régime garantit un volume constant à chaque régime.

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (lo, hi, v) => {
  const x = clamp((v - lo) / (hi - lo), 0, 1);
  return x * x * (3 - 2 * x);
};
// y += (target - y) * pole(sr, s)  ->  constante de temps s
const pole = (sr, seconds) => 1 - Math.exp(-1 / (sr * seconds));
// y = y * decay(sr, s) + x * (1 - decay)  ->  même chose, écrit pour un filtre
const decay = (sr, seconds) => Math.exp(-1 / (sr * seconds));
const lowpass = (sr, hz) => 1 - Math.exp((-TAU * hz) / sr);

const PROFILES = {
  // V8 à vilebrequin croisé (ordre d'allumage alterné entre les deux bancs) : c'est ce croisement qui
  // donne le grondement irrégulier. Tuyaux longs, gros volume : tout est calé bas pour un son profond,
  // et le niveau est poussé pour qu'il domine le mix.
  // V8 « gros cube agressif » : grondement grave, quasiment plus d'aigus, saturation poussée
  // et pétarades explosives à la levée de pied. Sifflement de turbo retiré, tuyaux longs et
  // volumineux, plafond de brillance abaissé pour un son plus sombre et plus lourd.
  V8: {
    cyl: 8,
    banks: [0, 1, 1, 0, 1, 0, 0, 1],
    gains: [1, 0.9, 1.06, 0.94, 1.04, 0.92, 1.05, 0.93],
    bankGain: 0.8,
    idle: 680,
    redline: 6000,
    pipe: [
      [26, 1.5, 0.96],
      [41, 1.7, 1],
      [63, 1.9, 1],
      [94, 2.2, 0.97],
      [137, 2.5, 0.93],
      [194, 2.9, 0.88],
      [270, 3.3, 0.79],
      [369, 3.7, 0.68],
      [495, 4.1, 0.46],
      [657, 4.6, 0.3],
      [882, 5, 0.14],
      [1305, 4.4, 0.05],
      [1980, 3.2, 0.02],
    ],
    bankShift: [1, 1.06],
    tempShift: [1, 1.13],
    pulse: 0.78,
    jitter: 0.22,
    crack: 0.8,
    roar: 1,
    mech: 0.035,
    intake: 0.17,
    air: 0.92,
    drive: 1.98,
    level: 1.42,
    bright: [300, 740],
    turbo: { blades: 30, spoolUp: 0.14, spoolDown: 0.42, whistle: 0, hiss: 0.025, threshold: 1200, bov: 1.2 },
    overrun: { rate: 52, amp: 1.5 },
  },
  // Six cylindres en ligne biturbo dans l'esprit d'une BMW M : plus lisse, plus clair, métallique, une
  // admission plus mordante et une décélération plus discrète.
  V6: {
    cyl: 6,
    banks: [0, 1, 0, 1, 0, 1],
    gains: [1, 0.97, 1.03, 0.98, 1.02, 0.99],
    bankGain: 0.9,
    idle: 800,
    redline: 7200,
    pipe: [
      [54, 1.6, 0.55],
      [86, 1.8, 0.75],
      [126, 2, 0.88],
      [178, 2.3, 0.95],
      [244, 2.6, 0.96],
      [328, 3, 0.92],
      [432, 3.4, 0.84],
      [560, 3.8, 0.74],
      [720, 4.2, 0.64],
      [940, 4.6, 0.52],
      [1240, 5, 0.4],
      [1650, 5.1, 0.28],
      [2250, 4.6, 0.18],
      [3100, 3.8, 0.08],
    ],
    bankShift: [1, 1.03],
    tempShift: [1, 1.12],
    pulse: 0.4,
    jitter: 0.12,
    crack: 0.38,
    roar: 0.44,
    mech: 0.1,
    intake: 0.3,
    air: 1,
    drive: 1.14,
    level: 1,
    bright: [980, 3100],
    turbo: {
      blades: 34,
      spoolUp: 0.14,
      spoolDown: 0.4,
      whistle: 0.055,
      hiss: 0.045,
      threshold: 1400,
      bov: 0.8,
    },
    overrun: { rate: 20, amp: 0.7 },
  },
  V12: {
    cyl: 12,
    banks: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    gains: [1, 0.98, 1.02, 0.99, 1.01, 0.98, 1.02, 0.99, 1, 0.98, 1.01, 0.99],
    bankGain: 0.95,
    idle: 1000,
    redline: 9000,
    pipe: [
      [96, 1.8, 0.6],
      [150, 2.2, 0.8],
      [224, 2.8, 0.95],
      [330, 3.4, 0.9],
      [470, 3.8, 0.85],
      [660, 4.2, 0.75],
      [900, 4.6, 0.62],
      [1220, 4.8, 0.5],
      [1650, 5, 0.38],
      [2200, 5, 0.28],
      [3000, 4.6, 0.18],
      [4200, 3.8, 0.1],
      [6000, 3, 0.05],
    ],
    bankShift: [1, 1.02],
    tempShift: [1, 1.08],
    pulse: 0.3,
    jitter: 0.06,
    crack: 0.3,
    roar: 0.37,
    mech: 0.12,
    intake: 0.22,
    air: 1,
    drive: 1.12,
    level: 1,
    bright: [1350, 4300],
    turbo: { blades: 30, spoolUp: 0.3, spoolDown: 0.5, whistle: 0, hiss: 0, threshold: 2500, bov: 0 },
    overrun: { rate: 7, amp: 0.3 },
  },
  W16: {
    cyl: 16,
    banks: [0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1],
    gains: [1, 0.92, 1.05, 0.96, 1.07, 0.9, 1.02, 0.95, 1, 0.93, 1.04, 0.97, 1.06, 0.91, 1.01, 0.96],
    bankGain: 0.85,
    idle: 900,
    redline: 6800,
    pipe: [
      [38, 1.5, 0.85],
      [60, 1.7, 1],
      [92, 1.9, 1],
      [136, 2.2, 0.95],
      [198, 2.5, 0.9],
      [282, 2.9, 0.82],
      [392, 3.3, 0.72],
      [540, 3.7, 0.6],
      [730, 4.1, 0.5],
      [980, 4.6, 0.38],
      [1320, 5, 0.26],
      [2000, 4.6, 0.16],
      [3100, 3.6, 0.07],
    ],
    bankShift: [1, 1.045],
    tempShift: [1, 1.18],
    pulse: 0.7,
    jitter: 0.13,
    crack: 0.55,
    roar: 0.6,
    mech: 0.08,
    intake: 0.18,
    air: 1,
    drive: 1.45,
    level: 1,
    bright: [640, 2300],
    turbo: { blades: 26, spoolUp: 0.2, spoolDown: 0.5, whistle: 0.07, hiss: 0.075, threshold: 1300, bov: 1 },
    overrun: { rate: 38, amp: 1.1 },
  },
};

class EngineSynth extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const p = PROFILES[options?.processorOptions?.id] || PROFILES.V8;
    this.p = p;
    this.sr = sampleRate;
    // Entrées lissées : le moteur démarre au ralenti, pied levé.
    this.tRpm = this.rpm = p.idle;
    this.tLoad = this.load = 0;
    this.tCut = this.cut = 1;
    this.tRun = this.run = 1;
    // Vilebrequin
    this.pos = 0;
    this.idx = 0;
    this.pend0 = 0;
    this.pend1 = 0;
    this.p0 = 0;
    this.p1 = 0;
    // Couches
    this.crack = 0;
    this.boost = 0;
    this.bov = 0;
    this.bovF = 0;
    this.prevLoad = 0;
    this.bang = 0;
    this.bangLow = 0;
    this.phase = 0;
    this.bovPhase = 0;
    // Tuyaux
    const K = (this.K = p.pipe.length);
    this.b = [new Float64Array(K), new Float64Array(K)];
    this.c1 = [new Float64Array(K), new Float64Array(K)];
    this.c2 = [new Float64Array(K), new Float64Array(K)];
    this.g = new Float64Array(K);
    p.pipe.forEach((mode, k) => {
      this.g[k] = mode[2];
    });
    this.st = this.makeState();
    this.kPulse = decay(this.sr, p.pulse * 0.001);
    this.updatePipes();
    this.calibrate();
    this.n1 = this.n3 = this.k1 = this.k3 = this.h1 = this.h3 = 0;
    this.lp1 = this.lp2 = this.air1 = this.air2 = 0;
    this.dead = false;
    this.port.onmessage = ({ data }) => {
      if (!data) return;
      if (data.stop) {
        this.dead = true;
        return;
      }
      if (Number.isFinite(data.rpm)) this.tRpm = clamp(data.rpm, 0, 12000);
      if (Number.isFinite(data.load)) this.tLoad = clamp(data.load, 0, 1);
      if (Number.isFinite(data.cut)) this.tCut = clamp(data.cut, 0, 1);
      if (Number.isFinite(data.run)) this.tRun = clamp(data.run, 0, 1);
      if (Number.isFinite(data.bang)) this.bang = clamp(data.bang, 0, 2.5);
    };
  }

  makeState() {
    return {
      y1: [new Float64Array(this.K), new Float64Array(this.K)],
      y2: [new Float64Array(this.K), new Float64Array(this.K)],
    };
  }

  // Les modes du tuyau glissent avec la température des gaz (plus de charge = gaz plus chauds = son plus
  // rapide = résonances plus hautes). Recalculé une fois par bloc, les changements sont lents.
  updatePipes() {
    const p = this.p,
      sr = this.sr;
    const heat = clamp(0.1 + 0.9 * this.load * (0.4 + 0.6 * clamp(this.rpm / p.redline, 0, 1)), 0, 1);
    const heatShift = p.tempShift[0] + (p.tempShift[1] - p.tempShift[0]) * heat;
    for (let bank = 0; bank < 2; bank++) {
      const scale = p.bankShift[bank] * heatShift;
      for (let k = 0; k < this.K; k++) {
        const freq = Math.min(p.pipe[k][0] * scale, sr * 0.45),
          q = p.pipe[k][1],
          th = (TAU * freq) / sr;
        const r = Math.exp((-Math.PI * freq) / q / sr);
        const c1 = 2 * r * Math.cos(th),
          c2 = -r * r;
        this.c1[bank][k] = c1;
        this.c2[bank][k] = c2;
        this.b[bank][k] = Math.hypot(
          1 - c1 * Math.cos(th) - c2 * Math.cos(2 * th),
          c1 * Math.sin(th) + c2 * Math.sin(2 * th),
        );
      }
    }
  }

  // Un échantillon des deux bancs, e0/e1 = énergie injectée dans le tuyau à cet échantillon.
  banks(st, e0, e1) {
    let s0 = 0,
      s1 = 0;
    const K = this.K,
      g = this.g,
      c1 = this.c1,
      c2 = this.c2;
    for (let k = 0; k < K; k++) {
      const a0 = this.b[0][k] * e0 + c1[0][k] * st.y1[0][k] + c2[0][k] * st.y2[0][k];
      st.y2[0][k] = st.y1[0][k];
      st.y1[0][k] = a0;
      s0 += g[k] * a0;
      const a1 = this.b[1][k] * e1 + c1[1][k] * st.y1[1][k] + c2[1][k] * st.y2[1][k];
      st.y2[1][k] = st.y1[1][k];
      st.y1[1][k] = a1;
      s1 += g[k] * a1;
    }
    return s0 + s1;
  }

  // Mesure le niveau sorti par les tuyaux à plusieurs régimes, pour que chaque régime sonne aussi fort
  // avant la saturation. (Une seule fois, au démarrage.)
  calibrate() {
    const p = this.p,
      sr = this.sr,
      N = p.cyl,
      kP = this.kPulse,
      pts = [];
    for (let j = 0; j <= 11; j++) {
      const rpm = p.idle * 0.7 + ((p.redline * 1.15 - p.idle * 0.7) * j) / 11,
        dpos = (rpm * N) / 120 / sr;
      const cycle = Math.ceil((sr * 120) / rpm),
        warm = Math.floor(sr * 0.12);
      const total = warm + Math.max(Math.floor(sr * 0.1), cycle * 3);
      const st = this.makeState();
      let pos = 0,
        idx = 0,
        pend0 = 0,
        pend1 = 0,
        sh0 = 0,
        sh1 = 0,
        sum = 0,
        count = 0;
      for (let i = 0; i < total; i++) {
        pos += dpos;
        let e0 = pend0,
          e1 = pend1;
        pend0 = 0;
        pend1 = 0;
        if (pos >= 1 && dpos > 0) {
          pos -= 1;
          const over = Math.min(1, pos / dpos),
            a = p.gains[idx] * (p.banks[idx] ? p.bankGain : 1);
          if (p.banks[idx]) {
            e1 += a * over;
            pend1 += a * (1 - over);
          } else {
            e0 += a * over;
            pend0 += a * (1 - over);
          }
          idx = (idx + 1) % N;
        }
        sh0 = sh0 * kP + e0 * (1 - kP);
        sh1 = sh1 * kP + e1 * (1 - kP);
        const y = this.banks(st, sh0, sh1);
        if (i >= warm) {
          sum += y * y;
          count++;
        }
      }
      pts.push([rpm, Math.sqrt(sum / count) || 1e-9]);
    }
    this.table = pts;
  }

  compAt(rpm) {
    const t = this.table;
    if (rpm <= t[0][0]) return 1 / t[0][1];
    for (let j = 1; j < t.length; j++) {
      if (rpm <= t[j][0]) {
        const f = (rpm - t[j - 1][0]) / (t[j][0] - t[j - 1][0]);
        return 1 / (t[j - 1][1] + (t[j][1] - t[j - 1][1]) * f);
      }
    }
    return 1 / t[t.length - 1][1];
  }

  reset() {
    for (let bank = 0; bank < 2; bank++) {
      this.st.y1[bank].fill(0);
      this.st.y2[bank].fill(0);
    }
    this.crack = this.bov = this.bovF = this.boost = 0;
    this.bang = this.bangLow = 0;
    this.lp1 = this.lp2 = this.air1 = this.air2 = 0;
    this.n1 = this.n3 = this.k1 = this.k3 = this.h1 = this.h3 = 0;
    this.pend0 = this.pend1 = this.p0 = this.p1 = 0;
  }

  process(inputs, outputs) {
    if (this.dead) return false;
    const out = outputs[0] && outputs[0][0];
    if (!out) return true;
    const p = this.p,
      sr = this.sr,
      n = out.length,
      N = p.cyl,
      turb = p.turbo,
      overrun = p.overrun;
    this.updatePipes();
    const comp = this.compAt(this.rpm);
    const frac0 = clamp(this.rpm / p.redline, 0, 1.3);
    const bright = clamp(0.08 + 0.34 * frac0 + 0.58 * this.load, 0, 1);
    const aLP = lowpass(sr, p.bright[0] + (p.bright[1] - p.bright[0]) * bright);
    const aAir = lowpass(sr, 4200);
    const envRpm = p.level * (0.7 + 0.3 * Math.pow(frac0, 0.8)) * 0.46;
    const cR = pole(sr, 0.014),
      cL = pole(sr, 0.07),
      cC = pole(sr, 0.012),
      cRun = pole(sr, 0.09);
    const cUp = pole(sr, turb.spoolUp),
      cDown = pole(sr, turb.spoolDown);
    const crackDecay = decay(sr, 0.004),
      bDecay = decay(sr, 0.09),
      bFDecay = decay(sr, 0.32),
      bangDecay = decay(sr, 0.085);
    const aN1 = lowpass(sr, 2600),
      aN3 = lowpass(sr, 320);
    const aK1 = lowpass(sr, 3800),
      aK3 = lowpass(sr, 700);
    const aH1 = lowpass(sr, 7000),
      aH3 = lowpass(sr, 1100);
    const kP = this.kPulse,
      spinning = turb.whistle > 0 || turb.hiss > 0;
    const redline = p.redline,
      idle = p.idle;
    for (let i = 0; i < n; i++) {
      this.rpm += (this.tRpm - this.rpm) * cR;
      this.load += (this.tLoad - this.load) * cL;
      this.cut += (this.tCut - this.cut) * cC;
      this.run += (this.tRun - this.run) * cRun;
      const rpm = this.rpm,
        load = this.load,
        frac = clamp(rpm / redline, 0, 1.3);
      const live = this.cut * this.run;
      const limiter = rpm > redline * 0.985 ? 0.72 + 0.28 * Math.max(0, Math.sin(i * 0.12)) : 1;

      // --- angle de vilebrequin : une impulsion par allumage
      const dpos = (rpm * N) / 120 / sr;
      this.pos += dpos;
      let e0 = this.pend0,
        e1 = this.pend1;
      this.pend0 = 0;
      this.pend1 = 0;
      if (this.pos >= 1 && dpos > 0) {
        this.pos -= 1;
        const over = Math.min(1, this.pos / dpos),
          cyl = this.idx;
        this.idx = (this.idx + 1) % N;
        const amp =
          p.gains[cyl] *
          (p.banks[cyl] ? p.bankGain : 1) *
          (1 + (Math.random() * 2 - 1) * p.jitter * (1 - 0.5 * frac)) *
          (0.55 + 0.45 * load) *
          live *
          limiter;
        if (p.banks[cyl]) {
          e1 += amp * over;
          this.pend1 += amp * (1 - over);
        } else {
          e0 += amp * over;
          this.pend0 += amp * (1 - over);
        }
        this.crack += amp * p.crack * (0.25 + 0.75 * load);
      }
      // Forme de l'impulsion : plus le tuyau est large, moins il passe d'aigus.
      this.p0 = this.p0 * kP + e0 * (1 - kP);
      this.p1 = this.p1 * kP + e1 * (1 - kP);

      // --- décélération : l'essence imbrûlée s'allume dans l'échappement
      let pop = 0;
      if (
        rpm > 1800 &&
        this.run > 0.5 &&
        (load < 0.22 || this.cut < 0.55) &&
        Math.random() < (overrun.rate * frac) / sr
      ) {
        pop =
          overrun.amp *
          (Math.random() < 0.04 ? 2.2 : 1) *
          (0.45 + 0.85 * Math.random()) *
          (0.35 + 0.65 * (1 - load));
        this.crack += pop * 0.5;
      }
      const popA = pop > 0 && Math.random() < 0.5 ? pop : 0,
        popB = pop - popA;

      // --- turbocompresseur
      const want = spinning ? load * this.cut * smooth(turb.threshold, turb.threshold + 2600, rpm) : 0;
      this.boost += (want - this.boost) * (want > this.boost ? cUp : cDown);
      if (this.prevLoad > 0.45 && load < 0.2 && this.boost > 0.22) {
        this.bov = this.boost * turb.bov;
        this.bovF = this.boost;
      }
      this.prevLoad = load;
      this.bov *= bDecay;
      this.bovF *= bFDecay;
      const boost = this.boost;
      this.phase += (TAU * ((rpm * turb.blades) / 60)) / sr;
      if (this.phase > TAU) this.phase -= TAU;
      this.bovPhase += (TAU * 32) / sr;
      if (this.bovPhase > TAU) this.bovPhase -= TAU;
      const flutter = 1 - 0.8 * this.bovF * (0.5 + 0.5 * Math.sin(this.bovPhase));

      // --- explosion à l'échappement au passage de rapport : un coup court et grave dans le collecteur,
      // qui traverse les mêmes résonances que les impulsions d'allumage.
      const bang = this.bang;
      this.bang *= bangDecay;
      this.bangLow = this.bangLow * 0.8 + (Math.random() * 2 - 1) * 0.2;
      const bangSig = bang * (this.bangLow * 2.6 + (Math.random() * 2 - 1) * 0.85);

      // --- bruits
      const noise = Math.random() * 2 - 1;
      this.n1 += aN1 * (noise - this.n1);
      this.n3 += aN3 * (this.n1 - this.n3);
      this.k1 += aK1 * (noise - this.k1);
      this.k3 += aK3 * (this.k1 - this.k3);
      this.h1 += aH1 * (noise - this.h1);
      this.h3 += aH3 * (this.h1 - this.h3);
      const low = this.n1 - this.n3,
        mid = this.k1 - this.k3,
        high = this.h1 - this.h3;
      this.crack *= crackDecay;

      // --- échappement : tuyaux + combustion + pétarades, saturés puis filtrés selon la charge
      let ex = this.banks(this.st, this.p0 + popA + bangSig * 0.55, this.p1 + popB + bangSig * 0.45) * comp;
      ex += bangSig * 0.7;
      ex += mid * this.crack * 1.5;
      ex += low * p.roar * (0.05 + 0.22 * frac) * (0.3 + 0.7 * load) * this.run * 2.2;
      const exhaust = Math.tanh(ex * p.drive * (0.8 + 0.4 * load));
      this.lp1 += aLP * (exhaust - this.lp1);
      this.lp2 += aLP * (this.lp1 - this.lp2);

      // --- air : admission, mécanique, turbo (hors saturation échappement)
      const air =
        mid * p.intake * load * this.run * 0.9 +
        high *
          (p.mech * (0.02 + 0.22 * frac * frac) * this.run * 2 +
            turb.hiss * boost * (0.3 + 0.7 * frac) * this.run * 1.4 +
            this.bov * 1.6 * flutter) +
        turb.whistle *
          boost *
          Math.sqrt(boost) *
          (0.25 + 0.75 * frac) *
          this.run *
          (Math.sin(this.phase) + 0.28 * Math.sin(this.phase * 2.01));

      this.air1 += aAir * (air - this.air1);
      this.air2 += aAir * (this.air1 - this.air2);
      out[i] = (this.lp2 + this.air2 * p.air) * envRpm * (0.75 + 0.25 * load);
    }
    if (
      !Number.isFinite(this.lp2) ||
      !Number.isFinite(this.st.y1[0][0]) ||
      !Number.isFinite(this.st.y1[1][0])
    ) {
      this.rpm = this.tRpm >= idle ? this.tRpm : idle;
      this.reset();
      out.fill(0);
    }
    return true;
  }
}

registerProcessor("engine-synth", EngineSynth);
