import * as inv from 'inversify';
import * as gql from 'graphql';
import { InversifySchemaBuilder } from './schema-builder';
import { InversifyGraphQLSchemaConfig } from './interfaces';
import { TypeCache } from './type-cache';

export function inversifySchema(container: inv.Container, config: inv.interfaces.Newable<InversifySchemaBuilder> | InversifyGraphQLSchemaConfig): gql.GraphQLSchema {

    // create child container
    const thisContainer = new inv.Container();
    thisContainer.parent = container;
    const types = new TypeCache(thisContainer);
    thisContainer.bind(TypeCache).toConstantValue(types);

    const builtConfig = typeof config === 'function'
        ? types.get(config).schema()
        : config;

    // resolve builders
    if (typeof builtConfig.query === 'function') {
        const builder = thisContainer.resolve(builtConfig.query);
        builtConfig.query = <gql.GraphQLObjectType> builder.build();
    }
    if (typeof builtConfig.mutation === 'function') {
        const builder = thisContainer.resolve(builtConfig.mutation);
        builtConfig.mutation = <gql.GraphQLObjectType> builder.build();
    }

    // build schema
    return new gql.GraphQLSchema({
        // typescript only detects correct types doing this:
        ...builtConfig,
        mutation: builtConfig.mutation,
        query: builtConfig.query,
    });
}