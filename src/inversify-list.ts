import * as inv from 'inversify';
import * as gql from 'graphql';
import {InversifyObjectTypeBuilder} from './object-builder';
import { InversifyObjectConfig } from '.';
import { named } from './utils';

/**
 * Creates a GraphQL list of an inversify type
 * @param ctor The type builder to make a list of
 */
export function InversifyList<TSource, TContext>(ctor: inv.interfaces.Newable<InversifyObjectTypeBuilder<TSource, TContext>>)
    : inv.interfaces.Newable<InversifyObjectTypeBuilder<TSource, TContext>> {

    class ThisList extends InversifyObjectTypeBuilder<TSource, TContext> {
        
        config(): InversifyObjectConfig<TSource, TContext> {
            throw new Error('Invalid operation');
        }
        
        build(): gql.GraphQLList<any> {
            const type = this.builders.get(ctor).build();
            return new gql.GraphQLList(type);
        }
    }

    return named(ThisList, `List(${ctor.name})`);
}