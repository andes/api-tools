import { EventCore } from './index';

test('should emit true', () => {

    EventCore.on('evento', (state: any) => {
        expect(state).toBe(true);
    });

    EventCore.emitAsync('evento', true);

});
