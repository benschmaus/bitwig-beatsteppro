loadAPI(1);

host.defineController("Factotumo", "Arturia BSP", "1.0", "8fbd683a-773d-4815-9959-7073da138a19");
host.addDeviceNameBasedDiscoveryPair(["Arturia BeatStep Pro"], ["Arturia BeatStep Pro"]);
host.defineMidiPorts(1, 1);


var bsp = {
  encoderCCs: [10,74,71,76,77,93,73,75,114,18,19,16,17,91,79,72]
};

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
  
    for (var i = 0; i < 8; i++) {
        var deviceParam = bitwig.primaryDevice.getParameter(i);
        deviceParam.setIndication(true);

        var macro = bitwig.primaryDevice.getMacro(i).getAmount();
        macro.setIndication(true);
    }

    println("done init");
}

function onMidi(status, data1, data2) {
   var command = status & 0xf0;
   var channel = (status & 0x0f) + 1;
   //println("channel=" + channel + ", command=" + command + ", data1=" + data1 + ", data2=" + data2);

   var ccIdx = bsp.encoderCCs.indexOf(data1);
   //println("ccIdx=" + ccIdx);

   if (ccIdx != -1) {
       if (ccIdx < 8) {
           handleEncoderChange(data2, bitwig.primaryDevice.getParameter(ccIdx));
       } else {
           handleEncoderChange(data2, bitwig.primaryDevice.getMacro(ccIdx - 8).getAmount());
       }
   }

}

function handleEncoderChange(value, paramOrMacro) {
  if (value < 64) {
    paramOrMacro.inc(-1, 128);
  } else if (value > 64) {
    paramOrMacro.inc(1, 128);
  }
}

function onSysex(sysex) { }

function exit() { }

