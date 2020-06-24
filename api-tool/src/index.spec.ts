import { apiOptions } from './index';

test('should emit true', () => {
    const { limit, skip, fields, sort } = apiOptions({ query: { limit: '10', skip: 50 } } as any);

    expect(limit).toBe(10);
    expect(skip).toBe(50);
    expect(fields).toBe(undefined);
    expect(sort).toBe(undefined);
});

test('test without query', () => {
    const { limit, skip, fields, sort } = apiOptions({ query: { skip: 50 } } as any);

    expect(limit).toBe(null);
    expect(skip).toBe(50);
    expect(fields).toBe(undefined);
    expect(sort).toBe(undefined);
});

test('test sort', () => {
    const { limit, skip, fields, sort } = apiOptions({ query: { skip: 50, sort: 'nombre' } } as any);
    expect(limit).toBe(null);
    expect(skip).toBe(50);
    expect(fields).toBe(undefined);
    expect(sort).toBe('nombre');
});

test('test fields', () => {
    const { limit, skip, fields, sort } = apiOptions({ query: { skip: 50, sort: 'nombre' } } as any);
    expect(limit).toBe(null);
    expect(skip).toBe(50);
    expect(fields).toBe(undefined);
    expect(sort).toBe('nombre');
});
