// Create a scoping variable
if (typeof(EEVTest) == 'undefined') {
	var EEVTest = {};
}

const EEVBlog121GW = App.EEVBlog121GW;
const EEVBlog121GWParser = App.EEVBlog121GWParser;

const STALE_CLASS = 'stale';
const STATE_ELEMENT_SELECTOR = '[data-element-type="display_state"]'
const VALUE_ELEMENT_SELECTOR = '[data-element-type="display_value"]'

const ConnectionState = {
  disconnected: 'Not Connected',
  connecting: 'Connecting',
  connected: 'Connected',
  disconnecting: 'Disconnecting'
};

EEVTest.bluetoothDevice = null;
EEVTest.gattServer = null;
EEVTest.measurementCharacteristic = null;

EEVTest.meter = new EEVBlog121GW();

EEVTest.connectMeterButtonClick = function() {
  EEVTest.requestDevice()
  .then(EEVTest.connectDeviceAndCacheCharacteristics)
  .catch(error => {
    log('Argh! ' + error);
  });
}

EEVTest.requestDevice = function() {
  let result = Promise.resolve();
  if (!EEVTest.bluetoothDevice) {
    log('Requesting Bluetooth Device...');
    result = navigator.bluetooth.requestDevice(
      {filters: EEVTest.eevblog121gwDevices()})
    .then(device => {
      EEVTest.bluetoothDevice = device;
      EEVTest.bluetoothDevice.addEventListener('gattserverdisconnected', EEVTest.onDisconnected);
    });
  }
  return result;
}

EEVTest.connectDeviceAndCacheCharacteristics = function() {
  if (EEVTest.bluetoothDevice.gatt.connected) {
    EEVTest.updateUIForConnectionState(ConnectionState.connected);
    return Promise.resolve();
  }

  log('Connecting to GATT Server...');
  EEVTest.updateUIForConnectionState(ConnectionState.connecting);
  return EEVTest.bluetoothDevice.gatt.connect()
  .then(server => {
    EEVTest.updateUIForConnectionState(ConnectionState.connected);
    EEVTest.gattServer = server;
    log('Getting Measurement Service...');
    return EEVTest.gattServer.getPrimaryService('0bd51666-e7cb-469b-8e4d-2742f1ba77cc');
  })
  .then(measurementService => {
    log('Getting Measurement Characteristic...');
    return measurementService.getCharacteristic('e7add780-b042-4876-aae1-112855353cc1');
  })
  .then(characteristic => {
    EEVTest.measurementCharacteristic = characteristic;
    EEVTest.measurementCharacteristic.addEventListener('characteristicvaluechanged',
        EEVTest.handleMeasurementChanged);
    document.querySelector('#startNotifications').disabled = false;
    document.querySelector('#stopNotifications').disabled = true;
  });
}

/* This function will be called when `readValue` resolves and
 * characteristic value changes since `characteristicvaluechanged` event
 * listener has been added. */
EEVTest.handleMeasurementChanged = function(event) {
  EEVTest.setValueElementsStale(false);
  EEVTest.setStateElementsStale(false);
  let data = event.target.value;
  let parsingState = EEVTest.meter.processMessageData(data);
  if (parsingState === EEVBlog121GWParser.ParsingState.completed) {
    console.log("Meter state: ", EEVTest.meter.meterState);
    console.log("Main measure: ", EEVTest.meter.mainMeasure);
    console.log("Sub measure: ", EEVTest.meter.subMeasure);
    const displayValue = EEVTest.meter.mainMeasure.displayValue;
    console.log("Display value: " + displayValue);
    console.log("Sub display value: " + EEVTest.meter.subMeasure.displayValue);
    document.getElementById('measurement_mode').innerHTML = EEVTest.meter.meterState.mainModeDisplay;
    document.getElementById('measurement_value').innerHTML = displayValue.split(" ")[0];
    document.getElementById('measurement_units').innerHTML = displayValue.split(" ")[1];
  }
}

EEVTest.onDisconnected = function(event) {
  let device = event.target;
  log('Device ' + device.name + ' is disconnected.');
  EEVTest.updateUIForConnectionState(ConnectionState.disconnected);
  EEVTest.setStateElementsStale(true);
  EEVTest.setValueElementsStale(true);
}

EEVTest.onStartNotificationsButtonClick = function() {
  log('Starting Measurement Notifications...');
  EEVTest.measurementCharacteristic.startNotifications()
  .then(_ => {
    log('> Notifications started');
    document.querySelector('#startNotifications').disabled = true;
    document.querySelector('#stopNotifications').disabled = false;
  })
  .catch(error => {
    log('Argh! ' + error);
  });
}

EEVTest.onStopNotificationsButtonClick = function() {
  log('Stopping Measurement Notifications...');
  EEVTest.measurementCharacteristic.stopNotifications()
  .then(_ => {
    log('> Notifications stopped');
    document.querySelector('#startNotifications').disabled = false;
    document.querySelector('#stopNotifications').disabled = true;
  })
  .catch(error => {
    log('Argh! ' + error);
  });
}

EEVTest.onResetButtonClick = function() {
  if (!EEVTest.bluetoothDevice) {
    return;
  }
  log('Disconnecting from Bluetooth Device...');
  EEVTest.updateUIForConnectionState(ConnectionState.disconnecting);
  if (EEVTest.bluetoothDevice.gatt.connected) {
    EEVTest.bluetoothDevice.gatt.disconnect();
  } else {
    log('> Bluetooth Device is already disconnected');
  }
  EEVTest.bluetoothDevice = null;
}

EEVTest.updateUIForConnectionState = function(connectionState) {
  document.getElementById('connection_state').innerHTML = connectionState;
}

EEVTest.getAllStateElements = function() {
  var elements = document.querySelectorAll(STATE_ELEMENT_SELECTOR);
  return [].slice.call(elements);
}

EEVTest.getAllValueElements = function() {
  var elements = document.querySelectorAll(VALUE_ELEMENT_SELECTOR);
  return [].slice.call(elements);
}

EEVTest.setValueElementsStale = function(stale) {
  const elements = EEVTest.getAllValueElements();
  if (stale) {
    for (var element of elements) {
      element.classList.add(STALE_CLASS);
    }
  } else {
    for (var element of elements) {
      element.classList.remove(STALE_CLASS);
    }
  }
}

EEVTest.setStateElementsStale = function(stale) {
  const elements = EEVTest.getAllStateElements();
  if (stale) {
    for (var element of elements) {
      element.classList.add(STALE_CLASS);
    }
  } else {
    for (var element of elements) {
      element.classList.remove(STALE_CLASS);
    }
  }
}

/* Utils */
EEVTest.anyDevice = function() {
  // This is the closest we can get for now to get all devices.
  // https://github.com/WebBluetoothCG/web-bluetooth/issues/234
  return Array.from('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
      .map(c => ({namePrefix: c}))
      .concat({name: ''});
}

EEVTest.eevblog121gwDevices = function() {
  // To scan for just 121GW meters, look for the main (advertised) service
  // Note: the UUID must be lowercase!
  return [{services: ['0bd51666-e7cb-469b-8e4d-2742f1ba77cc']}];
}
