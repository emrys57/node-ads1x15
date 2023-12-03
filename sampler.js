import {ADS1x15} from './newCode.js';

class ADCSampler {
  constructor(adc, channel, pga, sps, interval = 200, maxReadings = 1000) {
    this.adc = adc;
    this.channel = channel;
    this.pga = pga;
    this.sps = sps;
    this.interval = interval;
    this.maxReadings = maxReadings;
    this.readings = [];
    this.timer = null;
  }

  startSampling() {
    if (this.timer) {
      console.log('Sampling is already in progress.');
      return;
    }

    this.timer = setInterval(async () => {
      if (!this.adc.busy) {
        try {
          const data = await this.adc.promiseToReadADCSingleEnded({channel: this.channel, pga: this.pga, sps: this.sps});
          this.addReading(data);
        } catch (error) {
          console.error('Error during ADC reading:', error);
        }
      }
    }, this.interval);
  }

  stopSampling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    } else {
      console.log('Sampling is not active.');
    }
  }

  addReading(reading) {
    if (this.readings.length >= this.maxReadings) {
      this.readings.shift(); // Remove the oldest reading
    }
    this.readings.push(reading); // Add the new reading
    console.log(this._formatNumber(reading));
  }

  getReadings() {
    return this.readings;
  }

  _formatNumber = (number) => {
    let parts = number.toString().split('.');
    let integerPart = parts[0].padStart(4, '0');
    let decimalPart = parts[1] ? parts[1].padEnd(3, '0') : '000';

    // If the original number has more than 3 decimal places, round it to 3
    if (parts[1] && parts[1].length > 3) {
      return number.toFixed(3).padStart(8, '0');
    } else {
      return integerPart + '.' + decimalPart;
    }
  };
}

const adc = new ADS1x15(1);
const channel = 0;
const pga = 4096;
const sps = 8;

// Example usage
const adcSampler = new ADCSampler(adc, channel, pga, sps);
adcSampler.startSampling();

// To stop sampling, call adcSampler.stopSampling();
// To get the readings, call adcSampler.getReadings();
