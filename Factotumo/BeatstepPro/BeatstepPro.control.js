loadAPI(1);

host.defineController("Factotumo", "Arturia BSP", "1.0", "8fbd683a-773d-4815-9959-7073da138a19");
host.addDeviceNameBasedDiscoveryPair(["Arturia BeatStep Pro"], ["Arturia BeatStep Pro"]);
host.defineMidiPorts(1, 1);


var encoderCCs = [];
for (var i = 0, j = 16; i < 16; i++, j++) {
	encoderCCs[i] = j;
}

// these are supposed to be the default CCs but my Beatstep Pro sends 16-31 with firmware v1.4.0.20
var altEncoderMacroCCs = [10,74,71,76,77,93,73,75];

// pad indices 0-7 so onMidi handler treats these as device macros instead of params
var altEncoderParameterCCs = [-1,-1,-1,-1,-1,-1,-1,-1,114,18,19,16,17,91,79,72];

var primaryDevice = null;

var paramVals = [];
var macroVals = [];

println("init globals");

function init() {
	  println("start init");

    var mo = host.getMidiOutPort(0);
    mo.setShouldSendMidiBeatClock(true);

    var mi = host.getMidiInPort(0);
    mi.setMidiCallback(onMidi);
    mi.setSysexCallback(onSysex);


    mi.createNoteInput("s1", "?0????").setShouldConsumeEvents(false);
    // Get CCs from control mode messages on channel 1 for s2 and drums
    mi.createNoteInput("s2", "?1????").setShouldConsumeEvents(false);
    mi.createNoteInput("drum", "?9????").setShouldConsumeEvents(false);

    primaryDevice = host.createArrangerCursorTrack(2, 0).getPrimaryDevice();
    
    var paramTracker =  function(i) {
        return function(value) {
            println("param idx=" + i + ", value=" + value);
            paramVals[i] = value;
            mo.sendMidi(176, encoderCCs[i], value);
        }
    }
    var macroTracker = function(i) {
        return function(value) {
            println("macro idx=" + i + ", value=" + value);
            macroVals[i] = value;
            mo.sendMidi(176, encoderCCs[i+8], value);
        }
    }
    for (var i = 0; i < 8; i++) {
        primaryDevice.getParameter(i).addValueObserver(128, paramTracker(i));
        primaryDevice.getMacro(i).getAmount().addValueObserver(128, macroTracker(i));
    }

    println("done init");
}

function onMidi(status, data1, data2) {
   var command = status & 0xf0;
   var channel = (status & 0x0f) + 1;
   println("channel=" + channel + ", command=" + command + ", data1=" + data1 + ", data2=" + data2);

   var ccIdx = encoderCCs.indexOf(data1);
   if (ccIdx == -1) {
      ccIdx = altEncoderParameterCCs.indexOf(data1);
   }
   if (ccIdx == -1) {
      ccIdx = altEncoderMacroCCs.indexOf(data1);
   }
   //println("ccIdx=" + ccIdx);

   if (ccIdx != -1) {
       if (ccIdx < 8) {
           primaryDevice.getParameter(ccIdx).set(data2, 128);
       } else {
           var idx = ccIdx - 8;
           primaryDevice.getMacro(idx).getAmount().set(data2, 128);
       }
   }

}

function onSysex(sysex) { }

function exit() { }

