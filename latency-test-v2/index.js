import {
  SuperpoweredGlue,
  SuperpoweredWebAudio,
} from "./superpowered/SuperpoweredWebAudio.js";

const main = async () => {
  const INITIAL_BPM = 120;
  const INITIAL_PITCH = 0;
  const INITIAL_GRAIN_SIZE = 0.2;
  const INITIAL_OVERLAP = 0.1;

  const kickSrc = "./samples/kick.wav";
  const snareSrc = "./samples/snare.wav";
  const hihatSrc = "./samples/hihat.wav";
  const guitarSrc = "./samples/guitar.wav";

  const initBtn = document.getElementById("init");
  const descriptionDiv = document.getElementById("content");
  const bpmSlider = document.getElementById("bpmSlider");
  const bpmSliderLabel = document.getElementById("bpmSliderLabel");
  const pitchSlider = document.getElementById("pitchSlider");
  const pitchSliderLabel = document.getElementById("pitchSliderLabel");
  const pitchCompensationCheckbox = document.getElementById(
    "pitchCompensationCheckbox"
  );

  const grainSizeSlider = document.getElementById("grainSizeSlider");
  const grainSizeSliderLabel = document.getElementById("grainSizeSliderLabel");
  const overlapSlider = document.getElementById("overlapSlider");
  const overlapSliderLabel = document.getElementById("overlapSliderLabel");

  descriptionDiv.style.display = "none";

  // superpowered loading

  let superpoweredAudioNode;

  const superpowered = await SuperpoweredGlue.fetch(
    "./superpowered/superpowered.wasm"
  );
  superpowered.Initialize("ExampleLicenseKey-WillExpire-OnNextUpdate");

  const webaudioManager = new SuperpoweredWebAudio(44100, superpowered);

  superpoweredAudioNode = await webaudioManager.createAudioNodeAsync(
    "./processor.js",
    "AudioProcessor",
    (message) => {}
  );
  superpoweredAudioNode.connect(webaudioManager.audioContext.destination);

  const playSuperpoweredSample = (key) => {
    webaudioManager.audioContext.resume();
    superpoweredAudioNode.sendMessageToAudioScope({
      key,
    });
  };

  const onSuperpoweredBpmChange = (value) => {
    superpoweredAudioNode.sendMessageToAudioScope({
      rate: value,
    });
  };

  const onSuperpoweredPitchShiftChange = (value) => {
    superpoweredAudioNode.sendMessageToAudioScope({
      pitchShift: value,
    });
  };

  // tone.js loading

  const tonePitchShift = new Tone.PitchShift({
    pitch: INITIAL_PITCH,
  }).toDestination();

  const tonePlayerKick = new Tone.Player(kickSrc).toDestination();
  const tonePlayerSnare = new Tone.Player(snareSrc).toDestination();
  const tonePlayerHihat = new Tone.Player(hihatSrc).toDestination();
  const tonePlayerGuitar = new Tone.Player(guitarSrc)
    .disconnect()
    .connect(tonePitchShift);

  const toneGrainPlayerKick = new Tone.GrainPlayer(kickSrc).toDestination();
  const toneGrainPlayerSnare = new Tone.GrainPlayer(snareSrc).toDestination();
  const toneGrainPlayerHihat = new Tone.GrainPlayer(hihatSrc).toDestination();
  const toneGrainPlayerGuitar = new Tone.GrainPlayer(guitarSrc)
    .disconnect()
    .connect(tonePitchShift);

  const setGrainSize = (grainSize) => {
    grainSizeSlider.value = grainSize;
    grainSizeSliderLabel.innerText = `Grain Size: ${grainSize}`;

    toneGrainPlayerGuitar.grainSize = grainSize;
  };
  setGrainSize(INITIAL_GRAIN_SIZE);
  grainSizeSlider.oninput = (e) => setGrainSize(e.target.value);

  const setOverlap = (overlap) => {
    overlapSlider.value = overlap;
    overlapSliderLabel.innerText = `Overlap: ${overlap}`;

    toneGrainPlayerGuitar.overlap = overlap;
  };
  setOverlap(INITIAL_OVERLAP);
  overlapSlider.oninput = (e) => setOverlap(e.target.value);

  initBtn.onclick = () => {
    Tone.start();
    Tone.getContext().resume();
    Tone.getContext().lookAhead = 0;

    initBtn.style.display = "none";
    descriptionDiv.style.display = "initial";
  };

  // web audio api loading

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();

  const getAudioBuffer = async (path) => {
    if (audioContext) {
      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    }
  };

  const kickBuffer = await getAudioBuffer(kickSrc);
  const snareBuffer = await getAudioBuffer(snareSrc);
  const hihatBuffer = await getAudioBuffer(hihatSrc);
  const guitarBuffer = await getAudioBuffer(guitarSrc);

  const playWebAudioApiSample = async (buffer) => {
    // todo - this is a dirty hack. figure out why other samples don't play through shifter. are they too short?
    if (buffer === guitarBuffer) {
      const shifter = new PitchShifter(audioContext, buffer, 1024);
      shifter.pitchSemitones = pitchSlider.value;
      shifter.tempo = bpmSlider.value / INITIAL_BPM;
      audioContext.resume();
      shifter.connect(audioContext.destination);
    } else {
      const sampleSource = audioContext.createBufferSource();
      sampleSource.buffer = buffer;
      sampleSource.connect(audioContext.destination);
      sampleSource.start();
    }
  };

  ///

  const setBpm = (bpm) => {
    bpmSlider.value = bpm;
    bpmSliderLabel.innerText = `bpm: ${bpm}`;

    const newRate = bpm / INITIAL_BPM;
    tonePlayerGuitar.playbackRate = newRate;
    toneGrainPlayerGuitar.playbackRate = newRate;
    onSuperpoweredBpmChange(newRate);
  };
  setBpm(INITIAL_BPM);
  bpmSlider.oninput = (e) => setBpm(e.target.value);

  const setPitch = (pitch) => {
    pitchSlider.value = pitch;
    pitchSliderLabel.innerText = `pitch shift: ${pitch}`;

    tonePitchShift.pitch = pitch;
    onSuperpoweredPitchShiftChange(pitch);
  };
  setPitch(INITIAL_PITCH);
  pitchSlider.oninput = (e) => setPitch(e.target.value);

  ///

  const handlers = {
    superpowered: {
      kick: () => playSuperpoweredSample("kick"),
      snare: () => playSuperpoweredSample("snare"),
      hihat: () => playSuperpoweredSample("hihat"),
      guitar: () => playSuperpoweredSample("guitar"),
    },
    tonePlayer: {
      kick: () => tonePlayerKick.start(),
      snare: () => tonePlayerSnare.start(),
      hihat: () => tonePlayerHihat.start(),
      guitar: () => {
        tonePlayerGuitar.start();

        if (pitchCompensationCheckbox.checked) {
          const playbackRate = bpmSlider.value / INITIAL_BPM;
          const calculatedPitchOffset = 12 * Math.log2(playbackRate);
          setPitch(calculatedPitchOffset * -1);
        }
      },
    },
    toneGrainPlayer: {
      kick: () => toneGrainPlayerKick.start(),
      snare: () => toneGrainPlayerSnare.start(),
      hihat: () => toneGrainPlayerHihat.start(),
      guitar: () => toneGrainPlayerGuitar.start(),
    },
    webAudioApiSoundtouch: {
      kick: () => playWebAudioApiSample(kickBuffer),
      snare: () => playWebAudioApiSample(snareBuffer),
      hihat: () => playWebAudioApiSample(hihatBuffer),
      guitar: () => playWebAudioApiSample(guitarBuffer),
    },
  };

  document.getElementById("btn3").onclick = handlers.superpowered.kick;
  document.getElementById("btn4").onclick = handlers.superpowered.snare;
  document.getElementById("btn5").onclick = handlers.superpowered.hihat;
  document.getElementById("btn6").onclick = handlers.superpowered.guitar;
  document.getElementById("btne").onclick = handlers.tonePlayer.kick;
  document.getElementById("btnr").onclick = handlers.tonePlayer.snare;
  document.getElementById("btnt").onclick = handlers.tonePlayer.hihat;
  document.getElementById("btny").onclick = handlers.tonePlayer.guitar;
  document.getElementById("btnd").onclick = handlers.toneGrainPlayer.kick;
  document.getElementById("btnf").onclick = handlers.toneGrainPlayer.snare;
  document.getElementById("btng").onclick = handlers.toneGrainPlayer.hihat;
  document.getElementById("btnh").onclick = handlers.toneGrainPlayer.guitar;
  document.getElementById("btnc").onclick = handlers.webAudioApiSoundtouch.kick;
  document.getElementById("btnv").onclick =
    handlers.webAudioApiSoundtouch.snare;
  document.getElementById("btnb").onclick =
    handlers.webAudioApiSoundtouch.hihat;
  document.getElementById("btnn").onclick =
    handlers.webAudioApiSoundtouch.guitar;

  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "3":
        handlers.superpowered.kick();
        break;
      case "4":
        handlers.superpowered.snare();
        break;
      case "5":
        handlers.superpowered.hihat();
        break;
      case "6":
        handlers.superpowered.guitar();
        break;
      case "e":
        handlers.tonePlayer.kick();
        break;
      case "r":
        handlers.tonePlayer.snare();
        break;
      case "t":
        handlers.tonePlayer.hihat();
        break;
      case "y":
        handlers.tonePlayer.guitar();
        break;
      case "d":
        handlers.toneGrainPlayer.kick();
        break;
      case "f":
        handlers.toneGrainPlayer.snare();
        break;
      case "g":
        handlers.toneGrainPlayer.hihat();
        break;
      case "h":
        handlers.toneGrainPlayer.guitar();
        break;
      case "c":
        handlers.webAudioApiSoundtouch.kick();
        break;
      case "v":
        handlers.webAudioApiSoundtouch.snare();
        break;
      case "b":
        handlers.webAudioApiSoundtouch.hihat();
        break;
      case "n":
        handlers.webAudioApiSoundtouch.guitar();
        break;
    }
  });
};

document.addEventListener("DOMContentLoaded", main);
