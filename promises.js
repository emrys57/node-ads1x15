// promises to access the ADS1x15

// single-ended read
const promiseToRead = async ({
  adc,
  channel,
  progGainAmp,
  samplesPerSecond,
}) => {
  return new Promise((resolve, reject) => {
    adc.readADCSingleEnded(
      channel,
      progGainAmp,
      samplesPerSecond,
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
};

module.exports = {
  promiseToRead,
};
