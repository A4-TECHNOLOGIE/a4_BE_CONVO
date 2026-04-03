enum ButtonChoice {
    C,
    D
}

//% weight=100 color=#EB8AEB icon="\u26a1"
//% groups="['Boutons Poussoirs', 'Potentiomètre', 'Moteur', 'Servomoteur', 'Ecran OLED', 'Anneau lumineux']"
namespace convoyeur {

    //%block="Lorsque bouton %button est appuyé"
    //%group='Boutons Poussoirs'
    export function onButtonPressed(button: ButtonChoice, handler: () => void){
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
    export function potentiometerValue(){
        return pins.analogReadPin(AnalogPin.P2)
    }

    //%group='Moteur' color=#86D17B
    //%block="Activer le moteur à la vitesse %speed"
    //%speed.min=0 speed.max=100 speed.defl=50 
    export function setMotorSpeed(speed: number){
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
}