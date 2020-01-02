(function (window) {
  'use strict';
  var App = window.App || {};
	var EEVBlog121GWParser = App.EEVBlog121GWParser;

  function EEVBlog121GW() {
    this.parser = new App.EEVBlog121GWParser();
  }

	const MeterMode = {
		Low_Z: 0,   // rangeVal: 4 rangeMultExp: 0
		DCV: 1,     // rangeVal: 1,2,3,4 rangeMultExp: 0
		ACV: 2,     // rangeVal: 1,2,3,4 rangeMultExp: 0
		DCmV: 3,    // rangeVal: 2,3 rangeMultExp: -3
		ACmV: 4,    // rangeVal: 2,3 rangeMultExp: -3
		Temp: 5,    // rangeVal: 4 rangeMultExp: 0
		Hz: 6,      // rangeVal: 2,3 rangeMultExp: 0 (KHz), rangeVal: 1,2,3 rangeMultExp: 3 (Hz)
		mS: 7,      // rangeVal: 1,2,3 rangeMultExp: 0
		Duty: 8,    // rangeVal: 1 rangeMultExp: 0
		Resistor: 9,    // rangeVal: 1,2 rangeMultExp: 6, rangeVal: 2,3 rangeMultExp: 0, rangeVal: 1,2,3 rangeMultExp: 3
		Continuity: 10, // rangeVal: 3 rangeMultExp: 0
		Diode: 11,  // rangeVal: 1,2 rangeMultExp: 0
		Capacitor: 12,  // rangeVal: 3,4 rangeMultExp: -9, rangeVal: 2,3,4,5 rangeMultExp: -6
		ACuVA: 13,  // rangeVal: 2,3,4,5 rangeMultExp: 0
		ACmVA: 14,
		ACVA: 15,   // rangeVal: 4,5 rangeMultExp: -3, rangeVal: 2,3 rangeMultExp: 0
		ACuA: 16,   // rangeVal: 2,3 rangeMultExp: 0
		DCuA: 17,   // rangeVal: 2,3 rangeMultExp: 0
		ACmA: 18,
		DCmA: 19,
		ACA: 20,    // rangeVal: 3 rangeMultExp: -3, rangeVal: 1,2 rangeMultExp: 0
		DCA: 21,    // rangeVal: 3 rangeMultExp: -3, rangeVal: 1,2 rangeMultExp: 0
		DCuVA: 22,  // rangeVal: 3,4,5 rangeMultExp: 0
		DCmVA: 23,
		DCVA: 24,   // rangeVal: 4,5 rangeMultExp: -3 rangeVal: 2,3 rangeMultExp: 0
		_TempC: 100,
		_TempF: 105,
		_Battery: 110,
		_APO_On: 120,
		_APO_Off: 125,
	 	_YEAR: 130,
		_DATE: 135,
		_TIME: 140,
		_BURDEN_VOLTAGE: 150,
		_LCD: 160,
		_dBm: 180,
		_Interval: 190
	};

	const Sign = {
		positive: 1,
		negative: -1
	};

	const AC_DC = {
	  none: 0,
	  dc: 1,
	  ac: 2,
	  acdc: 3
	};

	const BarRange = {
		"5": 0,
		"50": 1,
		"500": 2,
		"1000": 3
	};

	const MinMaxAve = {
		none: 0,
		max: 1,
		min: 2,
		ave: 3,
		minMaxAve: 4
	};

  const RangeLookup = [
		{ baseUnits: "V", units: "V", label: "Voltage Low Z", values: [4], notation: " " },    //0
		{ baseUnits: "V", units: "V", label: "Voltage DC", values: [1,2,3,4], notation: "    " },    //1
		{ baseUnits: "V", units: "V", label: "Voltage AC", values: [1,2,3,4], notation: "    " },     //2
		{ baseUnits: "V", units: "mV", label: "Voltage DC", values: [2,3], notation: "mm" },     //3
		{ baseUnits: "V", units: "mV", label: "Voltage AC", values: [2,3], notation: "mm" },     //4
		{ baseUnits: "°C", units: "°C", label: "Temp", values: [4], notation: " " },     //5
		{ baseUnits: "Hz", units: "KHz", label: "Frequency", values: [2,3,1,2,3], notation: "  kkk" },   //6
		{ baseUnits: "s", units: "ms", label: "Period", values: [1,2,3], notation:"   " },     //7
		{ baseUnits: "%", units: "%", label: "Duty", values: [4], notation: " " },     //8
		{ baseUnits: "Ω", units: "KΩ", label: "Resistance", values: [2,3,1,2,3,1,2], notation: "  kkkMM" }, //9
		{ baseUnits: "Ω", units: "KΩ", label: "Continuity", values: [3], notation: " " },     //10
		{ baseUnits: "V", units: "V", label: "Diode", values: [1,2], notation: "  " },     //11
		{ baseUnits: "F", units: "mF" /*"ms"*/, label: "Capacitance", values: [3,4,2,3,4,5], notation: "nnuuuu" },  //12
		{ baseUnits: "VA", units: "uVA", label: "Power AC", values: [4,5,2,3], notation: "    " },     //13
		{ baseUnits: "VA", units: "mVA", label: "Power AC", values: [4,5,2,3], notation: "mm  " },     //14
		{ baseUnits: "VA", units: "VA", label: "Power AC", values: [4,5,2,3], notation: "mm  " },     //15, units in orig code "mVA"
		{ baseUnits: "A", units: "uA", label: "Current AC", values: [2,3], notation: "  " },     //16
		{ baseUnits: "A", units: "uA", label: "Current DC", values: [2,3], notation: "  " },     //17
		{ baseUnits: "A", units: "mA", label: "Current AC", values: [3,1,2], notation: "mmm" },     //18
		{ baseUnits: "A", units: "mA", label: "Current DC", values: [1,2], notation: "mm" },     //19
		{ baseUnits: "A", units: "A", label: "Current AC", values: [3,1,2], notation: "m  " },     //20
		{ baseUnits: "A", units: "A", label: "Current DC", values: [3,1,2], notation: "m  " },     //21
		{ baseUnits: "VA", units: "uVA", label: "Power DC", values: [3,4,4,5], notation: "    " },     //22
		{ baseUnits: "VA", units: "mVA", label: "Power DC", values: [4,5,2,3], notation: "mm  " },     //23
		{ baseUnits: "VA", units: "VA", label: "Power DC", values: [4,5,2,3], notation: "mm  " }    //24
	];

	EEVBlog121GW.prototype.processMessageData = function(msgData) {
		const bytes = msgData.buffer;
    let remainder = new Uint8ClampedArray(bytes);
		var parserState = this.parser.state;
		while (remainder != null && remainder.length > 0) {
			parserState = this.parser.parse(remainder);
			if (parserState === EEVBlog121GWParser.ParsingState.error) {
				console.log("Error parsing device response: " + this.parser.processed().toString(16) +
					", length: " + this.parser.processed().length + ", offset: " + this.parser.offset);
				remainder = this.parser.remainder();
				this.parser.reset();
			} else if (parserState === EEVBlog121GWParser.ParsingState.completed) {
				console.log("Successfully parsed device response: " + this.parser.processed().toString(16));
				this.meterState = this.constructMeterState();
				this.mainMeasure = this.constructMeasurement();
				this.subMeasure = this.constructSubMeasurement();
				remainder = this.parser.remainder();
				this.parser.reset();
			} else {
				// In progress - keep responseParser intact and wait for next update
				remainder = null;
			}
		}
		return parserState;
	}

	EEVBlog121GW.prototype.constructMeterState = function() {
		const mainModeIndex = this.parser.mainModeIndex();
		const mainMode = getEnumByValue(MeterMode, mainModeIndex);
		console.log("Meter mode is: " + mainMode);
		const subModeIndex = this.parser.subModeIndex();
		const subMode = getEnumByValue(MeterMode, subModeIndex);
		console.log("Sub mode is: " + subMode);
		const barSignNegative = this.parser.barSignNegative();
		const barSign = barSignNegative != null ?
			(barSignNegative ? Sign.negative : Sign.positive) : null;
		console.log("Bar sign: " + barSign);
		const bar1000_500 = getEnumByValue(BarRange, this.parser.bar1000_500());
		console.log("Bar1000_500: " + bar1000_500);
		const acdc = getEnumByValue(AC_DC, this.parser.acdcValue());
		console.log("AC_DC: " + acdc);
		const minMaxAve = getEnumByValue(MinMaxAve, this.parser.minMaxAveValue());

		return {
      mainMode: mainMode,
			mainModeDisplay: EEVBlog121GW.descriptionForModeIndex(mainModeIndex),
      subMode: subMode,
			subModeDisplay: EEVBlog121GW.descriptionForModeIndex(subModeIndex),
      barOff: this.parser.barOff(),
      bar0_150: this.parser.bar0_150(),
      barSign: barSign,
      bar1000_500: bar1000_500,
      barValue: this.parser.barValue(),
      statusC: this.parser.statusC(),
      status1KHz: this.parser.status1KHz(),
      status1ms: this.parser.status1ms(),
      statusACDC: acdc,
      statusAuto: this.parser.statusAuto(),
      statusAPO: this.parser.statusAPO(),
      statusBat: this.parser.statusBat(),
			statusBT: this.parser.statusBT(),
      statusArrow: this.parser.statusArrow(),
      statusREL: this.parser.statusREL(),
      statusTest: this.parser.statusTest(),
      statusMem: this.parser.statusMem(),
      statusAHold: this.parser.statusAHold(),
      statusAC: this.parser.statusAC(),
      statusDC: this.parser.statusDC(),
      statusMinMax: minMaxAve,
      year: this.parser.yearByte,
      month: this.parser.monthByte,
      serialNumber: this.parser.serialNumber
    };
  }

	EEVBlog121GW.prototype.constructMeasurement = function() {
		const timestamp = new Date();
		const value = this.parser.mainValue;
		const signNegative = this.parser.mainSignNegative() || false;
		const modeIndex = this.parser.mainModeIndex();
		const range = (modeIndex != null && modeIndex < RangeLookup.length) ?
			RangeLookup[modeIndex] : null;
		const overlimit = this.parser.mainOverlimit() || false;
		const rangeValueIndex = this.parser.mainRangeValueIndex();
		const rangeValue = EEVBlog121GW.rangeValue(range, rangeValueIndex);
		const unitsPrefix = EEVBlog121GW.rangeUnitsPrefix(range, rangeValueIndex);
		const rangeExp = EEVBlog121GW.rangeMultipleExp(unitsPrefix);
		const exponent = rangeExp + rangeValue - 5;
		const scale = (unitsPrefix || "").trim();
		const units = scale.length > 0 ? EEVBlog121GW.rangeBaseUnits(range) :
			EEVBlog121GW.rangeUnits(range);

		let measurement = overlimit ?
			{
				nanValue: "OL",
				units: units,
				scale: scale,
				timestamp: timestamp
			} : {
				significand: value,
				exponent: exponent,
				isNegative: signNegative,
				units: units,
				scale: scale,
				timestamp: timestamp
			};
		measurement.displayValue = EEVBlog121GW.displayValueForMeasurement(measurement);
		return measurement;
	}

	EEVBlog121GW.prototype.constructSubMeasurement = function() {
		const timestamp = new Date();
		const value = this.parser.subValue;
		const signNegative = this.parser.subSignNegative() || false;
		const modeIndex = this.parser.subModeIndex();
		const mode = getEnumByValue(MeterMode, modeIndex);
		const range = (modeIndex != null && modeIndex < RangeLookup.length) ?
			RangeLookup[modeIndex] : null;
		const overlimit = this.parser.subOverlimit() || false;
		const units = EEVBlog121GW.rangeBaseUnits(range) || EEVBlog121GW.unitsForExtendedModeIndex(modeIndex);
		const rangeValueIndex = this.parser.subPoint();
		const unitsPrefix = EEVBlog121GW.rangeUnitsPrefix(range, rangeValueIndex);
		const rangeExp = EEVBlog121GW.rangeMultipleExp(unitsPrefix);
		const exponent = rangeExp - rangeValueIndex;
		const scale = (unitsPrefix || "").trim();

		let measurement = overlimit ?
			{
				nanValue: "OL",
				units: units,
				scale: scale,
				timestamp: timestamp
			} : {
				significand: value,
				exponent: exponent,
				isNegative: signNegative,
				units: units,
				scale: scale,
				timestamp: timestamp
			};
		measurement.displayValue = EEVBlog121GW.displayValueForMeasurement(measurement);
		return measurement;
	}

	EEVBlog121GW.rangeValue = function(range, valueIndex) {
		if (range != null && valueIndex != null && valueIndex < range.notation.length) {
			return range.values[valueIndex];
		}
		return null;
	}

	EEVBlog121GW.rangeUnitsPrefix = function(range, valueIndex) {
		if (range != null && valueIndex != null && valueIndex < range.notation.length) {
			return range.notation[valueIndex];
		}
		return null;
	}

	EEVBlog121GW.rangeUnits = function(range) {
		return range != null ? range.units : null;
	}

	EEVBlog121GW.rangeBaseUnits = function(range) {
		return range != null ? range.baseUnits : null;
	}

	EEVBlog121GW.rangeMultipleExp = function(unitsPrefix) {
		let exp = 0;
		switch (unitsPrefix) {
			case "p":
				exp = -12;
				break;
      case "n":
				exp = -9;
				break;
      case "u":
			 	exp = -6;
				break;
      case "m":
				exp = -3;
				break;
      case "K":
			case "k":
				exp = 3;
				break;
      case "M":
			 	exp = 6;
				break;
      case "G":
				exp = 9;
				break;
    }
    return exp;
	}

	EEVBlog121GW.descriptionForModeIndex = function(modeIndex) {
		if (modeIndex < RangeLookup.length) {
			return RangeLookup[modeIndex].label;
		}
		return EEVBlog121GW.descriptionForExtendedModeIndex(modeIndex);
	}

	EEVBlog121GW.unitsForExtendedModeIndex = function(modeIndex) {
		let units = "";
		switch (modeIndex) {
			case MeterMode._TempC:
				units = "°C";
				break;
			case MeterMode._TempF:
				units = "°F";
				break;
			case MeterMode._Battery:
				units = "%";
				break;
			case MeterMode._APO_On:
			case MeterMode._APO_Off:
			case MeterMode._YEAR:
			case MeterMode._DATE:
			case MeterMode._TIME:
			case MeterMode._LCD:
			case MeterMode._Interval:
				units = "";
				break;
			case MeterMode._BURDEN_VOLTAGE:
				units = "V";
				break;
			case MeterMode._dBm:
				units = "dBm";
				break;
		}
		return units;
	}

	EEVBlog121GW.descriptionForExtendedModeIndex = function(modeIndex) {
		let desc = "";
		switch (modeIndex) {
			case MeterMode._TempC:
				desc = "Temperature °C";
				break;
			case MeterMode._TempF:
				desc = "Temperature °F";
				break;
			case MeterMode._Battery:
				desc = "Battery";
				break;
			case MeterMode._APO_On:
				desc = "APO On";
				break;
			case MeterMode._APO_Off:
				desc = "APO Off";
				break;
			case MeterMode._YEAR:
				desc = "Year";
				break;
			case MeterMode._DATE:
				desc = "Date";
				break;
			case MeterMode._TIME:
				desc = "Time";
				break;
			case MeterMode._LCD:
				desc = "LCD";
				break;
			case MeterMode._Interval:
		 		desc = "Interval";
				break;
			case MeterMode._BURDEN_VOLTAGE:
			 	desc = "Burden Voltage";
				break;
			case MeterMode._dBm:
				desc = "dBm";
				break;
			default:
				desc = "?";
				break;
		}
		return desc;
	}

	EEVBlog121GW.displayValueForMeasurement = function(measure) {
		if (measure.nanValue != null) {
			return measure.nanValue + " " + measure.units;
		}
		// sig: 90, exp: -6, scaledExp: -3, scaledValue = 0.090
		// sig 227, exp: -1, scaledExp: -1, scaledValue = 22.7
		// sig 0, exp: -4, scaledExp: -4, scaledValue = 0.0000

		const unscaledValue = measure.isNegative ? -1 * measure.significand : measure.significand;
		const scaledExp = measure.exponent - EEVBlog121GW.rangeMultipleExp(measure.scale);
		const numDigits = measure.significand.toString().length;
		let precision = numDigits;
		if (scaledExp > 0 || measure.significand === 0) {
			precision += Math.abs(scaledExp);
		}
		const scaledValue = measure.significand * Math.pow(10, scaledExp);
		const scaledUnits = (measure.scale || "") + measure.units;
		return scaledValue.toPrecision(precision) + " " + scaledUnits;
	}

	function getEnumByValue(e, v) {
		if (typeof v == 'number') {
			for (const [key, value] of Object.entries(e)) {
				if (value === v) {
					return key;
				}
			}
		}
		return null;
	}

  App.EEVBlog121GW = EEVBlog121GW;
  window.App = App;
})(window);
