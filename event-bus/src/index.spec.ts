import { EventCore } from './index';

test('should emit true', () => {

    EventCore.on('evento', (state: any) => {
        expect(state).toBe(true);
    });

    EventCore.emitAsync('evento', true);

});

test('should emit two params', () => {

    EventCore.on('evento-2', (first: any, second: any) => {
        expect(first).toBe(true);
        expect(second).toBe(false);
    });

    EventCore.emitAsync('evento-2', true, false);

});
