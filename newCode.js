import i2c from 'i2c';

// This is a rewrite of the Adafruit Python ADS1x15 library.
// Taken from the https://github.com/alphacharlie/node-ads1x15 conversion to javascript
// Then rewritten in 2023 to use async/await and promises instead of callbacks
// by chatGPT4 Turbo.

// Constants and Configuration Objects
const IC_ADS1015 = 0x00;
const IC_ADS1115 = 0x01;

// Pointer Register
// eslint-disable-next-line no-unused-vars
const ADS1015_REG_POINTER_MASK = 0x03;
const ADS1015_REG_POINTER_CONVERT = 0x00;
const ADS1015_REG_POINTER_CONFIG = 0x01;
const ADS1015_REG_POINTER_LOWTHRESH = 0x02;
const ADS1015_REG_POINTER_HITHRESH = 0x03;

// Config Register
// eslint-disable-next-line no-unused-vars
const ADS1015_REG_CONFIG_OS_MASK = 0x8000;
const ADS1015_REG_CONFIG_OS_SINGLE = 0x8000; // Write: Set to start a single-conversion
// eslint-disable-next-line no-unused-vars
const ADS1015_REG_CONFIG_OS_BUSY = 0x0000; // Read: Bit = 0 when conversion is in progress
// eslint-disable-next-line no-unused-vars
const ADS1015_REG_CONFIG_OS_NOTBUSY = 0x8000; // Read: Bit = 1 when device is not performing a conversion
// eslint-disable-next-line no-unused-vars
const ADS1015_REG_CONFIG_MUX_MASK = 0x7000;
const ADS1015_REG_CONFIG_MUX_DIFF_0_1 = 0x0000; // Differential P = AIN0, N = AIN1 (default)
const ADS1015_REG_CONFIG_MUX_DIFF_0_3 = 0x1000; // Differential P = AIN0, N = AIN3
const ADS1015_REG_CONFIG_MUX_DIFF_1_3 = 0x2000; // Differential P = AIN1, N = AIN3
const ADS1015_REG_CONFIG_MUX_DIFF_2_3 = 0x3000; // Differential P = AIN2, N = AIN3
const ADS1015_REG_CONFIG_MUX_SINGLE_0 = 0x4000; // Single-ended AIN0
const ADS1015_REG_CONFIG_MUX_SINGLE_1 = 0x5000; // Single-ended AIN1
const ADS1015_REG_CONFIG_MUX_SINGLE_2 = 0x6000; // Single-ended AIN2
const ADS1015_REG_CONFIG_MUX_SINGLE_3 = 0x7000; // Single-ended AIN3
// eslint-disable-next-line no-unused-vars
const ADS1015_REG_CONFIG_PGA_MASK = 0x0e00;
const ADS1015_REG_CONFIG_PGA_6_144V = 0x0000; // +/-6.144V range
const ADS1015_REG_CONFIG_PGA_4_096V = 0x0200; // +/-4.096V range
const ADS1015_REG_CONFIG_PGA_2_048V = 0x0400; // +/-2.048V range (default)
const ADS1015_REG_CONFIG_PGA_1_024V = 0x0600; // +/-1.024V range
const ADS1015_REG_CONFIG_PGA_0_512V = 0x0800; // +/-0.512V range
const ADS1015_REG_CONFIG_PGA_0_256V = 0x0a00; // +/-0.256V range
// eslint-disable-next-line no-unused-vars
const ADS1015_REG_CONFIG_MODE_MASK = 0x0100;
const ADS1015_REG_CONFIG_MODE_CONTIN = 0x0000; // Continuous conversion mode
const ADS1015_REG_CONFIG_MODE_SINGLE = 0x0100; // Power-down single-shot mode (default)
// eslint-disable-next-line no-unused-vars
const ADS1015_REG_CONFIG_DR_MASK = 0x00e0;
const ADS1015_REG_CONFIG_DR_128SPS = 0x0000; // 128 samples per second
const ADS1015_REG_CONFIG_DR_250SPS = 0x0020; // 250 samples per second
const ADS1015_REG_CONFIG_DR_490SPS = 0x0040; // 490 samples per second
const ADS1015_REG_CONFIG_DR_920SPS = 0x0060; // 920 samples per second
const ADS1015_REG_CONFIG_DR_1600SPS = 0x0080; // 1600 samples per second (default)
const ADS1015_REG_CONFIG_DR_2400SPS = 0x00a0; // 2400 samples per second
const ADS1015_REG_CONFIG_DR_3300SPS = 0x00c0; // 3300 samples per second (also 0x00E0)
const ADS1115_REG_CONFIG_DR_8SPS = 0x0000; // 8 samples per second
const ADS1115_REG_CONFIG_DR_16SPS = 0x0020; // 16 samples per second
const ADS1115_REG_CONFIG_DR_32SPS = 0x0040; // 32 samples per second
const ADS1115_REG_CONFIG_DR_64SPS = 0x0060; // 64 samples per second
const ADS1115_REG_CONFIG_DR_128SPS = 0x0080; // 128 samples per second
const ADS1115_REG_CONFIG_DR_250SPS = 0x00a0; // 250 samples per second (default)
const ADS1115_REG_CONFIG_DR_475SPS = 0x00c0; // 475 samples per second
const ADS1115_REG_CONFIG_DR_860SPS = 0x00e0; // 860 samples per second
// eslint-disable-next-line no-unused-vars
const ADS1015_REG_CONFIG_CMODE_MASK = 0x0010;
const ADS1015_REG_CONFIG_CMODE_TRAD = 0x0000; // Traditional comparator with hysteresis (default)
const ADS1015_REG_CONFIG_CMODE_WINDOW = 0x0010; // Window comparator
// eslint-disable-next-line no-unused-vars
const ADS1015_REG_CONFIG_CPOL_MASK = 0x0008;
const ADS1015_REG_CONFIG_CPOL_ACTVLOW = 0x0000; // ALERT/RDY pin is low when active (default)
const ADS1015_REG_CONFIG_CPOL_ACTVHI = 0x0008; // ALERT/RDY pin is high when active
// eslint-disable-next-line no-unused-vars
const ADS1015_REG_CONFIG_CLAT_MASK = 0x0004; // Determines if ALERT/RDY pin latches once asserted
const ADS1015_REG_CONFIG_CLAT_NONLAT = 0x0000; // Non-latching comparator (default)
const ADS1015_REG_CONFIG_CLAT_LATCH = 0x0004; // Latching comparator
// eslint-disable-next-line no-unused-vars
const ADS1015_REG_CONFIG_CQUE_MASK = 0x0003;
const ADS1015_REG_CONFIG_CQUE_1CONV = 0x0000; // Assert ALERT/RDY after one conversions
const ADS1015_REG_CONFIG_CQUE_2CONV = 0x0001; // Assert ALERT/RDY after two conversions
const ADS1015_REG_CONFIG_CQUE_4CONV = 0x0002; // Assert ALERT/RDY after four conversions
const ADS1015_REG_CONFIG_CQUE_NONE = 0x0003; // Disable the comparator and put ALERT/RDY in high state (default)

// This is a javascript port of python, so use objects instead of dictionaries here
// These simplify and clean the code (avoid the abuse of if/elif/else clauses)
const spsADS1115 = {
  8: ADS1115_REG_CONFIG_DR_8SPS,
  16: ADS1115_REG_CONFIG_DR_16SPS,
  32: ADS1115_REG_CONFIG_DR_32SPS,
  64: ADS1115_REG_CONFIG_DR_64SPS,
  128: ADS1115_REG_CONFIG_DR_128SPS,
  250: ADS1115_REG_CONFIG_DR_250SPS,
  475: ADS1115_REG_CONFIG_DR_475SPS,
  860: ADS1115_REG_CONFIG_DR_860SPS,
};

const spsADS1015 = {
  128: ADS1015_REG_CONFIG_DR_128SPS,
  250: ADS1015_REG_CONFIG_DR_250SPS,
  490: ADS1015_REG_CONFIG_DR_490SPS,
  920: ADS1015_REG_CONFIG_DR_920SPS,
  1600: ADS1015_REG_CONFIG_DR_1600SPS,
  2400: ADS1015_REG_CONFIG_DR_2400SPS,
  3300: ADS1015_REG_CONFIG_DR_3300SPS,
};

// Dictionary with the programable gains

const pgaADS1x15 = {
  6144: ADS1015_REG_CONFIG_PGA_6_144V,
  4096: ADS1015_REG_CONFIG_PGA_4_096V,
  2048: ADS1015_REG_CONFIG_PGA_2_048V,
  1024: ADS1015_REG_CONFIG_PGA_1_024V,
  512: ADS1015_REG_CONFIG_PGA_0_512V,
  256: ADS1015_REG_CONFIG_PGA_0_256V,
};

// ADS1x15 Class
export class ADS1x15 {
  constructor(ic = IC_ADS1015, address = 0x48, i2cDev = '/dev/i2c-1') {
    if (!(ic === IC_ADS1015 || ic === IC_ADS1115)) {
      throw new Error('Not a supported device');
    }
    this.ic = ic;
    this.address = address;
    this.pga = 6144; // default value
    this.wire = new i2c(address, {device: i2cDev});
    this.busy = false;
  }

  // Gets a single-ended ADC reading from the specified channel in mV. \
  // The sample rate for this mode (single-shot) can be used to lower the noise \
  // (low sps) or to lower the power consumption (high sps) by duty cycling, \
  // see datasheet page 14 for more info. \
  // The pga must be given in mV, see page 13 for the supported values.

  // Method to read ADC Single Ended

  async promiseToReadADCSingleEnded({channel = 0, pga = 6144, sps = 250}) {
    if (this.busy) {
      throw new Error('ADC is busy');
    }
    this.busy = true;

    try {
      // Ensure the channel is valid
      if (channel < 0 || channel > 3) {
        throw new Error('Channel must be between 0 and 3');
      }

      // Disable comparator, Non-latching, Alert/Rdy active low
      // Traditional comparator, single-shot mode
      let config = ADS1015_REG_CONFIG_CQUE_NONE | ADS1015_REG_CONFIG_CLAT_NONLAT | ADS1015_REG_CONFIG_CPOL_ACTVLOW | ADS1015_REG_CONFIG_CMODE_TRAD | ADS1015_REG_CONFIG_MODE_SINGLE;

      // Set the SPS and PGA
      config |= this._getSPSConfig(sps) | this._getPGAConfig(pga);

      // Set the channel to be converted
      config |= this._getChannelConfig(channel);

      // Start the conversion
      config |= ADS1015_REG_CONFIG_OS_SINGLE;

      // Write configuration to the ADC
      await this._writeConfig(config);

      // Wait for the conversion to complete
      const delay = Math.ceil(1000 / sps + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Read the conversion results
      const result = await this._readConversion();
      this.busy = false;
      return result;
    } catch (err) {
      this.busy = false;
      throw err;
    }
  }

  //The startContinuousConversion method for the ADS1x15 class is used to
  // initiate continuous ADC conversion on a specified channel.
  // This method will configure the ADC for continuous mode,
  // set the desired channel, programmable gain amplifier (PGA),
  // and samples per second (SPS), and then start the conversion.
  //    The method first checks if the ADC is busy. If so, it throws an error.

  async promiseToStartContinuousConversion({channel = 0, pga = 6144, sps = 250}) {
    if (this.busy) {
      throw new Error('ADC is busy');
    }
    this.busy = true;

    try {
      // Validate the channel
      if (channel < 0 || channel > 3) {
        throw new Error('Channel must be between 0 and 3');
      }

      // Configure the ADC for continuous conversion mode
      let config = ADS1015_REG_CONFIG_CQUE_NONE | ADS1015_REG_CONFIG_CLAT_NONLAT | ADS1015_REG_CONFIG_CPOL_ACTVLOW | ADS1015_REG_CONFIG_CMODE_TRAD | ADS1015_REG_CONFIG_MODE_CONTIN;

      // Set the SPS and PGA
      config |= this._getSPSConfig(sps) | this._getPGAConfig(pga);

      // Set the channel to be converted
      config |= this._getChannelConfig(channel);

      // Write configuration to the ADC
      await this._writeConfig(config);

      // Delay based on SPS to allow for initial conversion
      const delay = Math.ceil(1000 / sps + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Read the initial conversion result (and discard it)
      await this._readConversion();

      // The ADC is now in continuous conversion mode
      return 'Continuous conversion started';
    } catch (err) {
      this.busy = false;
      throw err;
    }
  }

  // The stopContinuousConversion method in the ADS1x15 class is used
  // to stop the ADC's continuous conversion mode
  // and reset its configuration to a default or power-off state.
  async PromiseToStopContinuousConversion() {
    if (this.busy) {
      throw new Error('ADC is busy');
    }
    this.busy = true;

    try {
      // Set the configuration to its default value
      const defaultConfig = 0x8583; // Default configuration value (check datasheet for details)

      // Write the default configuration to the ADC
      await this._writeConfig(defaultConfig);

      this.busy = false;
      return 'Continuous conversion stopped';
    } catch (err) {
      this.busy = false;
      throw err;
    }
  }

  //The getLastConversionResults method in the ADS1x15 class
  // is used to retrieve the most recent conversion result
  // from the ADC, especially useful in continuous conversion mode.
  async promiseToGetLastConversionResults() {
    if (this.busy) {
      throw new Error('ADC is currently busy with another operation');
    }
    this.busy = true;

    try {
      // Read the conversion result from the ADC
      const result = await this._readConversion();

      this.busy = false;
      return result;
    } catch (err) {
      this.busy = false;
      throw err;
    }
  }

  // The startSingleEndedComparator method in the ADS1x15 class configures the device
  // to start the comparator mode on a specified single-ended channel.
  // This mode allows the device to generate an alert when the ADC value exceeds
  // a specified high threshold or falls below a specified low threshold.

  async promiseToStartSingleEndedComparator({channel, thresholdHigh, thresholdLow, pga = 6144, sps = 250, activeLow = true, traditionalMode = true, latching = false, numReadings = 1}) {
    if (this.busy) {
      throw new Error('ADC is busy');
    }
    this.busy = true;

    try {
      // Validate the channel
      if (channel < 0 || channel > 3) {
        throw new Error('Channel must be between 0 and 3');
      }

      // Configure the comparator mode
      let config =
        ADS1015_REG_CONFIG_MODE_CONTIN |
        (activeLow ? ADS1015_REG_CONFIG_CPOL_ACTVLOW : ADS1015_REG_CONFIG_CPOL_ACTVHI) |
        (traditionalMode ? ADS1015_REG_CONFIG_CMODE_TRAD : ADS1015_REG_CONFIG_CMODE_WINDOW) |
        (latching ? ADS1015_REG_CONFIG_CLAT_LATCH : ADS1015_REG_CONFIG_CLAT_NONLAT);

      switch (numReadings) {
        case 1:
          config |= ADS1015_REG_CONFIG_CQUE_1CONV;
          break;
        case 2:
          config |= ADS1015_REG_CONFIG_CQUE_2CONV;
          break;
        case 4:
          config |= ADS1015_REG_CONFIG_CQUE_4CONV;
          break;
        default:
          throw new Error('Invalid numReadings value');
      }

      // Set the SPS and PGA
      config |= this._getSPSConfig(sps) | this._getPGAConfig(pga);

      // Set the channel to be converted
      config |= this._getChannelConfig(channel);

      // Write the high and low threshold values
      await this._writeThreshold(ADS1015_REG_POINTER_HITHRESH, thresholdHigh);
      await this._writeThreshold(ADS1015_REG_POINTER_LOWTHRESH, thresholdLow);

      // Write configuration to the ADC
      await this._writeConfig(config);

      this.busy = false;
      return 'Single-ended comparator started';
    } catch (err) {
      this.busy = false;
      throw err;
    }
  }

  // The startDifferentialComparator method in the ADS1x15 class configures the device
  // to start the comparator mode on specified differential channels.
  // This mode allows the device to generate an alert when the differential ADC value
  // exceeds a specified high threshold or falls below a specified low threshold.
  async promiseToStartDifferentialComparator({chP, chN, thresholdHigh, thresholdLow, pga = 6144, sps = 250, activeLow = true, traditionalMode = true, latching = false, numReadings = 1}) {
    if (this.busy) {
      throw new Error('ADC is busy');
    }
    this.busy = true;

    try {
      // Configure the comparator mode
      let config =
        ADS1015_REG_CONFIG_MODE_CONTIN |
        (activeLow ? ADS1015_REG_CONFIG_CPOL_ACTVLOW : ADS1015_REG_CONFIG_CPOL_ACTVHI) |
        (traditionalMode ? ADS1015_REG_CONFIG_CMODE_TRAD : ADS1015_REG_CONFIG_CMODE_WINDOW) |
        (latching ? ADS1015_REG_CONFIG_CLAT_LATCH : ADS1015_REG_CONFIG_CLAT_NONLAT);

      switch (numReadings) {
        case 1:
          config |= ADS1015_REG_CONFIG_CQUE_1CONV;
          break;
        case 2:
          config |= ADS1015_REG_CONFIG_CQUE_2CONV;
          break;
        case 4:
          config |= ADS1015_REG_CONFIG_CQUE_4CONV;
          break;
        default:
          throw new Error('Invalid numReadings value');
      }

      // Set the SPS and PGA
      config |= this._getSPSConfig(sps) | this._getPGAConfig(pga);

      // Set the differential channels to be converted
      config |= this._getDifferentialChannelConfig(chP, chN);

      // Write the high and low threshold values
      await this._writeThreshold(ADS1015_REG_POINTER_HITHRESH, thresholdHigh);
      await this._writeThreshold(ADS1015_REG_POINTER_LOWTHRESH, thresholdLow);

      // Write configuration to the ADC
      await this._writeConfig(config);

      this.busy = false;
      return 'Differential comparator started';
    } catch (err) {
      this.busy = false;
      throw err;
    }
  }

  // private helper methods

  // Private method to write bytes
  _writeBytes = (pointer, bytes) => {
    return new Promise((resolve, reject) => {
      this.wire.writeBytes(pointer, bytes, function (err) {
        if (err) {
          reject(new Error(`Write error: ${err}`));
        } else {
          resolve();
        }
      });
    });
  };

  //_getSPSConfig: This function takes the samples per second (SPS) as an argument
  // and returns the corresponding configuration value
  // from the spsADS1015 or spsADS1115 dictionary, depending on the ADC type (ADS1015 or ADS1115).
  _getSPSConfig = (sps) => {
    const spsConfig = this.ic === IC_ADS1015 ? spsADS1015[sps] : spsADS1115[sps];
    if (!spsConfig) {
      throw new Error(`Invalid SPS specified: ${sps}`);
    }
    return spsConfig;
  };

  // _getPGAConfig: This function takes the programmable gain amplifier (PGA) setting
  // as an argument and returns the corresponding configuration value
  // from the pgaADS1x15 dictionary.
  _getPGAConfig = (pga) => {
    const pgaConfig = pgaADS1x15[Number(pga)];
    if (!pgaConfig) {
      throw new Error(`Invalid PGA specified: ${pga}`);
    }
    return pgaConfig;
  };

  //_getChannelConfig: This function takes the channel number as an argument
  // and returns the corresponding configuration value for the ADC MUX setting.
  _getChannelConfig = (channel) => {
    switch (channel) {
      case 0:
        return ADS1015_REG_CONFIG_MUX_SINGLE_0;
      case 1:
        return ADS1015_REG_CONFIG_MUX_SINGLE_1;
      case 2:
        return ADS1015_REG_CONFIG_MUX_SINGLE_2;
      case 3:
        return ADS1015_REG_CONFIG_MUX_SINGLE_3;
      default:
        throw new Error(`Invalid channel specified: ${channel}`);
    }
  };

  //_writeConfig: This function takes the configuration value, converts it to bytes,
  // and writes it to the ADC configuration register.
  _writeConfig = async (config) => {
    const bytes = [(config >> 8) & 0xff, config & 0xff];
    await this._writeBytes(ADS1015_REG_POINTER_CONFIG, bytes);
  };

  // _readConversion: This function reads the conversion result from the ADC.
  _readConversion = async () => {
    return new Promise((resolve, reject) => {
      this.wire.readBytes(ADS1015_REG_POINTER_CONVERT, 2, function (err, res) {
        if (err) {
          reject(new Error(`Read error: ${err}`));
        } else {
          let result;
          if (this.ic === IC_ADS1015) {
            // Process the result for ADS1015
            result = ((((res[0] << 8) | (res[1] & 0xff)) >> 4) * this.pga) / 2048.0;
          } else {
            // Process the result for ADS1115
            const val = (res[0] << 8) | res[1];
            result = val > 0x7fff ? ((val - 0xffff) * this.pga) / 32768.0 : (val * this.pga) / 32768.0;
          }
          resolve(result);
        }
      });
    });
  };

  _writeThreshold = async (pointer, threshold) => {
    // Convert the threshold value to bytes
    const thresholdWord = this.ic === IC_ADS1015 ? Math.round(threshold * (2048.0 / this.pga)) : Math.round(threshold * (32767.0 / this.pga));

    const bytes = [(thresholdWord >> 8) & 0xff, thresholdWord & 0xff];
    await this._writeBytes(pointer, bytes);
  };

  _getDifferentialChannelConfig = (chP, chN) => {
    if (chP === 0 && chN === 1) {
      return ADS1015_REG_CONFIG_MUX_DIFF_0_1;
    }
    if (chP === 0 && chN === 3) {
      return ADS1015_REG_CONFIG_MUX_DIFF_0_3;
    }
    if (chP === 1 && chN === 3) {
      return ADS1015_REG_CONFIG_MUX_DIFF_1_3;
    }
    if (chP === 2 && chN === 3) {
      return ADS1015_REG_CONFIG_MUX_DIFF_2_3;
    }
    throw new Error(`Invalid differential channel pair: ${chP}, ${chN}`);
  };
}
