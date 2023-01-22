let PatMuted = false;
let mumMuted = false;
let PatLedsOn = false;
let mumLedsOn = false;
function bytesToArray(bits: number) {
    let noteArray = [];
    let bitCheckMask = 1
    let arrayPos = 0;
    for (let i = 0; i <= 16 - 1; i++) {
        if (bitCheckMask & bits) {
            noteArray.push(i);
        }
        bitCheckMask = bitCheckMask << 1;
    }
    return noteArray;
}


const NOTE_ON = 0x90
const NOTE_OFF = 0x80
radio.setGroup(83)


let strip = neopixel.create(DigitalPin.P1, 16, NeoPixelMode.RGB)
strip.showRainbow();
control.inBackground(function() {
    for(let i = 0; i<64; i++){
        strip.rotate(1);
        strip.show();
        basic.pause(40);
    }
    strip.clear();
    strip.show();

})
let ledsPlotted = false

function plotPatLeds(){
    PatLedsOn = true
    led.plot(0, 0)
    led.plot(1, 0)
    led.plot(0, 1)
    led.plot(1, 1)
    led.plot(0, 2)
    led.plot(1, 2)
    mumLedsOn = true
    led.plot(3, 0)
    led.plot(4, 0)
    led.plot(3, 1)
    led.plot(4, 1)
    led.plot(3, 2)
    led.plot(4, 2)
    control.inBackground(function() {
      basic.pause(30);
        led.unplot(0, 0)
        led.unplot(1, 0)
        led.unplot(0, 1)
        led.unplot(1, 1)
        led.unplot(0, 2)
        led.unplot(1, 2)
        PatLedsOn = false
        basic.pause(30);
        led.unplot(3, 0)
        led.unplot(4, 0)
        led.unplot(3, 1)
        led.unplot(4, 1)
        led.unplot(3, 2)
        led.unplot(4, 2)
        mumLedsOn = false
    })
}

function plotMumLeds() {
    mumLedsOn = true
    led.plot(3, 0)
    led.plot(4, 0)
    led.plot(3, 1)
    led.plot(4, 1)
    led.plot(3, 2)
    led.plot(4, 2)
    control.inBackground(function () {
        basic.pause(30);
        led.unplot(3, 0)
        led.unplot(4, 0)
        led.unplot(3, 1)
        led.unplot(4, 1)
        led.unplot(3, 2)
        led.unplot(4, 2)
        mumLedsOn = false
    })
}

basic.forever(function() {
    strip.shift(2)
    strip.show()    
})
input.onButtonPressed(Button.A, function() {
    //radio.sendValue("PatP", 0b0001001000100000)
    transposeOct -= 12
})

input.onButtonPressed(Button.B, function () {
    //radio.sendValue("PatP", 0b0001001000100000)
    transposeOct += 12
})

let mumWasMuted = false
let PatWasMuted = false

radio.onReceivedValue(function(name: string, value: number) {
    if(!PatMuted){
        if (name == "Pat") {
            sendNoteToPat(value)
            plotPatLeds();
        } else if (name == "PatP") {
            plotPatLeds()
            let arrayOfNotes = bytesToArray(value);
            arrayOfNotes.forEach(function (value) {
                sendNoteToPat(value);
            });
            control.inBackground(function () {
                basic.pause(40)
                arrayOfNotes.forEach(function (value) {
                    turnOffNotePat(value);
                });
            })

        }
    }
 /*
    if(!mumMuted){    
        if (name == "Mum") {
            sendNoteToMum(value)
            plotMumLeds();
        } else if (name == "MumP") {
            let arrayOfNotes = bytesToArray(value);
            arrayOfNotes.forEach(function (value) {
                sendNoteToMum(value);
            });
            plotMumLeds();
        }
    }
   */ 

    if (name == "m") {
        //serial.redirectToUSB()
        //serial.writeValue("gotM", 1);
        /*
        Bob 00000001
        Tim 00000010
        Ted 00000100
        Pat 00001000
        Pat 00010000
        Dad 00100000
        Mum 01000000
        Zim 10000000
        */

            PatMuted = false
            mumMuted = false
            led.unplot(2,0)
            led.unplot(2,2)
            
        /*
            basic.showLeds(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            # # # # #
            `,0)
        */
        
        if (value & 0b00010000) {
            PatMuted = true
            led.plot(0, 0)
            led.plot(2, 0)
            led.plot(1, 1)
            led.plot(0, 2)
            led.plot(2, 2)
        } else {
            if(!PatLedsOn){
                led.unplot(0, 0)
                led.unplot(1, 1)
                led.unplot(0, 2)
            }
        }
        
        if (value & 0b01000000){
            mumMuted = true
            led.plot(2, 0)
            led.plot(4, 0)
            led.plot(3, 1)
            led.plot(2, 2)
            led.plot(4, 2)
        } else {
            if(!mumLedsOn){
                led.unplot(4, 0)
                led.unplot(3, 1)
                led.unplot(4, 2)
            }
        }
    }
})



function noteOn(note: number, velocity: number, channel: number) {
    let midiMessage = pins.createBuffer(3);
    midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_ON | channel);
    midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
    midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
    serial.writeBuffer(midiMessage);
}

function noteOff(note: number, velocity: number, channel: number) {
    let midiMessage = pins.createBuffer(3);
    midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_OFF | channel);
    midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
    midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
    serial.writeBuffer(midiMessage);
}


basic.showLeds(`
    . . . . .
    . . . . .
    . . . . .
    . . . . .
    # # # # #
    `)

serial.redirect(
    SerialPin.P0,
    SerialPin.P8,
    BaudRate.BaudRate31250
)


let run = false;
let brightness = 0;
let oldPitch = 0;

function sendNoteToMum(note: number){
    noteOn(note+36,127,9);
    strip.showColor(neopixel.rgb(255 - note*32, note*32, 0))
}

function sendNoteToPat(note: number) {
    noteOn(note + transposeOct, 127, 0);
    strip.showColor(neopixel.rgb(0, note * 32, 255 - note * 32))
}

function turnOffNotePat(note: number) {
    noteOff(note + transposeOct, 127, 0);
}

let transposeOct = 12* 4