import {ADS1x15} from './newCode.js';
import {WebSocketServer} from 'ws';

const wss = new WebSocketServer({port: 8080});
let connected = false;

wss.on('connection', function connection(ws) {
  console.log('Client connected');
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  // Your WebSocket handling code here
  connected = true;
});

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
          const reading = await this.adc.promiseToReadADCSingleEnded({channel: this.channel, pga: this.pga, sps: this.sps});
          const time = Date.now();
          this.addReading({time, reading});
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

  addReading(data) {
    // if (this.readings.length >= this.maxReadings) {
    //   this.readings.shift(); // Remove the oldest reading
    // }
    // this.readings.push(reading); // Add the new reading
    if (connected) {
      wss.clients.forEach((client) => {
        console.log(`readyState: ${client.readyState}`);
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
    console.log(this._formatNumber(data?.reading));
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
