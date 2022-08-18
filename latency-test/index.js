const main = async () => {
  const kickSrc = "https://yonih.github.io/latency-test/samples/kick.wav";
  const snareSrc = "https://yonih.github.io/latency-test/samples/snare.wav";
  const hihatSrc = "https://yonih.github.io/latency-test/samples/hihat.wav";

  const initBtn = document.getElementById("init");
  const descriptionDiv = document.getElementById("description");

  descriptionDiv.style.display = "none";

  // tone.js loading

  const tonePlayerKick = new Tone.Player(kickSrc).toDestination();
  const tonePlayerSnare = new Tone.Player(snareSrc).toDestination();
  const tonePlayerHihat = new Tone.Player(hihatSrc).toDestination();

  initBtn.onclick = () => {
    Tone.start();
    Tone.immediate();
    Tone.setContext(
      new Tone.Context({ latencyHint: "interactive", lookAhead: 0 })
    );

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

  const playWebAudioApiSample = async (buffer) => {
    const sampleSource = audioContext.createBufferSource();
    sampleSource.buffer = buffer;
    sampleSource.connect(audioContext.destination);
    sampleSource.start();
  };

  ///

  document.addEventListener("keydown", () => {
    switch (event.key) {
      case "e":
        tonePlayerKick.start();
        break;
      case "r":
        tonePlayerSnare.start();
        break;
      case "t":
        tonePlayerHihat.start();
        break;
      case "d":
        playWebAudioApiSample(kickBuffer);
        break;
      case "f":
        playWebAudioApiSample(snareBuffer);
        break;
      case "g":
        playWebAudioApiSample(hihatBuffer);
        break;
    }
  });
};

document.addEventListener("DOMContentLoaded", main);
