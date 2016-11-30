loadAPI(1);

host.defineController("Factotumo", "Arturia BSP", "1.0", "8fbd683a-773d-4815-9959-7073da138a19");
host.addDeviceNameBasedDiscoveryPair(["Arturia BeatStep Pro"], ["Arturia BeatStep Pro"]);
host.defineMidiPorts(1, 1);

// tracks BSP encoder CCs and their values
var bsp = {
  encoderCCs: [],
  encoderVals: {},
  encoderValsSynced: {},
  // these are supposed to be the default CCs but my Beatstep Pro sends 16-31 with firmware v1.4.0.20
  // so supporting these and 16-31
  altEncoderCCs: [10,74,71,76,77,93,73,75,114,18,19,16,17,91,79,72]
};
for (var i = 0, j = 16; i < 16; i++, j++) {
	bsp.encoderCCs[i] = j;
  bsp.encoderVals[j] = -1;
  bsp.encoderValsSynced[j] = false;

  var altEncoderCC = bsp.altEncoderCCs[i];
  bsp.encoderVals[altEncoderCC] = -1;
  bsp.encoderValsSynced[altEncoderCC] = false;
}

// access primary track device and its parameters (including macros)
var bitwig = {};

bitwig.primaryDevice = null;
bitwig.deviceParams = [];

function init() {
	  println("start init");

    var mo = host.getMidiOutPort(0);
    mo.setShouldSendMidiBeatClock(true);

    var mi = host.getMidiInPort(0);
    mi.setMidiCallback(onMidi);
    mi.setSysexCallback(onSysex);

    // channels 1, 2, and 10 for the BSP's sequencers
    mi.createNoteInput("s1", "?0????").setShouldConsumeEvents(false);
    mi.createNoteInput("s2", "?1????").setShouldConsumeEvents(false);
    mi.createNoteInput("drum", "?9????").setShouldConsumeEvents(false);

    bitwig.primaryDevice = host.createArrangerCursorTrack(2, 0).getPrimaryDevice();
    
    var paramTracker =  function(i) {
        return function(value) {
            //println("param idx=" + i + ", value=" + value);
            bitwig.deviceParams[i] = value;
        }
    }
    var macroTracker = function(i) {
        return function(value) {
            //println("macro idx=" + i + ", value=" + value);
            bitwig.deviceParams[i + 8] = value;
        }
    }
    for (var i = 0; i < 8; i++) {
        var deviceParam = bitwig.primaryDevice.getParameter(i);
        deviceParam.addValueObserver(128, paramTracker(i));
        deviceParam.setIndication(true);

        var macro = bitwig.primaryDevice.getMacro(i).getAmount();
        macro.addValueObserver(128, macroTracker(i));
        macro.setIndication(true);
    }

    println("done init");
}

function onMidi(status, data1, data2) {
   var command = status & 0xf0;
   var channel = (status & 0x0f) + 1;
   println("channel=" + channel + ", command=" + command + ", data1=" + data1 + ", data2=" + data2);

   var ccIdx = bsp.encoderCCs.indexOf(data1);
   if (ccIdx == -1) {
      ccIdx = bsp.altEncoderCCs.indexOf(data1);
   }
   //println("ccIdx=" + ccIdx);

   if (ccIdx != -1) {
       if (ccIdx < 8) {
           handleEncoderChange(ccIdx, data1, data2, bitwig.primaryDevice.getParameter(ccIdx));
       } else {
           handleEncoderChange(ccIdx, data1, data2, bitwig.primaryDevice.getMacro(ccIdx - 8).getAmount());
       }
   }

}

function handleEncoderChange(deviceParamIdx, encoderCC, value, paramOrMacro) {
  if (bsp.encoderVals[encoderCC] == -1) {
    println("got initial encoder val " + value + " from BSP for CC " + encoderCC);
  } else {
    if ((bsp.encoderVals[encoderCC] == bitwig.deviceParams[deviceParamIdx]) || (bsp.encoderValsSynced[encoderCC] == true)) {
      println("BSP and Bitwig encoders/device params in sync");
      paramOrMacro.set(value, 128);
      bsp.encoderValsSynced[encoderCC] = true
    } else {
      var currBspEncoderVal = bsp.encoderVals[encoderCC]
      if (value <= currBspEncoderVal) {
        paramOrMacro.inc(-1, 128);
      } else {
        paramOrMacro.inc(1, 128);
      }
    }
  }
  bsp.encoderVals[encoderCC] = value;
}

function onSysex(sysex) { }

function exit() { }

