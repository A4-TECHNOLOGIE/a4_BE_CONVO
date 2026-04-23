enum ButtonChoice { // définition des valeurs possibles pour le choix du BP
    A,
    B,
    C,
    D
}

//% weight=100 color=#EB8AEB icon="\u26a1"
//% groups="['Boutons Poussoirs', 'Potentiomètre', 'Moteur', 'Servomoteur', 'Ecran OLED', 'Anneau lumineux']"
namespace a4_BE_CONVO {

    //%block="Lorsque bouton %button est appuyé"
    //%group='Boutons Poussoirs'
    export function onButtonPressed(button: ButtonChoice, handler: () => void) {
        if (button == ButtonChoice.A) {
            input.onButtonPressed(Button.A, handler)
        } else if (button == ButtonChoice.B) {
            input.onButtonPressed(Button.B, handler)
        } else {
            // Boutons C et D sur P13/P14 : surveillance en arrière-plan
            control.inBackground(function () {
                let etatPrecedent = 1 // 1 = relâché (PullUp) 
                const pin = (button == ButtonChoice.C) ? DigitalPin.P13 : DigitalPin.P14 

                while (true) {
                    let etatActuel = pins.digitalReadPin(pin)
                    if (etatPrecedent == 1 && etatActuel == 0) {
                        handler()
                    }
                    etatPrecedent = etatActuel
                    basic.pause(50)
                }
            })
        }
    }

    //%block="Bouton %button appuyé" 
    //%group='Boutons Poussoirs'
    export function buttonPressed(button: ButtonChoice): boolean {
        if (button == ButtonChoice.A) {
            return input.buttonIsPressed(Button.A)
        } else if (button == ButtonChoice.B) {
            return input.buttonIsPressed(Button.B)
        } else if (button == ButtonChoice.C) {
            return pins.digitalReadPin(DigitalPin.P13) == 0 // Retourne true si pressé
        } else {
            return pins.digitalReadPin(DigitalPin.P14) == 0
        }
    }

    //%group='Potentiomètre' color=#E67E91
    //%block="Valeur potentiomètre en pourcentage"
    export function potentiometerValue() {
        return pins.analogReadPin(AnalogPin.P2) / 1023 * 100
    }

    //%group='Moteur' color=#86D17B
    //%block="Activer le moteur à la vitesse %speed \\%"
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


    //%block="Fixe l'angle du servo à %angle °"
    //%group='Servomoteur' color=#6CCAE6
    export function setServoAngle(angle: number): void {
        const neZha_address = 0x10
        let iic_buffer = pins.createBuffer(4);
        iic_buffer[0] = 0x10;  // adresse du destinataire
        iic_buffer[1] = angle; // l'angle souhaité
        iic_buffer[2] = 0;     // octets inutilisés mais
        iic_buffer[3] = 0;     // requis par le protocole du module 
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

    }

    function create(pin: DigitalPin): Strip {
        return new Strip(8, pin);
    }

    //% block="Allumer l'anneau en %color"
    //% group='Anneau lumineux' 
    //% color=#D9BA75
    export function setRingColor(color: Colors) {
        let strip = create(DigitalPin.P8)
        strip.showColor(color)
    }


    //% block="Eteindre l'anneau"
    //% group= 'Anneau lumineux'
    //% color=#D9BA75
    export function lightsOFF() {
        let strip = create(DigitalPin.P8)
        let color = Colors.Black
        strip.showColor(color)
    }

    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% color=#D9BA75
    //% block="Allumer anneau en rouge %red|vert %green|bleu %blue"
    //% group='Anneau lumineux'
    export function rgb(red: number, green: number, blue: number) {
        let strip = create(DigitalPin.P8)
        strip.showColor(packRGB(red, green, blue));
    }

    function packRGB(a: number, b: number, c: number): number {
        return (((b & 0xFF) << 16)| (a & 0xFF) << 8) | (c & 0xFF);
    }



    /////// Caméra IA /////// 

    //% groups='Caméra IA' 
    //% advanced=true
    //% weight=100 
    const CameraAdd = 0X14;
    let DataBuff = pins.createBuffer(9);


    export enum FuncList {
        //% block="Reconnaissance de couleur"
        Color = 9,
        //% block="Apprendre un objet"
        Things = 10
    }

    export enum Colorstatus {
        //% block="Niveau de confiance"
        Confidence = 6,
        //% block="ID couleur"
        ID = 8
    }
    /**
    * Status List of Color
    */
    export enum ColorLs {
        //% block="Noir"
        black = 4,
        //% block="Bleu"
        blue = 2,
        //% block="Vert"
        green = 1,
        //% block="Rouge"
        red = 5,
        //% block="Blanc"
        white = 6,
        //% block="Jaune"
        yellow = 3
    }

    export enum learnID {
        ID1 = 1,
        ID2 = 2,
        ID3 = 3,
        ID4 = 4,
        ID5 = 5
    }

    /**
    * TODO: Waiting for module initialize.
    */
    //% block="Initialiser AI-Lens"
    //% group="Basiques" weight=100 subcategory="Caméra IA" 
    //% color=#79C9A9
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
    //% block="Définir caméra en %fun"
    //% fun.fieldEditor="gridpicker"
    //% fun.fieldOptions.columns=3
    //% group="Basiques" weight=95 subcategory="Caméra IA" 
    //% color=#79C9A9
    export function switchfunc(fun: FuncList): void {
        let funcBuff = pins.i2cReadBuffer(CameraAdd, 9)
        funcBuff[0] = 0x20
        funcBuff[1] = fun
        pins.i2cWriteBuffer(CameraAdd, funcBuff)
    }

    /**
    * TODO: Get the image in a frame
    */
    //% block="Obtenir une image de AI-Lens"
    //% group="Basiques" weight=90 subcategory="Caméra IA"
    //% color=#79C9A9
    export function cameraImage(): void {
        DataBuff = pins.i2cReadBuffer(CameraAdd, 9)
        basic.pause(30)
    }

    /**
    * TODO: Judge whether there is a color in the screen
    * @param status ColorLs
    */
    //% block="Image contient la couleur : %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Couleurs" weight=30 subcategory="Caméra IA" 
    //% color=#79C9A9
    export function colorCheck(status: ColorLs): boolean {
        if (DataBuff[0] == 9) {
            return status == DataBuff[1]
        }
        else
            return false
    }


    /**
    * TODO: Learn an object in a picture
    * @param thingsID Edit a label for the object
    */
    //% block="Apprendre un objet avec : %thingsID"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Apprendre" weight=20 subcategory="Caméra IA" 
    //% color=#79C9A9
    export function learnObject(thingsID: learnID): void {
        let thingsBuf = pins.createBuffer(9)
        thingsBuf[0] = 10
        thingsBuf[1] = thingsID
        pins.i2cWriteBuffer(CameraAdd, thingsBuf)
    }
    /**
    * TODO: Clear Learned Objects
    */
    //% block="Effacer objets appris"
    //% group="Apprendre" weight=15 subcategory="Caméra IA" 
    //% color=#79C9A9
    export function ClearlearnObject(): void {
        let thingsBuf = pins.createBuffer(9)
        thingsBuf[0] = 10
        thingsBuf[1] = 10
        pins.i2cWriteBuffer(CameraAdd, thingsBuf)
    }
    /**
    * TODO: Judge whether there are any learned objects in the picture
    */
    //% block="Image contient des objets appris : %status"
    //% status.fieldEditor="gridpicker"
    //% status.fieldOptions.columns=3
    //% group="Apprendre" weight=14 subcategory="Caméra IA" 
    //% color=#79C9A9
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
    //% block="Niveau de confiance de l'objet %thingsID appris"
    //% group="Apprendre" weight=10 subcategory="Caméra IA" 
    //% color=#79C9A9
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
