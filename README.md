# junglechopper
a webapp for chopping breakbeats

check it out at https://rhythmclinic.org/junglechopper

uses the js webaudioapi to chop and reassemble the amen break. I used [this](https://web-audio-api.firebaseapp.com/audio-buffer-source-node) article heavily as a guide for webaudioapi.

the grid is a dynamically generated html table. try changing the `NUM_CHOPS`variable at the top of main.js to change the size of the grid and the length of each chop. you could also change the sample by replacing amen.mp3 and changing `NUM_BARS` and `INPUT_BPM`.

to run this locally you need to use a webserver to deal with CORS. I just used `python3 -m http.server`
