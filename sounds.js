'use strict';
/* sounds.js — Web Audio API sound effects */
(function () {
  const ctx = () => {
    if (!window._actx) window._actx = new (window.AudioContext || window.webkitAudioContext)();
    return window._actx;
  };

  function tone(freq, type, dur, vol, attack = 0.01, decay = 0.1) {
    try {
      const c = ctx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, c.currentTime);
      gain.gain.linearRampToValueAtTime(vol, c.currentTime + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(); osc.stop(c.currentTime + dur + 0.05);
    } catch(e) {}
  }

  function noise(dur, vol, freq = 800) {
    try {
      const c = ctx();
      const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
      const src = c.createBufferSource();
      src.buffer = buf;
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = 0.5;
      const gain = c.createGain();
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      src.connect(filter); filter.connect(gain); gain.connect(c.destination);
      src.start(); src.stop(c.currentTime + dur);
    } catch(e) {}
  }

  window.SFX = {
    // Engine rev: rising tone sweep
    engineRev() {
      try {
        const c = ctx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, c.currentTime + 0.6);
        osc.frequency.exponentialRampToValueAtTime(80, c.currentTime + 1.2);
        gain.gain.setValueAtTime(0, c.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, c.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.3);
        osc.connect(gain); gain.connect(c.destination);
        osc.start(); osc.stop(c.currentTime + 1.4);
      } catch(e) {}
    },

    // Door: mechanical thud
    door() {
      noise(0.18, 0.3, 120);
      setTimeout(() => noise(0.08, 0.15, 200), 160);
    },

    // UI click: subtle tick
    click() {
      tone(1200, 'sine', 0.06, 0.04, 0.002, 0.06);
    },

    // Lights on: electric hum
    lightsOn() {
      tone(180, 'sine', 0.3, 0.06, 0.02, 0.3);
      tone(360, 'sine', 0.2, 0.03, 0.02, 0.2);
    },

    // Whoosh for camera transitions
    whoosh() {
      noise(0.4, 0.08, 600);
    }
  };
})();
