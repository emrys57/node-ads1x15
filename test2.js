import {ADS1x15} from './newCode.js';

const chip = 1; //0 for ads1015, 1 for ads1115
const adc = new ADS1x15(chip);
const channel = 0; //channel 0, 1, 2, or 3...
const samplesPerSecond = '250'; // see index.js for allowed values for your chip
const progGainAmp = '4096'; // see index.js for allowed values for your chip

const test2 = async () => {
  if (!adc.busy) {
    const data = await adc.promiseToReadADCSingleEnded({adc, channel, progGainAmp, samplesPerSecond});
    console.log(data);
  }
};

test2().catch(console.error);
