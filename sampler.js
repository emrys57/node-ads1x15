import {ADS1x15} from './newCode.js';
import {WebSocketServer} from 'ws';

class ADCSampler {
  constructor(adc, channels, pga, sps, interval = 200, maxReadings = 5000) {
    this.adc = adc;
    this.channels = channels;
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
          for (const channel of this.channels) {
            const time = Date.now();
            const reading = await this.adc.promiseToReadADCSingleEnded({channel, pga: this.pga, sps: this.sps});
            this.addReading({channel, time, reading});
          }
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
    if (this.readings.length >= this.maxReadings) {
      this.readings.shift(); // Remove the oldest reading
    }
    this.readings.push(data); // Add the new reading
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        // This is WebSocket.OPEN
        client.send(JSON.stringify(data));
        console.log(this._formatNumber(data?.reading), 'sent');
      }
    });
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
const channels = [0, 1];
const pga = 4096;
const sps = 32;

// Example usage
const adcSampler = new ADCSampler(adc, channels, pga, sps);
adcSampler.startSampling();

// To stop sampling, call adcSampler.stopSampling();
// To get the readings, call adcSampler.getReadings();

const wss = new WebSocketServer({port: 8080});

wss.on('connection', function connection(ws) {
  console.log('Client connected');
  const readings = adcSampler.getReadings();
  if (readings.length > 0) {
    // Send all the readings we have when a client connects so they can draw the chart
    ws.send(JSON.stringify(readings));
  }
  ws.on('message', (message) => {
    console.log('received: %s', message);
  });
  ws.on('close', () => {
    console.log('Client disconnected');
  });
  ws.on('error', console.error);
  // Your WebSocket handling code here
});
