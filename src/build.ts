import * as inv from 'inversify';
import * as gql from 'graphql';
import { InversifySchemaBuilder } from './schema-builder';
import { InversifySchemaConfig } from './interfaces';
import { TypeCache } from './type-cache';
import { ITypeCache } from './interfaces-private';

export function inversifySchema(container: inv.Container, config: inv.interfaces.Newable<InversifySchemaBuilder> | InversifySchemaConfig): gql.GraphQLSchema {

    // create child container
    const thisContainer = new inv.Container();
    thisContainer.parent = container;
    const types = new TypeCache(thisContainer);
    thisContainer.bind(ITypeCache).toConstantValue(types);

    let builtConfig: InversifySchemaConfig;
     if (typeof config === 'function') {
         builtConfig = types.get(config).schema();
     } else
        builtConfig = config;

    // resolve builders
    if (typeof builtConfig.query === 'function') {
        const builder = thisContainer.resolve(builtConfig.query);
        builtConfig.query = <gql.GraphQLObjectType> builder.build();
    }
    if (typeof builtConfig.mutation === 'function') {
        const builder = thisContainer.resolve(builtConfig.mutation);
        builtConfig.mutation = <gql.GraphQLObjectType> builder.build();
    }

    if (typeof builtConfig.subscription === 'function') {
        const builder = thisContainer.resolve(builtConfig.subscription);
        builtConfig.subscription = <gql.GraphQLObjectType> builder.build();
    }

    // build schema
    return new gql.GraphQLSchema({
        // typescript only detects correct types doing this:
        ...builtConfig,
        mutation: builtConfig.mutation,
        query: builtConfig.query,
        subscription: builtConfig.subscription,
    });
}