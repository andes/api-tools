const Emitter = require('pattern-emitter');

export class EventBus extends Emitter {
    /**
     * Emite un evento de forma asincrónica
     * @param {string} event Nombre del evento a emitir
     * @param {any}  params listado de paramentros relacionados con el evento
     */

    emitAsync(name: String, ...params: any[]): void;

    emitAsync(...args: any[]) {
        process.nextTick(() => {
            this.emit.apply(this, args);
        });
    }

}
