
import { partialString } from './in-mongo';

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

});
