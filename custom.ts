enum ButtonChoice {
    C,
    D
}

//% weight=100 color=#EB8AEB icon="\u26a1"
//% groups="['Boutons Poussoirs', 'Potentiomètre', 'Moteur', 'Servomoteur', 'Ecran OLED', 'Anneau lumineux']"
namespace convoyeur {

    //%block="Lorsque bouton %button est appuyé"
    //%group='Boutons Poussoirs'
    export function onButtonPressed(button: ButtonChoice, handler: () => void) {
        //Surveillance en arrière plan 
        control.inBackground(function () {
            let etatPrecedent = 1 // 1 = relâché (PullUp)
            const pin = (button == ButtonChoice.C) ? DigitalPin.P13 : DigitalPin.P14

            while (true) {
                let etatActuel = pins.digitalReadPin(pin)

                // Détection du front descendant (appui) : passe de 1 à 0
                if (etatPrecedent == 1 && etatActuel == 0) {
                    handler() // On exécute les blocs à l'intérieur
                }

                etatPrecedent = etatActuel
                basic.pause(50) // Petite pause pour l'anti-rebond et libérer le processeur
            }
        })
    }

    //%block="Bouton %button appuyé" 
    //%group='Boutons Poussoirs'
    export function buttonPressed(button: ButtonChoice): boolean {
        if (button == ButtonChoice.C) {
            return pins.digitalReadPin(DigitalPin.P13) == 0; // Retourne true si pressé
        } else {
            return pins.digitalReadPin(DigitalPin.P14) == 0;
        }
    }

    //%group='Potentiomètre' color=#E67E91
    //%block="Valeur potentiomètre"
    export function potentiometerValue() {
        return pins.analogReadPin(AnalogPin.P2)
    }

    //%group='Moteur' color=#86D17B
    //%block="Activer le moteur à la vitesse %speed"
    //%speed.min=0 speed.max=100 speed.defl=50 
    export function setMotorSpeed(speed: number) {
        let safeSpeed = Math.max(0, Math.min(100, speed)); //fonction Math.max empêche d'entrer une valeur en dehors de [0;100]
        let pwmValue = Math.map(safeSpeed, 0, 100, 0, 1023); //fonction Math.map sert à changer d'échelle 
        pins.digitalWritePin(DigitalPin.P16, 0);
        pins.analogWritePin(AnalogPin.P15, pwmValue);
    }

    //%block="Arrêter le moteur"
    //%group='Moteur' color=#86D17B
    export function stopMotor() {
        pins.digitalWritePin(DigitalPin.P15, 0)
        pins.digitalWritePin(DigitalPin.P16, 0)
    }

    //%block="Activer le moteur"
    //%group='Moteur' color=#86D17B
    export function startMotor() {
        pins.digitalWritePin(DigitalPin.P15, 1)
        pins.digitalWritePin(DigitalPin.P16, 0)
    }

    //%block="Fixe l'angle du servo à %angle °"
    //%group='Servomoteur' color=#6CCAE6
    export function setServoAngle(angle: number): void {
        const neZha_address = 0x10
        let iic_buffer = pins.createBuffer(4);
        iic_buffer[0] = 0x10;
        iic_buffer[1] = angle;
        iic_buffer[2] = 0;
        iic_buffer[3] = 0;
        pins.i2cWriteBuffer(neZha_address, iic_buffer);
    }

    ////////////////////////////////TM 1637/////////////////
    let TM1637_CMD1 = 0x40;
    let TM1637_CMD2 = 0xC0;
    let TM1637_CMD3 = 0x80;
    let _SEGMENTS = [0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F, 0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71];
    /////////////////////OLED///////////////////////////////
    let firstoledinit = true
    const basicFont: string[] = [
        "\x00\x00\x00\x00\x00\x00\x00\x00", // " "
        "\x00\x00\x5F\x00\x00\x00\x00\x00", // "!"
        "\x00\x00\x07\x00\x07\x00\x00\x00", // """
        "\x00\x14\x7F\x14\x7F\x14\x00\x00", // "#"
        "\x00\x24\x2A\x7F\x2A\x12\x00\x00", // "$"
        "\x00\x23\x13\x08\x64\x62\x00\x00", // "%"
        "\x00\x36\x49\x55\x22\x50\x00\x00", // "&"
        "\x00\x00\x05\x03\x00\x00\x00\x00", // "'"
        "\x00\x1C\x22\x41\x00\x00\x00\x00", // "("
        "\x00\x41\x22\x1C\x00\x00\x00\x00", // ")"
        "\x00\x08\x2A\x1C\x2A\x08\x00\x00", // "*"
        "\x00\x08\x08\x3E\x08\x08\x00\x00", // "+"
        "\x00\xA0\x60\x00\x00\x00\x00\x00", // ","
        "\x00\x08\x08\x08\x08\x08\x00\x00", // "-"
        "\x00\x60\x60\x00\x00\x00\x00\x00", // "."
        "\x00\x20\x10\x08\x04\x02\x00\x00", // "/"
        "\x00\x3E\x51\x49\x45\x3E\x00\x00", // "0"
        "\x00\x00\x42\x7F\x40\x00\x00\x00", // "1"
        "\x00\x62\x51\x49\x49\x46\x00\x00", // "2"
        "\x00\x22\x41\x49\x49\x36\x00\x00", // "3"
        "\x00\x18\x14\x12\x7F\x10\x00\x00", // "4"
        "\x00\x27\x45\x45\x45\x39\x00\x00", // "5"
        "\x00\x3C\x4A\x49\x49\x30\x00\x00", // "6"
        "\x00\x01\x71\x09\x05\x03\x00\x00", // "7"
        "\x00\x36\x49\x49\x49\x36\x00\x00", // "8"
        "\x00\x06\x49\x49\x29\x1E\x00\x00", // "9"
        "\x00\x00\x36\x36\x00\x00\x00\x00", // ":"
        "\x00\x00\xAC\x6C\x00\x00\x00\x00", // ";"
        "\x00\x08\x14\x22\x41\x00\x00\x00", // "<"
        "\x00\x14\x14\x14\x14\x14\x00\x00", // "="
        "\x00\x41\x22\x14\x08\x00\x00\x00", // ">"
        "\x00\x02\x01\x51\x09\x06\x00\x00", // "?"
        "\x00\x32\x49\x79\x41\x3E\x00\x00", // "@"
        "\x00\x7E\x09\x09\x09\x7E\x00\x00", // "A"
        "\x00\x7F\x49\x49\x49\x36\x00\x00", // "B"
        "\x00\x3E\x41\x41\x41\x22\x00\x00", // "C"
        "\x00\x7F\x41\x41\x22\x1C\x00\x00", // "D"
        "\x00\x7F\x49\x49\x49\x41\x00\x00", // "E"
        "\x00\x7F\x09\x09\x09\x01\x00\x00", // "F"
        "\x00\x3E\x41\x41\x51\x72\x00\x00", // "G"
        "\x00\x7F\x08\x08\x08\x7F\x00\x00", // "H"
        "\x00\x41\x7F\x41\x00\x00\x00\x00", // "I"
        "\x00\x20\x40\x41\x3F\x01\x00\x00", // "J"
        "\x00\x7F\x08\x14\x22\x41\x00\x00", // "K"
        "\x00\x7F\x40\x40\x40\x40\x00\x00", // "L"
        "\x00\x7F\x02\x0C\x02\x7F\x00\x00", // "M"
        "\x00\x7F\x04\x08\x10\x7F\x00\x00", // "N"
        "\x00\x3E\x41\x41\x41\x3E\x00\x00", // "O"
        "\x00\x7F\x09\x09\x09\x06\x00\x00", // "P"
        "\x00\x3E\x41\x51\x21\x5E\x00\x00", // "Q"
        "\x00\x7F\x09\x19\x29\x46\x00\x00", // "R"
        "\x00\x26\x49\x49\x49\x32\x00\x00", // "S"
        "\x00\x01\x01\x7F\x01\x01\x00\x00", // "T"
        "\x00\x3F\x40\x40\x40\x3F\x00\x00", // "U"
        "\x00\x1F\x20\x40\x20\x1F\x00\x00", // "V"
        "\x00\x3F\x40\x38\x40\x3F\x00\x00", // "W"
        "\x00\x63\x14\x08\x14\x63\x00\x00", // "X"
        "\x00\x03\x04\x78\x04\x03\x00\x00", // "Y"
        "\x00\x61\x51\x49\x45\x43\x00\x00", // "Z"
        "\x00\x7F\x41\x41\x00\x00\x00\x00", // """
        "\x00\x02\x04\x08\x10\x20\x00\x00", // "\"
        "\x00\x41\x41\x7F\x00\x00\x00\x00", // """
        "\x00\x04\x02\x01\x02\x04\x00\x00", // "^"
        "\x00\x80\x80\x80\x80\x80\x00\x00", // "_"
        "\x00\x01\x02\x04\x00\x00\x00\x00", // "`"
        "\x00\x20\x54\x54\x54\x78\x00\x00", // "a"
        "\x00\x7F\x48\x44\x44\x38\x00\x00", // "b"
        "\x00\x38\x44\x44\x28\x00\x00\x00", // "c"
        "\x00\x38\x44\x44\x48\x7F\x00\x00", // "d"
        "\x00\x38\x54\x54\x54\x18\x00\x00", // "e"
        "\x00\x08\x7E\x09\x02\x00\x00\x00", // "f"
        "\x00\x18\xA4\xA4\xA4\x7C\x00\x00", // "g"
        "\x00\x7F\x08\x04\x04\x78\x00\x00", // "h"
        "\x00\x00\x7D\x00\x00\x00\x00\x00", // "i"
        "\x00\x80\x84\x7D\x00\x00\x00\x00", // "j"
        "\x00\x7F\x10\x28\x44\x00\x00\x00", // "k"
        "\x00\x41\x7F\x40\x00\x00\x00\x00", // "l"
        "\x00\x7C\x04\x18\x04\x78\x00\x00", // "m"
        "\x00\x7C\x08\x04\x7C\x00\x00\x00", // "n"
        "\x00\x38\x44\x44\x38\x00\x00\x00", // "o"
        "\x00\xFC\x24\x24\x18\x00\x00\x00", // "p"
        "\x00\x18\x24\x24\xFC\x00\x00\x00", // "q"
        "\x00\x00\x7C\x08\x04\x00\x00\x00", // "r"
        "\x00\x48\x54\x54\x24\x00\x00\x00", // "s"
        "\x00\x04\x7F\x44\x00\x00\x00\x00", // "t"
        "\x00\x3C\x40\x40\x7C\x00\x00\x00", // "u"
        "\x00\x1C\x20\x40\x20\x1C\x00\x00", // "v"
        "\x00\x3C\x40\x30\x40\x3C\x00\x00", // "w"
        "\x00\x44\x28\x10\x28\x44\x00\x00", // "x"
        "\x00\x1C\xA0\xA0\x7C\x00\x00\x00", // "y"
        "\x00\x44\x64\x54\x4C\x44\x00\x00", // "z"
        "\x00\x08\x36\x41\x00\x00\x00\x00", // "{"
        "\x00\x00\x7F\x00\x00\x00\x00\x00", // "|"
        "\x00\x41\x36\x08\x00\x00\x00\x00", // "}"
        "\x00\x02\x01\x01\x02\x01\x00\x00"  // "~"
    ];
    function oledcmd(c: number) {
        pins.i2cWriteNumber(0x3c, c, NumberFormat.UInt16BE);
    }
    function writeData(n: number) {
        let b = n;
        if (n < 0) { n = 0 }
        if (n > 255) { n = 255 }
        pins.i2cWriteNumber(0x3c, 0x4000 + b, NumberFormat.UInt16BE);
    }
    function writeCustomChar(c: string) {
        for (let i = 0; i < 8; i++) {
            writeData(c.charCodeAt(i));
        }
    }
    function setText(row: number, column: number) {
        let r = row;
        let c = column;
        if (row < 0) { r = 0 }
        if (column < 0) { c = 0 }
        if (row > 7) { r = 7 }
        if (column > 15) { c = 15 }
        oledcmd(0xB0 + r);            //set page address
        oledcmd(0x00 + (8 * c & 0x0F));  //set column lower address
        oledcmd(0x10 + ((8 * c >> 4) & 0x0F));   //set column higher address
    }
    function putChar(c: string) {
        let c1 = c.charCodeAt(0);
        writeCustomChar(basicFont[c1 - 32]);
    }
    function oledinit(): void {
        oledcmd(0xAE);  // Set display OFF
        oledcmd(0xD5);  // Set Display Clock Divide Ratio / OSC Frequency 0xD4
        oledcmd(0x80);  // Display Clock Divide Ratio / OSC Frequency 
        oledcmd(0xA8);  // Set Multiplex Ratio
        oledcmd(0x3F);  // Multiplex Ratio for 128x64 (64-1)
        oledcmd(0xD3);  // Set Display Offset
        oledcmd(0x00);  // Display Offset
        oledcmd(0x40);  // Set Display Start Line
        oledcmd(0x8D);  // Set Charge Pump
        oledcmd(0x14);  // Charge Pump (0x10 External, 0x14 Internal DC/DC)
        oledcmd(0xA1);  // Set Segment Re-Map
        oledcmd(0xC8);  // Set Com Output Scan Direction
        oledcmd(0xDA);  // Set COM Hardware Configuration
        oledcmd(0x12);  // COM Hardware Configuration
        oledcmd(0x81);  // Set Contrast
        oledcmd(0xCF);  // Contrast
        oledcmd(0xD9);  // Set Pre-Charge Period
        oledcmd(0xF1);  // Set Pre-Charge Period (0x22 External, 0xF1 Internal)
        oledcmd(0xDB);  // Set VCOMH Deselect Level
        oledcmd(0x40);  // VCOMH Deselect Level
        oledcmd(0xA4);  // Set all pixels OFF
        oledcmd(0xA6);  // Set display not inverted
        oledcmd(0xAF);  // Set display On
    }
    //////////////////////////////////////////////////////////////Matrix
    let initializedMatrix = false
    const HT16K33_ADDRESS = 0x70
    const HT16K33_BLINK_CMD = 0x80
    const HT16K33_BLINK_DISPLAYON = 0x01
    const HT16K33_CMD_BRIGHTNESS = 0xE0
    let matBuf = pins.createBuffer(17)
    function matrixInit() {
        i2ccmd(HT16K33_ADDRESS, 0x21);// turn on oscillator
        i2ccmd(HT16K33_ADDRESS, HT16K33_BLINK_CMD | HT16K33_BLINK_DISPLAYON | (0 << 1));
        i2ccmd(HT16K33_ADDRESS, HT16K33_CMD_BRIGHTNESS | 0xF);
    }
    function i2ccmd(addr: number, value: number) {
        let buf = pins.createBuffer(1)
        buf[0] = value
        pins.i2cWriteBuffer(addr, buf)
    }
    function matrixShow() {
        matBuf[0] = 0x00;
        pins.i2cWriteBuffer(HT16K33_ADDRESS, matBuf);
    }

    //% line.min=1 line.max=8 line.defl=1
    //% text.defl="Hello world !"
    //%block="Afficher texte %text ligne %line"
    //%group='Ecran OLED' color=#E6846C
    export function showUserText(text: string, line: number) {
        if (firstoledinit) {
            oledinit()
            firstoledinit = false
        }
        if (text.length > 16) {
            text = text.substr(0, 16)
        }
        line = line - 1
        setText(line, 0);
        for (let c of text) {
            putChar(c);
        }

        for (let i = text.length; i < 16; i++) {
            setText(line, i);
            putChar(" ");
        }
    }

    //% line.min=1 line.max=8 line.defl=2 
    //% n.defl=20200507
    //%block="Afficher nombre %n ligne %line"
    //%group='Ecran OLED' color=#E6846C
    export function showUserNumber(n: number, line: number) {
        if (firstoledinit) {
            oledinit()
            firstoledinit = false
        }
        showUserText("" + n, line)
    }

    //%block="Effacer l'écran"
    //%group='Ecran OLED' color=#E6846C
    export function oledClear() {
        //oledcmd(DISPLAY_OFF);   //display off
        for (let j = 0; j < 8; j++) {
            setText(j, 0);
            {
                for (let i = 0; i < 16; i++)  //clear all columns
                {
                    putChar(' ');
                }
            }
        }
        //oledcmd(DISPLAY_ON);    //display on
        setText(0, 0);
    }


    /////// Anneau de LEDs /////// 


    export enum DigitalRJPin {
        //% block="J1" 
        J1,
        //% block="J2"
        J2,
        //% block="J3"
        J3,
        //% block="J4"
        J4
    }

    export enum Colors {
        //% block=rouge
        Red = 0x00FF00,
        //% block=vert
        Green = 0xFF0000,
        //% block=bleu
        Blue = 0x0000FF,
        //% block=blanc 
        White = 0xFFFFFF,
        //% block=noir 
        Black = 0x000000
    }

    export class Strip {
        buf: Buffer;
        pin: DigitalPin;
        _length: number;

        constructor(numleds: number, pin: DigitalPin) {
            this._length = numleds;
            this.pin = pin;
            this.buf = pins.createBuffer(numleds * 3); // RGB simple
        }

        showColor(rgb: number) {
            let r = (rgb >> 16) & 0xFF;
            let g = (rgb >> 8) & 0xFF;
            let b = rgb & 0xFF;

            // luminosité fixée à 25
            let scale = 25 / 255;

            for (let i = 0; i < this._length; i++) {
                this.buf[i * 3 + 0] = Math.floor(r * scale);
                this.buf[i * 3 + 1] = Math.floor(g * scale);
                this.buf[i * 3 + 2] = Math.floor(b * scale);
            }

            // Utilisation de la fonction native de la micro:bit sans l'extension Neopixel "ws2812b.sendBuffer(this.buf, this.pin);"
            light.sendWS2812Buffer(this.buf, this.pin);
        }

        allOn() {
            this.showColor(Colors.White);
        }
    }

    function create(pin: DigitalPin): Strip {
        return new Strip(8, pin);
    }

    //% block="Changer la couleur de l'anneau en %color"
    //% group='Anneau lumineux'
    export function setRingColor(color: Colors) {
        let strip = create(DigitalPin.P8)
        strip.showColor(color)
    }

    //% block="Allumer l'anneau"
    //% group= 'Anneau lumineux'
    export function lightsON() {
        let strip = create(DigitalPin.P8)
        let color = Colors.White
        strip.showColor(color)
    }

    //% block="Eteindre l'anneau"
    //% group= 'Anneau lumineux'
    export function lightsOFF() {
        let strip = create(DigitalPin.P8)
        let color = Colors.Black
        strip.showColor(color)
    }



/////// Caméra IA /////// 

    //% groups='Caméra IA'
    //% advanced=true
    //% weight=100
    const CameraAdd = 0X14;
    let DataBuff = pins.createBuffer(9);
    /**
    * Status List of Ball
    */
    export enum FuncList {
        //% block="Card recognition"
        Card = 2,
        //% block="Face recognition" 
        Face = 6,
        //% block="Ball recognition"
        Ball = 7,
        //% block="Tracking recognition"
        Tracking = 8,
        //% block="Color recognition"
        Color = 9,
        //% block="Learn Object"
        Things = 10
    }
    /**
    * Status List of Ball
    */
    export enum Ballstatus {
        //% block="X"
        X = 2,
        //% block="Y"
        Y = 3,
        //% block="Size"
        Size = 4,
        //% block="Confidence level "
        Confidence = 6,
        //% block="Ball ID"
        ID = 8
    }
    /**
    * Status List of Face
    */
    export enum Facestatus {
        //% block="X"
        X = 2,
        //% block="Y"
        Y = 3,
        //% block="W"
        W = 4,
        //% block="H"
        H = 5,
        //% block="Confidence level "
        Confidence = 6,
        //% block="Face ID"
        ID = 8
    }
    /**
    * Status List of Card
    */
    export enum Cardstatus {
        //% block="X"
        X = 2,
        //% block="Y"
        Y = 3,
        //% block="Size"
        Size = 4,
        //% block="Confidence level "
        Confidence = 6,
        //% block="Card ID"
        ID = 8
    }
    /**
    * Status List of Color
    */
    export enum Colorstatus {
        //% block="X"
        X = 2,
        //% block="Y"
        Y = 3,
        //% block="Size"
        Size = 4,
        //% block="Confidence level "
        Confidence = 6,
        //% block="Color ID"
        ID = 8
    }
    /**
    * Status List of Color
    */
    export enum ColorLs {
        //% block="Black"
        black = 4,
        //% block="Blue"
        blue = 2,
        //% block="Green"
        green = 1,
        //% block="Red"
        red = 5,
        //% block="White"
        white = 6,
        //% block="Yellow"
        yellow = 3
    }

    export enum Linestatus {
        //% block="Angle"
        angle = 1,
        //% block="Width"
        width = 2,
        //% block="Len"
        len = 3
    }
    export enum LineTrend {
        //% block="Left"
        left,
        //% block="Right"
        right,
        //% block="Front"
        front,
        //% block="None"
        none
    }
    /**
    * Number Cards List
    */
    export enum numberCards {
        //% block="0"
        zero = 1,
        //% block="1"
        one = 2,
        //% block="2"
        two = 3,
        //% block="3"
        three = 4,
        //% block="4"
        four = 5,
        //% block="5"
        five = 6,
        //% block="6"
        six = 7,
        //% block="7"
        seven = 8,
        //% block="8"
        eight = 9,
        //% block="9"
        nine = 10
    }
    /*
    * Letters Cards List
    */
    export enum letterCards {
        //% block="A"
        A = 1,
        //% block="B"
        B = 2,
        //% block="C"
        C = 3,
        //% block="D"
        D = 4,
        //% block="E"
        E = 5
    }
    /*
    * Traffic Cards List
    */
    export enum trafficCards {
        //% block="Forward"
        forward = 18,
        //% block="Back"
        back = 20,
        //% block="Stop"
        stop = 19,
        //% block="Turn left"
        turnleft = 16,
        //% block="Turn right"
        turnright = 17
    }
    /*
    * Other Cards List
    */
    export enum otherCards {
        //% block="Mouse"
        mouse = 1,
        //% block="micro:bit"
        microbit = 2,
        //% block="Ruler"
        ruler = 3,
        //% block="Cat"
        cat = 4,
        //% block="Pear"
        pear = 5,
        //% block="Ship"
        ship = 6,
        //% block="Apple"
        apple = 7,
        //% block="Car"
        car = 8,
        //% block="Pen"
        pen = 9,
        //% block="Dog"
        dog = 10,
        //% block="Umbrella"
        umbrella = 11,
        //% block="Airplane"
        airplane = 12,
        //% block="Clock"
        clock = 13,
        //% block="Grape"
        grape = 14,
        //% block="Cup"
        cup = 15
    }
    export enum learnID {
        ID1 = 1,
        ID2 = 2,
        ID3 = 3,
        ID4 = 4,
        ID5 = 5
    }
    export enum ballColorList {
        //% block="Red"
        Red = 2,
        //% block="Blue"
        Blue = 1
    }
    /////////ASR
    export enum vocabularyList {
        //% block="Hi, Shaun"
        Hi_Shaun = 1,
        //% block="Lights on"
        Turn_on_lights = 16,
        //% block="Lights off"
        Turn_off_lights = 17,
        //% block="Turn left"
        Turn_left = 18,
        //% block="Turn right"
        Turn_right = 19,
        //% block="Full speed ahead"
        Go_forward = 20,
        //% block="Reversing"
        Go_Backwards = 21,
        //% block="Line Tracking"
        Line_tacking = 22,
        //% block="Avoid object"
        Avoid_object = 23,
        //% block="Stop"
        Stop_car = 24,
        //% block="Start device"
        Start_device = 32,
        //% block="Turn off device"
        Close_device = 33,
        //% block="Pause"
        Pause_device = 34,
        //% block="Keep going"
        Keep_going = 35,
        //% block="Raise a level"
        Add_a_level = 36,
        //% block="Lower a level"
        Lower_a_level = 37,
        //% block="Music on"
        Music_on = 38,
        //% block="Music off"
        Music_off = 39,
        //% block="Switch music"
        Switch_music = 40,
        //% block="Execute function one"
        Execute_function_one = 49,
        //% block="Execute function two"
        Execute_function_two = 50,
        //% block="Learning entry 1"
        Learning_entry_1 = 80,
        //% block="Learning entry 2"
        Learning_entry_2 = 81,
        //% block="Learning entry 3"
        Learning_entry_3 = 82,
        //% block="Learning entry 4"
        Learning_entry_4 = 83,
        //% block="Learning entry 5"
        Learning_entry_5 = 84,
        //% block="Learning entry 6"
        Learning_entry_6 = 85,
        //% block="Learning entry 7"
        Learning_entry_7 = 86,
        //% block="Learning entry 8"
        Learning_entry_8 = 87,
        //% block="Learning entry 9"
        Learning_entry_9 = 88,
        //% block="Learning entry 10"
        Learning_entry_10 = 89
    }
    /**
    * TODO: Waiting for module initialize.
    */
    //% block="Initialize AI-Lens"
    //% group="Basic" weight=100 subcategory=Vision
    //% color=#00B1ED
    export function initModule(): void {
        let timeout = input.runningTime()
        while (!(pins.i2cReadNumber(CameraAdd, NumberFormat.Int8LE))) {
            if (input.runningTime() - timeout > 30000) {
                while (true) {
                    basic.showString("Init AILens Error!")
                }
            }
        }
    }
    /**
    * TODO: Switch recognition objects.
    * @param fun Function list 
    */
    //% block="Switch function as %fun"
    //% fun.fieldEditor="gridpicker"
    //% fun.fieldOptions.columns=3
    //% group="Basic" weight=95 subcategory=Vision
    //% color=#00B1ED
    export function switchfunc(fun: FuncList): void {
        let funcBuff = pins.i2cReadBuffer(CameraAdd, 9)
        funcBuff[0] = 0x20
        funcBuff[1] = fun
        pins.i2cWriteBuffer(CameraAdd, funcBuff)
    }

    /**
    * TODO: Get the image in a frame
    */
    //% block="Get one image from AI-Lens"
    //% group="Basic" weight=90 subcategory=Vision
    //% color=#00B1ED
    export function cameraImage(): void {
        DataBuff = pins.i2cReadBuffer(CameraAdd, 9)
        basic.pause(30)
    }

    /**
    * TODO: Judge the image contains a ball
    */
    //% block="Image contains ball(s)"
    //% group="Ball" weight=85 subcategory=Vision
    //% color=#00B1ED
    export function checkBall(): boolean {
        return DataBuff[0] == 7
    }
    //% block="Image contains %ballcolor ball"
    //% group="Ball" weight=84
    //% ballcolor.fieldEditor="gridpicker"
    //% ballcolor.fieldOptions.columns=2 subcategory=Vision
    //% color=#00B1ED
    export function ballColor(ballcolor: ballColorList): boolean {
        if (DataBuff[0] == 7) {
            return ballcolor == DataBuff[1]
        }
        else {
            return false
        }
    }
    //% block="In the image get ball(s)' total"
    //% group="Ball" weight=83 subcategory=Vision
    //% color=#00B1ED
    export function BallTotalNum(): number {
        if (DataBuff[0] == 7) {
            return DataBuff[7]
        }
        else {
            return 0
        }
    }
    /**
    * TODO: In the image get ball(s)' info
    */
    //% block="In the image get ball(s)' info: %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Ball" weight=80 subcategory=Vision
    //% color=#00B1ED
    export function ballData(status: Ballstatus): number {
        if (DataBuff[0] == 7) {
            switch (status) {
                case Ballstatus.X:
                    return DataBuff[2]
                    break
                case Ballstatus.Y:
                    return DataBuff[3]
                    break
                case Ballstatus.Size:
                    return DataBuff[4]
                    break
                case Ballstatus.Confidence:
                    return 100 - DataBuff[6]
                    break
                case Ballstatus.ID:
                    return DataBuff[8]
                    break
                default:
                    return 0;
            }
        }
        else {
            return 0
        }
    }


    /**
    * TODO: Judge whether there is a face in the picture
    */
    //% block="Image contains a face"
    //% group="Face" weight=75 subcategory=Vision
    //% color=#00B1ED
    export function checkFace(): boolean {
        return DataBuff[0] == 6
    }
    //% block="In the image get face(s)' total"
    //% group="Face" weight=74 subcategory=Vision
    //% color=#00B1ED
    export function faceTotalNum(): number {
        if (DataBuff[0] == 6) {
            return DataBuff[7]
        }
        else {
            return 0
        }
    }
    /**
    * TODO: Judge whether there is a face in the picture
    * @param status Facestatus
    */
    //% block="In the image get face(s)' info: %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Face" weight=70 subcategory=Vision
    //% color=#00B1ED
    export function faceData(status: Facestatus): number {
        if (DataBuff[0] == 6) {
            switch (status) {
                case Facestatus.X:
                    return DataBuff[2]
                    break
                case Facestatus.Y:
                    return DataBuff[3]
                    break
                case Facestatus.W:
                    return DataBuff[4]
                    break
                case Facestatus.H:
                    return DataBuff[5]
                    break
                case Facestatus.Confidence:
                    return 100 - DataBuff[6]
                    break
                case Facestatus.ID:
                    return DataBuff[8]
                    break
                default:
                    return 0
            }
        }
        else {
            return 0
        }
    }
    /**
    * TODO: Judge whether there is a digital card in the screen
    * @param status numberCards
    */
    //% block="Image contains number card(s): %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Card" weight=65 subcategory=Vision
    //% color=#00B1ED
    export function numberCard(status: numberCards): boolean {
        if (DataBuff[0] == 2) {
            return status == DataBuff[1]
        }
        else
            return false
    }
    /**
    * TODO: Judge whether there is a letter card in the screen
    * @param status letterCards
    */
    //% block="Image contains letter card(s): %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Card" weight=60 subcategory=Vision
    //% color=#00B1ED
    export function letterCard(status: letterCards): boolean {
        if (DataBuff[0] == 4) {
            return status == DataBuff[1]
        }
        else
            return false
    }
    /**
    * TODO: Judge whether there is a traffic card in the screen
    * @param status trafficCards
    */
    //% block="Image contains traffic card(s): %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Card" weight=55 subcategory=Vision
    //% color=#00B1ED
    export function trafficCard(status: trafficCards): boolean {
        if (DataBuff[0] == 3) {
            return status == DataBuff[1]
        }
        else
            return false
    }
    /**
    * TODO: Judge whether there is a other card in the screen
    * @param status otherCards
    */
    //% block="Image contains other card(s): %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Card" subcategory=Vision
    //% color=#00B1ED
    export function otherCard(status: otherCards): boolean {
        if (DataBuff[0] == 3) {
            return status == DataBuff[1]
        }
        else
            return false
    }
    //% block="In the image get Card(s)' total"
    //% group="Card" weight=49 subcategory=Vision
    //% color=#00B1ED
    export function cardTotalNum(): number {
        if (DataBuff[0] == 2 || DataBuff[0] == 3 || DataBuff[0] == 4) {
            return DataBuff[7]
        }
        else {
            return 0
        }
    }
    /**
    * TODO: Card parameters in the screen
    * @param status otherCards
    */
    //% block="In the image get Card(s)' info: %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Card" weight=45 subcategory=Vision
    //% color=#00B1ED
    export function CardData(status: Cardstatus): number {
        if (DataBuff[0] == 2 || DataBuff[0] == 3 || DataBuff[0] == 4) {
            switch (status) {
                case Cardstatus.X:
                    return DataBuff[2]
                    break
                case Cardstatus.Y:
                    return DataBuff[3]
                    break
                case Cardstatus.Size:
                    return DataBuff[4]
                    break
                case Cardstatus.Confidence:
                    return 100 - DataBuff[6]
                    break
                case Cardstatus.ID:
                    return DataBuff[8]
                    break
                default:
                    return 0
            }
        }
        else
            return 0
    }
    /**
    * TODO: Judge whether there is a color in the screen
    * @param status ColorLs
    */
    //% block="Image contains color card(s): %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Color" weight=30 subcategory=Vision
    //% color=#00B1ED
    export function colorCheck(status: ColorLs): boolean {
        if (DataBuff[0] == 9) {
            return status == DataBuff[1]
        }
        else
            return false
    }
    //% block="In the image get color card(s)' total"
    //% group="Color" weight=29 subcategory=Vision
    //% color=#00B1ED
    export function colorTotalNum(): number {
        if (DataBuff[0] == 9) {
            return DataBuff[7]
        }
        else {
            return 0
        }
    }
    /**
    * TODO: color parameters in the screen
    * @param status Colorstatus
    */
    //% block="In the image get color card(s)' info: %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Color" weight=25 subcategory=Vision
    //% color=#00B1ED
    export function colorData(status: Colorstatus): number {
        if (DataBuff[0] == 9) {
            switch (status) {
                case Colorstatus.X:
                    return DataBuff[2]
                    break
                case Colorstatus.Y:
                    return DataBuff[3]
                    break
                case Colorstatus.Size:
                    return DataBuff[4]
                    break
                case Colorstatus.Confidence:
                    return 100 - DataBuff[6]
                    break
                case Colorstatus.ID:
                    return DataBuff[8]
                    break
                default:
                    return 0
            }
        }
        else {
            return 0
        }
    }
    /**
    * TODO: line parameters in the screen
    * @param status Linestatus
    */
    //% block="In the image get line(s)' info: %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Tracking"
    //% weight=35 subcategory=Vision
    //% color=#00B1ED
    export function lineData(status: Linestatus): number {
        if (DataBuff[0] == 8) {
            switch (status) {
                case Linestatus.angle:
                    return DataBuff[1]
                    break
                case Linestatus.width:
                    return DataBuff[2]
                    break
                case Linestatus.len:
                    return DataBuff[3]
                    break
                default:
                    return 0
            }
        }
        else
            return 0
    }
    /**
    * TODO: line parameters in the screen
    * @param status Linestatus
    */
    //% block="Image contains line's direction towards %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=2
    //% group="Tracking"
    //% weight=34 subcategory=Vision
    //% color=#00B1ED
    export function lineDirection(status: LineTrend): boolean {
        if (DataBuff[0] == 8) {
            switch (status) {
                case LineTrend.none:
                    return false
                    break
                case LineTrend.left:
                    if (DataBuff[2] < 90) {
                        return true
                    }
                    else {
                        return false
                    }
                    break
                case LineTrend.right:
                    if (DataBuff[2] > 130) {
                        return true
                    }
                    else {
                        return false
                    }
                    break
                case LineTrend.front:
                    if (DataBuff[2] > 90 && DataBuff[2] < 130) {
                        return true
                    }
                    else {
                        return false
                    }
                    break
            }
        }
        else {
            if (status == LineTrend.none)
                return true
        }
        return false
    }

    /**
    * TODO: Learn an object in a picture
    * @param thingsID Edit a label for the object
    */
    //% block="Learn an object with: %thingsID"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Learn" weight=20 subcategory=Vision
    //% color=#00B1ED
    export function learnObject(thingsID: learnID): void {
        let thingsBuf = pins.createBuffer(9)
        thingsBuf[0] = 10
        thingsBuf[1] = thingsID
        pins.i2cWriteBuffer(CameraAdd, thingsBuf)
    }
    /**
    * TODO: Clear Learned Objects
    */
    //% block="Clear learned objects"
    //% group="Learn" weight=15 subcategory=Vision
    //% color=#00B1ED
    export function ClearlearnObject(): void {
        let thingsBuf = pins.createBuffer(9)
        thingsBuf[0] = 10
        thingsBuf[1] = 10
        pins.i2cWriteBuffer(CameraAdd, thingsBuf)
    }
    /**
    * TODO: Judge whether there are any learned objects in the picture
    */
    //% block="Image contains learned objects: %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Learn" weight=14 subcategory=Vision
    //% color=#00B1ED
    export function objectCheck(status: learnID): boolean {
        if (DataBuff[0] == 10 && status == DataBuff[1]) {
            if (objectConfidence(status) >= 83) {
                return true
            }
            else {
                return false
            }
        }
        else
            return false
    }
    /**
    * TODO: Judge whether there are any learned objects in the picture
    */
    //% block="In the image get learn object %thingsID Confidence"
    //% group="Learn" weight=10 subcategory=Vision
    //% color=#00B1ED
    export function objectConfidence(thingsID: learnID): number {
        if (DataBuff[0] == 10 && DataBuff[2] < 30) {
            if (DataBuff[1] == thingsID) {
                return 100 - DataBuff[2]
            }
            else {
                return 0
            }
        }
        return 0
    }
    let asrEventId = 3500
    let lastvoc = 0
    let vocInitFlag = 0

}
