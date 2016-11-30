Bitwig controller script for Arturia Beatstep Pro.

The script:
  * creates 3 note inputs: sequencer 1, sequencer 2, and drum
  * uses the default channels of 1, 2, and 10 for each of the Beatstep Pro's sequencers
  * in control mode
    * encoders 1-8 control primary device parameters
    * encoders 9-16 control primary device macros
  * supports clock sync from Bitwig; set sync to USB mode on BSP

This script draws inspiration from https://github.com/justlep/bitwig/tree/master/doc/ArturiaBeatstepPro and https://github.com/cyhex/BeatstepProController

For the encoders to work correctly, you need to load the "DefaultRelativeCCs" template on to your BSP via Arturia's MIDI Control Center
software.  This is the default factory template with a modification to the encoder knobs that configures them to send relative increment/decrement values for knob turns.  This enables proper control of device params and macros within Bitwig.