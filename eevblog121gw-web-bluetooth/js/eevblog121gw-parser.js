(function (window) {
  'use strict';
  var App = window.App || {};

  function EEVBlog121GWParser() {
    this.reset();
  }

  EEVBlog121GWParser.ParsingState = {
      not_started: 'not started',
      in_progress: 'in progress',
      completed: 'completed',
      error: 'error'
  };
  const ParsingState = EEVBlog121GWParser.ParsingState;

  EEVBlog121GWParser.prototype.reset = function() {
    this.state = ParsingState.not_started;
    this.measurement = null;
    this.subMeasurement = null;
    this.meterState = null;
    this.data = null;
    this.offset = 0;
    this.responsePrefix = null;
    this.yearByte = null;
    this.monthByte = null;
    this.serialNumber = null;
    this.mainModeByte = null;
    this.mainRangeByte = null;
    this.mainValue = null;
    this.subModeByte = null;
    this.subRangeByte = null;
    this.subValue = null;
    this.barStatusByte = null;
    this.barValueByte = null;
    this.iconStatus1 = null;
    this.iconStatus2 = null;
    this.iconStatus3 = null;
    this.checksum = null;
    this.timestamp = null;
  }

  EEVBlog121GWParser.prototype.remainder = function() {
    if (this.data === null || this.offset >= this.data.length) {
      return null;
    }
    return this.data.slice(this.offset);
  }

  EEVBlog121GWParser.prototype.processed = function() {
    if (this.data === null || this.offset <= 0) {
      return null;
    }
    if (this.offset >= this.data.length) {
      return this.data;
    }
    return this.data.subarray(0, this.offset);
  }

  EEVBlog121GWParser.prototype.parse = function(byteArray) {
    // No further parsing if we've reached a final state
    if (this.state === ParsingState.completed ||
        this.state === ParsingState.error) {
      return this.state
    }
    if (this.data === null) {
      this.data = byteArray;
    } else {
      let combinedData = new Uint8ClampedArray(this.data.length + byteArray.length);
      combinedData.set(this.data);
      combinedData.set(byteArray, this.data.length);
      this.data = combinedData;
    }

    let count = 0;
    if (this.responsePrefix === null) {
      const parseResult = EEVBlog121GWParser.parseResponsePrefix(this.data);
      this.state = parseResult.state;
      count = parseResult.bytesProcessed;
      this.responsePrefix = parseResult.prefix;
      this.offset += count;
      if (this.state !== ParsingState.completed) {
          return this.state;
      }
    }

    if (this.responsePrefix === 0xF2) {

      if (this.timestamp === null) {
        this.timestamp = new Date();
      }

      if (this.serialNumber === null) {
        this.state = ParsingState.in_progress;
        const remainder = this.remainder();
        if (remainder !== null) {
            const parseResult = EEVBlog121GWParser.parseSerialBytes(remainder);
            this.state = parseResult.state;
            count = parseResult.bytesProcessed;
            this.yearByte = parseResult.yearByte;
            this.monthByte = parseResult.monthByte;
            this.serialNumber = parseResult.serialNumber;
            this.offset += count;
        }
        if (this.state !== ParsingState.completed) {
          return this.state;
        }
      }

      if (this.mainValue === null) {
        this.state = ParsingState.in_progress;
        const remainder = this.remainder();
        if (remainder !== null) {
          const parseResult = EEVBlog121GWParser.parseModeRangeValue(remainder);
          this.state = parseResult.state;
          count = parseResult.bytesProcessed;
          this.mainModeByte = parseResult.mode;
          this.mainRangeByte = parseResult.range;
          this.mainValue = parseResult.value;
          this.offset += count;
        }
        if (this.state !== ParsingState.completed) {
          return this.state;
        }
      }

      if (this.subValue === null) {
        this.state = ParsingState.in_progress;
        const remainder = this.remainder();
        if (remainder !== null) {
          const parseResult = EEVBlog121GWParser.parseModeRangeValue(remainder);
          this.state = parseResult.state;
          count = parseResult.bytesProcessed;
          this.subModeByte = parseResult.mode;
          this.subRangeByte = parseResult.range;
          this.subValue = parseResult.value;
          this.offset += count;
        }
        if (this.state !== ParsingState.completed) {
          return this.state;
        }
      }

      if (this.barValue() === null) {
        this.state = ParsingState.in_progress;
        const remainder = this.remainder();
        if (remainder !== null) {
          const parseResult = EEVBlog121GWParser.parseBarStatusValue(remainder);
          this.state = parseResult.state;
          count = parseResult.bytesProcessed;
          this.barStatusByte = parseResult.status;
          this.barValueByte = parseResult.value;
          this.offset += count;
        }
        if (this.state !== ParsingState.completed) {
          return this.state;
        }
      }

      if (this.iconStatus3 === null) {
        this.state = ParsingState.in_progress;
        const remainder = this.remainder();
        if (remainder !== null) {
          const parseResult = EEVBlog121GWParser.parseIconStatus(remainder);
          this.state = parseResult.state;
          count = parseResult.bytesProcessed;
          this.iconStatus1 = parseResult.status1;
          this.iconStatus2 = parseResult.status2;
          this.iconStatus3 = parseResult.status3;
          this.offset += count;
        }
        if (this.state !== ParsingState.completed) {
          return state;
        }
      }

      if (this.checksum === null) {
        this.state = ParsingState.in_progress;
        const remainder = this.remainder();
        if (remainder !== null) {
          const parseResult = EEVBlog121GWParser.parseChecksum(remainder);
          this.state = parseResult.state;
          count = parseResult.bytesProcessed;
          this.checksum = parseResult.checksum;
          this.offset += count;
        }
        if (this.state === ParsingState.completed) {
          if (this.checkChecksum()) {
            console.log("Checksums match");
          } else {
            console.log("** Checksum mismatch **");
            this.state = ParsingState.error;
          }
          //console.log("Processed bytes: " + this.processed().length);
        }
      }
    }
    /*
    if (this.state == ParsingState.completed) {
      const noteTime = this.timestamp || new Date();
      this.meterState = this.constructMeterState();
      this.measurement = this.constructMeasurement(noteTime);
      this.subMeasurement = this.constructSubMeasurement(noteTime);
    }
    */
    return this.state;
  }

  EEVBlog121GWParser.prototype.checkChecksum = function() {
    let calcSum = this.responsePrefix || 0;
    /*
      calcSum ^= Utilities.breakUInt32(serialBytes ?? 0, byteNum: 3)
      calcSum ^= Utilities.breakUInt32(serialBytes ?? 0, byteNum: 2)
    */
    calcSum = calcSum ^ (this.yearByte || 0);
    const monthNibble = (this.monthByte || 0) << 4;
    const serialDigit4 = EEVBlog121GWParser.breakUInt32(this.serialNumber || 0, 2);
    calcSum = calcSum ^ (monthNibble | serialDigit4);
    calcSum = calcSum ^ EEVBlog121GWParser.breakUInt32(this.serialNumber || 0, 1);
    calcSum = calcSum ^ EEVBlog121GWParser.breakUInt32(this.serialNumber || 0, 0);
    calcSum = calcSum ^ (this.mainModeByte || 0)
    calcSum = calcSum ^ (this.mainRangeByte || 0);
    calcSum = calcSum ^ EEVBlog121GWParser.breakUInt16(this.mainValue || 0, 1);
    calcSum = calcSum ^ EEVBlog121GWParser.breakUInt16(this.mainValue || 0, 0);
    calcSum = calcSum ^ (this.subModeByte || 0);
    calcSum = calcSum ^ (this.subRangeByte || 0);
    calcSum = calcSum ^ EEVBlog121GWParser.breakUInt16(this.subValue || 0, 1);
    calcSum = calcSum ^ EEVBlog121GWParser.breakUInt16(this.subValue || 0, 0);
    calcSum = calcSum ^ (this.barStatusByte || 0);
    calcSum = calcSum ^ (this.barValueByte || 0);
    calcSum = calcSum ^ (this.iconStatus1 || 0);
    calcSum = calcSum ^ (this.iconStatus2 || 0);
    calcSum = calcSum ^ (this.iconStatus3 || 0);
    const match = calcSum == this.checksum;
    if (!match) {
      console.log("** checksum mismatch **");
    }
    console.log(match ? "checksum match" : "** checksum mismatch **");
    console.log("   calculated: " + calcSum.toString(16) + " vs data: " +
      this.checksum.toString(16));
    return match;
  }

  EEVBlog121GWParser.prototype.mainModeIndex = function() {
    return this.mainModeByte != null ? this.mainModeByte & 0x1F : null;
  }

  EEVBlog121GWParser.prototype.mainOverlimit = function() {
    return EEVBlog121GWParser.checkBits(this.mainRangeByte, 0x0080);
  }

  EEVBlog121GWParser.prototype.mainSignNegative = function() {
    return EEVBlog121GWParser.checkBits(this.mainRangeByte, 0x40);
  }

  EEVBlog121GWParser.prototype.mainRangeValueIndex = function() {
    return this.mainRangeByte != null ? this.mainRangeByte & 0x0F : null;
  }

  EEVBlog121GWParser.prototype.subModeIndex = function() {
    return this.subModeByte != null ? this.subModeByte & 0x00FF : null;
  }

  EEVBlog121GWParser.prototype.subOverlimit = function() {
    return EEVBlog121GWParser.checkBits(this.subRangeByte, 0x0080);
  }

  EEVBlog121GWParser.prototype.subSignNegative = function() {
    return EEVBlog121GWParser.checkBits(this.subRangeByte, 0x40);
  }

  EEVBlog121GWParser.prototype.subPoint = function() {
    return this.subRangeByte != null ? this.subRangeByte & 0x07 : null;
  }

  EEVBlog121GWParser.prototype.barOff = function() {
    return EEVBlog121GWParser.checkBits(this.barStatusByte, 0x10);
  }

  EEVBlog121GWParser.prototype.bar0_150 = function() {
    return EEVBlog121GWParser.checkBits(this.barStatusByte, 0x08);
  }

  EEVBlog121GWParser.prototype.barSignNegative = function() {
    return EEVBlog121GWParser.checkBits(this.barStatusByte, 0x04);
  }

  EEVBlog121GWParser.prototype.bar1000_500 = function() {
    return this.barStatusByte != null ? this.barStatusByte & 0x03 : null;
  }

  EEVBlog121GWParser.prototype.barValue = function() {
    return this.barValueByte != null ? this.barValueByte & 0x1F : null;
  }

  EEVBlog121GWParser.prototype.statusC = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus1, 0x80);
  }

  EEVBlog121GWParser.prototype.status1KHz = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus1, 0x40);
  }

  EEVBlog121GWParser.prototype.status1ms = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus1, 0x20);
  }

  EEVBlog121GWParser.prototype.acdcValue = function() {
    return this.iconStatus1 != null ? (this.iconStatus1 >> 3) & 0x03 : null;
  }

  EEVBlog121GWParser.prototype.statusAuto = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus1, 0x04);
  }

  EEVBlog121GWParser.prototype.statusAPO = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus1, 0x02);
  }

  EEVBlog121GWParser.prototype.statusBat = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus1, 0x01);
  }

  EEVBlog121GWParser.prototype.statusF = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus2, 0x80);
  }

  EEVBlog121GWParser.prototype.statusBT = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus2, 0x40);
  }

  EEVBlog121GWParser.prototype.statusArrow = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus2, 0x20);
  }

  EEVBlog121GWParser.prototype.statusREL = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus2, 0x10);
  }

  EEVBlog121GWParser.prototype.statusDBm = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus2, 0x08);
  }

  EEVBlog121GWParser.prototype.minMaxAveValue = function() {
    return this.iconStatus2 != null ? this.iconStatus2 & 0x07 : null;
  }

  EEVBlog121GWParser.prototype.statusTest = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus3, 0x40);
  }

  EEVBlog121GWParser.prototype.statusMem = function() {
    return this.iconStatus3 != null ? (this.iconStatus3 & 0x30) >> 4 : null;
  }

  EEVBlog121GWParser.prototype.statusAHold = function() {
    return this.iconStatus3 != null ? (this.iconStatus3 & 0x0C) >> 2 : null;
  }

  EEVBlog121GWParser.prototype.statusAC = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus3, 0x02);
  }

  EEVBlog121GWParser.prototype.statusDC = function() {
    return EEVBlog121GWParser.checkBits(this.iconStatus3, 0x01);
  }

  EEVBlog121GWParser.parseResponsePrefix = function(input) {
    let state = ParsingState.not_started;
    let bytesProcessed = 0;
    let prefix = null;

    if (input[0] === 0xF2) {
        state = ParsingState.completed;
        bytesProcessed = 1;
        prefix = input[0];
        console.log("Got message prefix: " + prefix);
    } else if (input.length > 0) {
        state = ParsingState.error;
        bytesProcessed = 1;
    }
    return {
      state: state,
      bytesProcessed: bytesProcessed,
      prefix: prefix
    };
  }

  EEVBlog121GWParser.parseSerialBytes = function(input) {
    let state = ParsingState.in_progress;
    let bytesProcessed = 0;
    let yearByte = null;
    let monthByte = null;
    let serialNumber = null;

    if (input.length >= 4) {
      state = ParsingState.completed;
      bytesProcessed = 4;
      yearByte = input[0];
      monthByte = (input[1] >> 4) & 0x0F;
      serialNumber = EEVBlog121GWParser.buildUInt32(input[3], input[2], (input[1] & 0x0F), 0);
      console.log("serialNumber: " + serialNumber.toString(16));
    }
    return {
      state: state,
      bytesProcessed: bytesProcessed,
      yearByte: yearByte,
      monthByte: monthByte,
      serialNumber: serialNumber
    };
  }

  EEVBlog121GWParser.parseModeRangeValue = function(input) {
    let state = ParsingState.in_progress;
    let bytesProcessed = 0;
    let mode = null;
    let range = null;
    let value = null;

    if (input.length >= 4) {
      state = ParsingState.completed;
      bytesProcessed = 4;
      mode = input[0];
      range = input[1];
      value = EEVBlog121GWParser.buildUInt16(input[3], input[2]);
      console.log("mode: " + mode.toString(16) + ", range: " + range.toString(16) +
        ", value: " + value.toString(16));
    }
    return {
      state: state,
      bytesProcessed: bytesProcessed,
      mode: mode,
      range: range,
      value: value
    };
  }

  EEVBlog121GWParser.parseBarStatusValue = function(input) {
    let state = ParsingState.in_progress;
    let bytesProcessed = 0;
    let status = null;
    let value = null;

    if (input.length >= 2) {
      state = ParsingState.completed;
      bytesProcessed = 2
      status = input[0]
      value = input[1]
      console.log("bar_status: " + status.toString(16) + ", bar_value: " + value.toString(16));
    }
    return {
      state: state,
      bytesProcessed: bytesProcessed,
      status: status,
      value: value
    };
  }

  EEVBlog121GWParser.parseIconStatus = function(input) {
    let state = ParsingState.in_progress;
    let bytesProcessed = 0;
    let status1 = null;
    let status2 = null;
    let status3 = null;

    if (input.length >= 3) {
      state = ParsingState.completed;
      bytesProcessed = 3;
      status1 = input[0];
      status2 = input[1];
      status3 = input[2];
      console.log("icon_status1: " + status1.toString(16) + ", icon_status2: " + status2.toString(16) +
        ", icon_status3: " + status3.toString(16));
    }
    return {
      state: state,
      bytesProcessed: bytesProcessed,
      status1: status1,
      status2: status2,
      status3: status3
    };
  }

  EEVBlog121GWParser.parseChecksum = function(input) {
    let state = ParsingState.in_progress;
    let bytesProcessed = 0;
    let checksum = null;

    if (input.length >= 1) {
      state = ParsingState.completed;
      bytesProcessed = 1;
      checksum = input[0];
      console.log("checksum: " + checksum.toString(16));
    }
    return {
      state: state,
      bytesProcessed: bytesProcessed,
      checksum: checksum
    };
  }

  EEVBlog121GWParser.checkBits = function(val, mask) {
    return val != null ? (val & mask) === mask : null;
  }

  EEVBlog121GWParser.buildUInt16 = function(lo, hi) {
      return (hi << 8) + (lo & 0xff)
  }

  EEVBlog121GWParser.breakUInt16 = function(v, byteNum) {
    if (byteNum > 1) {
        return 0x00;
    }
    return (v >> (byteNum * 8)) & 0x00ff;
  }

  EEVBlog121GWParser.buildUInt32 = function(byte0, byte1, byte2, byte3) {
    return (byte0 & 0xff) + ((byte1 & 0xff) << 8) +
            ((byte2 & 0xff) << 16) + ((byte3 & 0xff) << 24);
  }

  EEVBlog121GWParser.breakUInt32 = function(v, byteNum) {
    if (byteNum > 3) {
        return 0x00;
    }
    return (v >> (byteNum * 8)) & 0x00ff;
  }

  App.EEVBlog121GWParser = EEVBlog121GWParser;
  window.App = App;
})(window);
