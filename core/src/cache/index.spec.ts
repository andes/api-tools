// import { AndesCache } from './index';

describe('CACHE', () => {
    it('simple', () => {
        expect(true).toBe(true);
    });
    // describe('CACHE IN MEMORY', () => {
    //     let cache: any;
    //     beforeAll(async () => {
    //         cache = new AndesCache();
    //     });

    //     afterAll(() => {
    //         cache = null;
    //     });

    //     it('should simple save string', async (done) => {
    //         await cache.set('key', 'hola');
    //         const value: any = await cache.get('key');
    //         expect(value).toBe('hola');
    //     });

    //     it('should simple save array', async () => {
    //         await cache.set('key3', [1, 2, 3]);
    //         const value: any = await cache.get('key3');
    //         expect(Array.isArray(value)).toBe(true);
    //     });

    //     it('timeout expect null', async (done) => {
    //         await cache.set('key2', [1, 2, 3], 1);
    //         setTimeout(async () => {
    //             const value: any = await cache.get('key2');
    //             expect(value).toBeNull();
    //             done();
    //         }, 2000);
    //     });

    // });

    // describe('CACHE IN REDIS', () => {
    //     let cache: AndesCache;
    //     beforeAll(async () => {
    //         cache = new AndesCache({ adapter: 'redis' });
    //     });

    //     afterAll(() => {
    //         cache = null;
    //     });

    //     it('should simple save string', async (done) => {
    //         await cache.set('key', 'hola');
    //         const value: any = await cache.get('key');
    //         expect(value).toBe('hola');
    //         setTimeout(done, 1);
    //     });

    //     it('should simple save array', async () => {
    //         await cache.set('key3', [1, 2, 3]);
    //         const value: any = await cache.get('key3');
    //         expect(Array.isArray(value)).toBe(true);
    //     });

    //     it('timeout expect null', async (done) => {
    //         await cache.set('key2', [1, 2, 3], 1);
    //         setTimeout(async () => {
    //             const value: any = await cache.get('key2');
    //             expect(value).toBeNull();
    //             done();
    //         }, 2000);
    //     });

    // });
});
