
const NUM_CHOPS = 32;
const NUM_BARS = 4;
const INPUT_BPM = 137;
const DEFAULT_OUTPUT_BPM = 160;

// to get accurate sample trigger timing, we have to schedule sample triggers
// some delay behind the settimeout loop using webaudioapi's timer.
// this variable sets the size of that delay
const AUDIO_DELAY_SECS = 0.1;

window.addEventListener('load', () => {
    const audio_ctx = new AudioContext();
    let audiobuffer;
    let chop_length;
    let interval;
    let output_bpm = DEFAULT_OUTPUT_BPM;

    const playbutton = document.getElementById('playbutton');
    const stopbutton = document.getElementById('stopbutton');
    const table = document.getElementById('table');
    const bpminput = document.getElementById('bpm');

    bpminput.value = output_bpm;
    table.ondragstart = () => false;
    table.ondrop = () => false;

    bpminput.addEventListener('change', event => {
        output_bpm = event.target.value;
        interval = (60 * 1000 * NUM_BARS * NUM_BARS) / (output_bpm * NUM_CHOPS);
    });

    const colgroup = document.createElement('colgroup');
    for (let i = 0; i < NUM_CHOPS; i++) {
        const colnode = document.createElement('col');
        colgroup.appendChild(colnode);
    }
    table.appendChild(colgroup);

    for (let i = 0; i < NUM_CHOPS; i++) {
        const row = document.createElement('tr');
        row.setAttribute('data-row', NUM_CHOPS - i - 1);

        for (let j = 0; j < NUM_CHOPS; j++) {
            const col = document.createElement('td');
            col.setAttribute('data-col', j);
            col.style.width = (100 / NUM_CHOPS) + '%';
            if (NUM_CHOPS - i - 1 === j) {
                col.classList.add('selected');
            }
            row.appendChild(col);
        }

        table.appendChild(row);
    }

    function clear_all_playing_classes() {
        const playing_nodes = colgroup.querySelectorAll('.playing');
        for (node of playing_nodes) {
            node.classList.remove('playing');
        }
    }

    fetch('amen.mp3')
        .then( response => response.arrayBuffer() )
        .then( buffer => audio_ctx.decodeAudioData(buffer, decoded =>  {
            audiobuffer = decoded;
            chop_length = decoded.duration / NUM_CHOPS;
            interval = (60 * 1000 * NUM_BARS * NUM_BARS) / (output_bpm * NUM_CHOPS);
            playbutton.disabled = false;
            stopbutton.disabled = false;
        }));

    let audiobuffer_sourcenode;
    function play_chop_at(index, start_time) {
        audio_ctx.resume();
        audiobuffer_sourcenode = audio_ctx.createBufferSource();
        audiobuffer_sourcenode.buffer = audiobuffer;
        audiobuffer_sourcenode.playbackRate.value = output_bpm / INPUT_BPM;
        audiobuffer_sourcenode.connect(audio_ctx.destination);
        audiobuffer_sourcenode.start(start_time, index * chop_length, chop_length);
    }

    let selected_chops = [];
    for (let i = 0; i < NUM_CHOPS; i++) {
        selected_chops.push(i);
    }

    let loop_timeout_id = null;
    let ui_timeout_id = null;
    playbutton.addEventListener('click', () => {
        if (loop_timeout_id !== null) {
            return;
        }

        let current_time = audio_ctx.currentTime;
        function tick(beat_num) {
            const chop_num = selected_chops[beat_num];
            if (chop_num !== null) {
                play_chop_at(chop_num, current_time + AUDIO_DELAY_SECS);
            }

            ui_timeout_id = setTimeout(
                beat_num => {
                    clear_all_playing_classes();
                    colgroup.childNodes[beat_num].classList.add('playing');
                }, 
                AUDIO_DELAY_SECS * 1000,
                beat_num
            );

            loop_timeout_id = setTimeout(
                tick,
                (current_time - audio_ctx.currentTime) * 1000 + interval,
                ++beat_num % NUM_CHOPS
            );

            current_time += interval / 1000;
        }
        tick(0);
    });

    stopbutton.addEventListener('click', () => {
        if (loop_timeout_id === null) {
            return;
        }

        clear_all_playing_classes();
        clearTimeout(loop_timeout_id);
        clearTimeout(ui_timeout_id);
        loop_timeout_id = null;
        ui_timeout_id = null;
    });

    function clear_selected_for_col(col_num) {
        const td_list = table.querySelectorAll(`[data-col='${col_num}'].selected`);
        for (td of td_list) {
            td.classList.remove('selected');
        }
    }

    function table_event(target) {
        if (target.nodeName !== 'TD') {
            return;
        }

        let col = target.getAttribute('data-col');
        let row = target.parentNode.getAttribute('data-row');

        clear_selected_for_col(col);
        if (selected_chops[col] == row) {
            selected_chops[col] = null;
        }
        else {
            selected_chops[col] = row;
            const new_td = table.querySelector(`[data-row='${row}']`).childNodes[col];
            new_td.classList.add('selected');
        }
    }

    table.addEventListener('mouseover', event => {
        if (!(event.buttons & 1)) {
            return;
        }
        table_event(event.target);
    });

    table.addEventListener('mousedown', event => table_event(event.target));
});
