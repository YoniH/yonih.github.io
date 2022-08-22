import {
  SuperpoweredWebAudio,
  SuperpoweredTrackLoader,
} from "./superpowered/SuperpoweredWebAudio.js";

const keyMapping = {
  kick: {
    sample: "kick.wav",
    timeStretchEnabled: false,
    pitchShiftEnabled: false,
  },
  snare: {
    sample: "snare.wav",
    timeStretchEnabled: false,
    pitchShiftEnabled: false,
  },
  hihat: {
    sample: "hihat.wav",
    timeStretchEnabled: false,
    pitchShiftEnabled: false,
  },
  guitar: {
    sample: "guitar.wav",
    timeStretchEnabled: true,
    pitchShiftEnabled: true,
  },
};

const getSampleToKeyMapping = () => {
  const result = {};

  Object.keys(keyMapping).forEach((key) => {
    result[keyMapping[key].sample] = key;
  });

  return result;
};

const sampleToKeyMapping = getSampleToKeyMapping();

const SAMPLES_PATH = "../samples/";

const sampleToUrl = (sample) => `${SAMPLES_PATH}${sample}`;
const urlToSample = (url) => url.replace(SAMPLES_PATH, "");

class AudioProcessor extends SuperpoweredWebAudio.AudioWorkletProcessor {
  players = {};

  onReady() {
    Object.keys(keyMapping).forEach((key) => {
      SuperpoweredTrackLoader.downloadAndDecode(
        sampleToUrl(keyMapping[key].sample),
        this
      );
    });
  }

  onDestruct() {
    Object.keys(keyMapping).forEach((key) => {
      this.players[key].destruct();
    });
  }

  onMessageFromMainScope(message) {
    if (message.SuperpoweredLoaded) {
      const { buffer, url } = message.SuperpoweredLoaded;
      const key = sampleToKeyMapping[urlToSample(url)];
      this.players[key] = new this.Superpowered.AdvancedAudioPlayer(
        this.samplerate,
        2,
        2,
        0,
        0.501,
        2,
        false
      );
      this.players[key].openMemory(
        this.Superpowered.arrayBufferToWASM(buffer),
        false,
        false
      );

      this.sendMessageToMainScope({ loaded: { key, url, buffer } });
    }

    if (message.key) {
      const player = this.players[message.key];
      if (player) {
        player.seek(0);
        player.play();
      }
    }

    if (message.rate !== undefined) {
      Object.keys(keyMapping).forEach((key) => {
        if (keyMapping[key].timeStretchEnabled) {
          this.players[key].playbackRate = message.rate;
        }
      });
    }
    if (message.pitchShift !== undefined) {
      Object.keys(keyMapping).forEach((key) => {
        if (keyMapping[key].pitchShiftEnabled) {
          this.players[key].pitchShiftCents =
            parseInt(message.pitchShift) * 100;
        }
      });
    }
  }

  processAudio(inputBuffer, outputBuffer, buffersize, parameters) {
    let isMixing = false;

    Object.keys(this.players).forEach((key) => {
      const player = this.players[key];

      const hasAudioOutput = player.processStereo(
        outputBuffer.pointer,
        isMixing,
        buffersize,
        1
      );

      isMixing |= hasAudioOutput;

      if (!isMixing) {
        for (let n = 0; n < buffersize * 2; n++) outputBuffer.array[n] = 0;
      }
    });
  }
}

if (typeof AudioWorkletProcessor === "function")
  registerProcessor("AudioProcessor", AudioProcessor);
export default AudioProcessor;
