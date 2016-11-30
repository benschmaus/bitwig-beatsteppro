Bitwig controller script for Arturia Beatstep Pro.

The script:
  * creates 3 note inputs: sequencer 1, sequencer 2, and drum
  * uses the default channels of 1, 2, and 10 for each of the Beatstep Pro's sequencers
  * in control mode
    * encoders 1-8 control primary device parameters
    * encoders 9-16 control primary device macros
  * supports clock sync from Bitwig; set sync to USB mode on BSP

This script draws inspiration from https://github.com/justlep/bitwig/tree/master/doc/ArturiaBeatstepPro

It's also similar to https://github.com/cyhex/BeatstepProController but doesn't require a template to be loaded onto your BSP for the script to function.