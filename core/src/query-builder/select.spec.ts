
import { isSelected } from './select';


describe('Query Builder - select', () => {

    describe('isSelected', () => {

        it('should return true if field is included', () => {
            const bool = isSelected('nombre apellido', 'nombre');
            expect(bool).toBe(true);
        });

        it('should return false if field is not preset', () => {
            const bool = isSelected('nombre apellido', 'ciudad');
            expect(bool).toBe(false);
        });

        it('should return true if field is included', () => {
            const bool = isSelected('-nombre -apellido', 'ciudad');
            expect(bool).toBe(true);
        });

        it('should return true if field is excluded', () => {
            const bool = isSelected('-nombre -apellido', 'nombre');
            expect(bool).toBe(false);
        });

        it('should return true on select null', () => {
            const bool = isSelected('', 'nombre');
            expect(bool).toBe(true);

            const bool2 = isSelected(null, 'nombre');
            expect(bool2).toBe(true);
        });

    });

});
