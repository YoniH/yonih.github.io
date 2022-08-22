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

  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "3":
        playSuperpoweredSample("kick");
        break;
      case "4":
        playSuperpoweredSample("snare");
        break;
      case "5":
        playSuperpoweredSample("hihat");
        break;
      case "6":
        playSuperpoweredSample("guitar");
        break;
      case "e":
        tonePlayerKick.start();
        break;
      case "r":
        tonePlayerSnare.start();
        break;
      case "t":
        tonePlayerHihat.start();
        break;
      case "y":
        tonePlayerGuitar.start();

        if (pitchCompensationCheckbox.checked) {
          const playbackRate = bpmSlider.value / INITIAL_BPM;
          const calculatedPitchOffset = 12 * Math.log2(playbackRate);
          setPitch(calculatedPitchOffset * -1);
        }

        break;
      case "d":
        toneGrainPlayerKick.start();
        break;
      case "f":
        toneGrainPlayerSnare.start();
        break;
      case "g":
        toneGrainPlayerHihat.start();
        break;
      case "h":
        toneGrainPlayerGuitar.start();
        break;
      case "c":
        playWebAudioApiSample(kickBuffer);
        break;
      case "v":
        playWebAudioApiSample(snareBuffer);
        break;
      case "b":
        playWebAudioApiSample(hihatBuffer);
        break;
      case "n":
        playWebAudioApiSample(guitarBuffer);
        break;
    }
  });
};

document.addEventListener("DOMContentLoaded", main);
