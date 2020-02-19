import * as inv from 'inversify';
import * as gql from 'graphql';
import { InversifyObjectTypeBuilder } from './object-builder';
import { InversifyObjectConfig } from '.';
import { named } from './utils';
import { InversifyBuilder } from './interfaces';

/**
 * Creates a GraphQLNonNull of an inversify type
 * @param ctor The type builder to make a list of
 */
export function InversifyNonNull<TSource, TContext>(ctor: inv.interfaces.Newable<InversifyBuilder<TSource, TContext>>)
    : inv.interfaces.Newable<InversifyBuilder<TSource, TContext>> {

    class ThisNotNull extends InversifyObjectTypeBuilder<TSource, TContext> {

        private builtNn: gql.GraphQLNonNull<any>;

        config(): InversifyObjectConfig<TSource, TContext> {
            throw new Error('Invalid operation');
        }

        build(): any {
            if (this.builtNn)
                return this.builtNn;
            const type = this.builders.get(ctor).build();
            return this.builtNn = new gql.GraphQLNonNull(type);
        }
    }

    return named(ThisNotNull, `NotNull(${ctor.name})`);
}