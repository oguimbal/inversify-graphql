import * as inv from 'inversify';
import { InversifyType, InversifyObjectConfig, InversifyBuilder } from './interfaces';
import { GraphQLOutputType } from 'graphql';
import { InversifyObjectTypeBuilder } from './object-builder';
import { ITypeCache } from './interfaces-private';

/**
 * Holds singletons of all builders
 */
export class TypeCache extends ITypeCache {

    constructor(private container: inv.Container) {
        super();
    }


    buildType<TSource, TContext>(builder: InversifyType<TSource, TContext>): GraphQLOutputType {
        if (typeof builder === 'function') {
            return this.get(builder).build();
        } else if ('inspect' in builder) {
            return builder;
        }

        const fieldCfg = builder;
        class InlineType extends InversifyObjectTypeBuilder<any, any> {
            config(): InversifyObjectConfig<any, any> {
                return fieldCfg;
            }
        }
        return this.get(InlineType).build();
    }

    get<T>(ctor: inv.interfaces.Newable<T>): T {
        if (!this.container.isBound(ctor))
            this.container.bind(ctor).toSelf().inSingletonScope();
        return this.container.get(ctor);
    }
}
