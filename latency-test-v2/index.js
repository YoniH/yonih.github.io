const main = async () => {
  const kickSrc = "https://yonih.github.io/latency-test/samples/kick.wav";
  const snareSrc = "https://yonih.github.io/latency-test/samples/snare.wav";
  const hihatSrc = "https://yonih.github.io/latency-test/samples/hihat.wav";
  const guitarSrc = "https://yonih.github.io/latency-test/samples/guitar.wav";

  const initBtn = document.getElementById("init");
  const descriptionDiv = document.getElementById("description");

  descriptionDiv.style.display = "none";

  // tone.js loading

  const tonePlayerKick = new Tone.Player(kickSrc).toDestination();
  const tonePlayerSnare = new Tone.Player(snareSrc).toDestination();
  const tonePlayerHihat = new Tone.Player(hihatSrc).toDestination();
  const tonePlayerGuitar = new Tone.GrainPlayer(guitarSrc).toDestination();

  const toneGrainPlayerKick = new Tone.GrainPlayer(kickSrc).toDestination();
  const toneGrainPlayerSnare = new Tone.GrainPlayer(snareSrc).toDestination();
  const toneGrainPlayerHihat = new Tone.GrainPlayer(hihatSrc).toDestination();
  const toneGrainPlayerGuitar = new Tone.GrainPlayer(guitarSrc).toDestination();

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
    const sampleSource = audioContext.createBufferSource();
    sampleSource.buffer = buffer;
    sampleSource.connect(audioContext.destination);
    sampleSource.start();
  };

  ///

  document.addEventListener("keydown", (e) => {
    switch (e.target.key) {
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
