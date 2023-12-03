import {ADS1x15} from './newCode.js';

const chip = 1; //0 for ads1015, 1 for ads1115
const adc = new ADS1x15(chip);
const channel = 0; //channel 0, 1, 2, or 3...
const sps = 860; // see index.js for allowed values for your chip // samples per second
const pga = 4096; // see index.js for allowed values for your chip // programmable gain amplifier

// const test2 = async () => {
//   if (!adc.busy) {
//     const data = await adc.promiseToReadADCSingleEnded({channel, pga, sps});
//     console.log(data);
//   }
// };

// test2().catch(console.error);

const test2 = async () => {
  if (!adc.busy) {
    const readings = [];
    const startTime = Date.now(); // Record start time

    for (let i = 0; i < 100; i++) {
      const data = await adc.promiseToReadADCSingleEnded({channel, pga, sps});
      readings.push(data); // Collect each reading
    }

    const endTime = Date.now(); // Record end time
    const duration = endTime - startTime; // Calculate the duration

    console.log('Readings: ', readings);
    console.log(`Time taken for 100 readings: ${duration} milliseconds`);
  }
};

test2().catch(console.error);
