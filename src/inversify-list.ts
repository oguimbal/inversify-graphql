import * as inv from 'inversify';
import * as gql from 'graphql';
import {GraphQLObjectTypeBuilder} from './object-builder';
import { InversifyObjectConfig } from '.';

/**
 * Creates a GraphQL list of an inversify type
 * @param ctor The type builder to make a list of
 */
export function InversifyList<TSource, TContext>(ctor: inv.interfaces.Newable<GraphQLObjectTypeBuilder<TSource, TContext>>)
    : inv.interfaces.Newable<GraphQLObjectTypeBuilder<TSource, TContext>> {

    class ThisList extends GraphQLObjectTypeBuilder<TSource, TContext> {
        
        config(): InversifyObjectConfig<TSource, TContext> {
            throw new Error('Invalid operation');
        }
        
        build(): gql.GraphQLList<any> {
            const type = this.builders.get(ctor).build();
            return new gql.GraphQLList(type);
        }
    }
    return ThisList;
}