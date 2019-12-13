
import { partialString, matchDate } from './in-mongo';

describe('Query Builder', () => {

    it('partialString: debe retornar un string', () => {
        const str = partialString('Carlos');
        expect(str).toBe('Carlos');
    });

    it('partialString: debe retornar un regex cuando el string comienza con ^', () => {
        const expresion = partialString('^GONZ');
        expect(expresion).toHaveProperty('$regex', /[GgĜ-ģǦǧǴǵᴳᵍḠḡℊ⒢Ⓖⓖ㋌㋍㎇㎍-㎏㎓㎬㏆㏉㏒㏿Ｇｇ][OoºÒ-Öò-öŌ-őƠơǑǒǪǫȌ-ȏȮȯᴼᵒỌ-ỏₒ℅№ℴ⒪Ⓞⓞ㍵㏇㏒㏖Ｏｏ][NnÑñŃ-ŉǊ-ǌǸǹᴺṄ-ṋⁿℕ№⒩Ⓝⓝ㎁㎋㎚㎱㎵㎻㏌㏑Ｎｎ][ZzŹ-žǱ-ǳᶻẐ-ẕℤℨ⒵Ⓩⓩ㎐-㎔Ｚｚ]/g);
    });

    it('partialString: debe retornar null cuando el string es vacío', () => {
        const str = partialString('');
        expect(str).toBe('');
    });

    it('matchDate: debe retornar una expresion de comparacion de fechas', () => {
        const str = matchDate('2019-01-01|2019-01-30');
        expect(str).toMatchObject({
            $gte: expect.any(Date),
            $lte: expect.any(Date),
        });
    });

    it('matchDate: menor igual  ', () => {
        const str = matchDate('<=2019-01-01');
        expect(str).toMatchObject({
            $lte: expect.any(Date),
        });
    });

    it('matchDate: menor', () => {
        const str = matchDate('<2019-01-01');
        expect(str).toMatchObject({
            $lt: expect.any(Date),
        });
    });

    it('matchDate: mayor igual', () => {
        const str = matchDate('>=2019-01-01');
        expect(str).toMatchObject({
            $gte: expect.any(Date),
        });
    });

    it('matchDate: mayor', () => {
        const str = matchDate('>2019-01-01');
        expect(str).toMatchObject({
            $gt: expect.any(Date),
        });
    });
});
