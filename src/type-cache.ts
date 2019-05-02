import * as inv from 'inversify';
import { InversifyPartialMap } from './partial-map';

/**
 * Holds singletons of all builders
 */
export class TypeCache {
    constructor(private container: inv.Container) {
    }

    get<T>(ctor: inv.interfaces.Newable<T>): T {
        if (!this.container.isBound(ctor))
            this.container.bind(ctor).toSelf().inSingletonScope();
        return this.container.get(ctor);
    }
}

