import * as inv from 'inversify';
import * as gql from 'graphql';
import Maybe from 'graphql/tsutils/Maybe';
import { GraphQLObjectTypeBuilder } from './object-builder';
import { InversifyPartialMap } from './partial-map';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export interface InversifyGraphQLSchemaConfig
    extends Omit<gql.GraphQLSchemaConfig, 'query' | 'mutation'> {
    query?: gql.GraphQLObjectType | Maybe<inv.interfaces.Newable<GraphQLObjectTypeBuilder<any, any>>>;
    mutation?: gql.GraphQLObjectType | Maybe<inv.interfaces.Newable<GraphQLObjectTypeBuilder<any, any>>>;
}
/**
 * Inversify equivalent of GraphQLFieldConfigMap
 */
export interface InversifyGraphQLFieldConfigMap<TSource, TContext> {
    [key: string]: InversifyGraphQLFieldConfig<TSource, TContext>;
}

export interface InversifyGraphQLFieldConfig<TSource, TContext, TArgs = { [argName: string]: any }>
    extends Omit<gql.GraphQLFieldConfig<TSource, TContext, TArgs>, 'type'> {
    type: gql.GraphQLOutputType | inv.interfaces.Newable<GraphQLObjectTypeBuilder<TSource, TContext>>;
}

export interface InversifyObjectConfig<TSource, TContext>
    extends Omit<gql.GraphQLObjectTypeConfig<TSource, TContext>, 'fields'> {
    /**
     * Fields can be either a map, or an array of partial map builder
     */
    fields: gql.Thunk<InversifyGraphQLFieldConfigMap<TSource, TContext>> | inv.interfaces.Newable<InversifyPartialMap<TSource, TContext>>[]
}