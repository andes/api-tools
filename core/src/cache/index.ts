const RedisCache = require('node-cache-redis');
const MemoryCache = require('memory-cache');

export interface IAndesCacheOptions {
    name?: string;
    adapter?: 'memory' | 'redis';
    host?: string;
    port?: number;
    ttl?: number;
}

export class AndesCache {
    private name: string;
    private adapter: string;
    private host: string;
    private port: number;
    private defaultTTL: number;

    private redisCache: any;
    private memoryCache: any;

    constructor(options: IAndesCacheOptions = {}) {
        options = options || {};
        this.name = options.name || 'andes';
        this.adapter = options.adapter || 'memory';
        this.defaultTTL = options.ttl || 60 * 60 * 24;
        this.host = options.host || '127.0.0.1';
        this.port = options.port || 6379;

        if (this.adapter === 'memory') {
            this.memoryCache = new MemoryCache.Cache();
        } else {
            this.redisCache = new RedisCache({ name: this.name, redisOptions: { host: this.host, port: this.port } });
        }
    }


    private genKey(key: string) {
        return `${this.name}-${key}`;
    }

    set(key: string, value: any, ttl: number = null): Promise<void> {
        ttl = ttl || this.defaultTTL;
        const genKey = this.genKey(key);
        if (this.adapter === 'memory') {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    this.memoryCache.put(genKey, value, ttl * 1000);
                    return resolve();
                });
            });
        } else {
            return this.redisCache.set(genKey, value, ttl);
        }
    }

    get(key: string): Promise<any> {
        const genKey = this.genKey(key);
        if (this.adapter === 'memory') {
            const value = this.memoryCache.get(genKey);
            return Promise.resolve(value);
        } else {
            return this.redisCache.get(genKey);
        }
    }

    clear(key: string): Promise<void> {
        const genKey = this.genKey(key);
        if (this.adapter === 'memory') {
            const result = this.memoryCache.del(genKey);
            return Promise.resolve(result);
        } else {
            return this.redisCache.del(genKey);
        }
    }

}
