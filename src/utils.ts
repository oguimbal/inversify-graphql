import { interfaces } from 'inversify';

export function named<T extends interfaces.Newable<any>>(Ctor: T, name: string): T {
    Object.defineProperty(Ctor.prototype, 'toString', { value: () => name})
    Object.defineProperty(Ctor, 'name', { value: name });
    Object.defineProperty(Ctor, 'toString', { value: () => name + 'ctor' });
    return Ctor;
}