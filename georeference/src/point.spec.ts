import { pointDistance } from './point';


test('distance between 0.8, 0.9', () => {
    const p1 = {
        lat: -38.951643,
        lng: -68.059181
    };
    const p2 = {
        lat: -38.951793,
        lng: -68.069019
    };
    const distance = pointDistance(p1, p2);
    expect(distance > 0.8).toBe(true);
    expect(distance < 0.9).toEqual(true);
});
