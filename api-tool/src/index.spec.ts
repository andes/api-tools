import { apiOptions } from './index';

test('should emit true', () => {
    const { limit, skip, fields } = apiOptions({ query: { limit: '10', skip: 50 } } as any);

    expect(limit).toBe(10);
    expect(skip).toBe(50);
    expect(fields).toBe(undefined);
});

test('test without query', () => {
    const { limit, skip, fields } = apiOptions({ query: { skip: 50 } } as any);

    expect(limit).toBe(null);
    expect(skip).toBe(50);
    expect(fields).toBe(undefined);
});
