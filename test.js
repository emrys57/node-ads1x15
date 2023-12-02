import ads1x15 from 'node-ads1x15';
import {promiseToRead} from './promises.js';

const chip = 1; //0 for ads1015, 1 for ads1115

//Simple usage (default ADS address on pi 2b or 3):
const adc = new ads1x15(chip);

// Optionally i2c address as (chip, address) or (chip, address, i2c_dev)
// So to use  /dev/i2c-0 use the line below instead...:
//    const adc = new ads1x15(chip, 0x48, 'dev/i2c-0');

const channel = 0; //channel 0, 1, 2, or 3...
const samplesPerSecond = '250'; // see index.js for allowed values for your chip
const progGainAmp = '4096'; // see index.js for allowed values for your chip

const test1 = async () => {
  if (!adc.busy) {
    const data = await promiseToRead({adc, channel, progGainAmp, samplesPerSecond});
    console.log(data);
  }
};

test1().catch(console.error);
