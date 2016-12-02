loadAPI(1);

host.defineController("Factotumo", "Arturia BSP", "1.0", "8fbd683a-773d-4815-9959-7073da138a19");
host.addDeviceNameBasedDiscoveryPair(["Arturia BeatStep Pro"], ["Arturia BeatStep Pro"]);
host.defineMidiPorts(1, 1);


var bsp = {
  encoderCCs: [10,74,71,76,77,93,73,75,114,18,19,16,17,91,79,72]
};

var bitwig = {
  primaryDevice: null,
  isPlaying: false,
  isRecording: false,
  cursorTrack: null,
  cursorDevice: null
};

function init() {
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

    bitwig.transport = host.createTransport();
    bitwig.transport.addIsPlayingObserver(function(isPlaying) { bitwig.isPlaying = isPlaying; });
    bitwig.transport.addIsRecordingObserver(function(isRecording) { bitwig.isRecording = isRecording; });

    bitwig.cursorTrack = host.createArrangerCursorTrack(8, 8);
    bitwig.cursorDevice = host.createEditorCursorDevice();
    bitwig.deviceBrowser = bitwig.cursorDevice.createDeviceBrowser(2,2);

    println("done init");
}

function onMidi(status, data1, data2) {
   var command = status & 0xf0;
   var channel = (status & 0x0f) + 1;
   println("channel=" + channel + ", command=" + command + ", data1=" + data1 + ", data2=" + data2);

   if (command == 176) {
     var encoderCCIdx = bsp.encoderCCs.indexOf(data1);

     if (encoderCCIdx != -1) {
         if (encoderCCIdx < 8) {
             handleEncoderChange(data2, bitwig.primaryDevice.getParameter(encoderCCIdx));
         } else {
             handleEncoderChange(data2, bitwig.primaryDevice.getMacro(encoderCCIdx - 8).getAmount());
         }
     } else {
        switch (data1) {
          case 20:
            doActionOnGateOpen(data2, function() {
              bitwig.cursorTrack.selectPrevious();
              bitwig.cursorTrack.getPrimaryDevice().selectInEditor();
            })
            break;
          case 21:
            doActionOnGateOpen(data2, function() {
              bitwig.cursorTrack.selectNext();
              bitwig.cursorTrack.getPrimaryDevice().selectInEditor();
            })
            break;
          case 22:
            doActionOnGateOpen(data2, function() {
              bitwig.cursorDevice.selectPrevious();
            })
            break;
          case 23:
            doActionOnGateOpen(data2, function() {
              bitwig.cursorDevice.selectNext();
            })
            break;
          case 24:
            doActionOnGateOpen(data2, function() {
              bitwig.deviceBrowser.cancelBrowsing();
            })
            break;
          case 25:
            doActionOnGateOpen(data2, function() {
              bitwig.deviceBrowser.startBrowsing();
            })
            break;
          case 26:
            doActionOnGateOpen(data2, function() {
              bitwig.deviceBrowser.getPresetSession().getCursorResult().selectPrevious();
            })
            break;
          case 27:
            doActionOnGateOpen(data2, function() {
              bitwig.deviceBrowser.getPresetSession().getCursorResult().selectNext();
            })
            break;  
          default:
            break;
        }
     }
   }

}

function doActionOnGateOpen(data2, f) {
  if (data2 == 127) {
    f();
  }
}

function handleEncoderChange(value, paramOrMacro) {
    if (value == 64) { return; }
    // -1 for knob turn left, +1 for knob turn right
    paramOrMacro.inc(value - 64, 128);
}

function onSysex(sysex) { }

function exit() { }

