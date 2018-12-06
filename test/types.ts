import * as inv from 'inversify';
import * as gql from 'graphql';
import * as igql from '../src';

@inv.injectable()
export class Dependency {

}


export class SchemaBuilder extends igql.InversifySchemaBuilder {
    @inv.inject(Dependency) dep: Dependency;

    schema(): igql.InversifySchemaConfig {
        return schemaDefinition;
    }
}


export class RootQuery extends igql.InversifyObjectTypeBuilder<any, any> {
    
    @inv.inject(Dependency) dep: Dependency;

    config(): igql.InversifyObjectConfig<any, any> {
        return {
            name: 'Root',
            fields: [PartialRoot1, PartialRoot2],
        }
    }

}

export class PartialRoot1 extends igql.InversifyPartialMap<any, any> {
    @inv.inject(Dependency) dep: Dependency;

    map(): gql.Thunk<igql.InversifyFieldConfigMap<any, any>> {
        return {
            partial1type1: { type: Type1 }
        }
    }

}
export class PartialRoot2 extends igql.InversifyPartialMap<any, any> {
    @inv.inject(Dependency) dep: Dependency;

    map(): gql.Thunk<igql.InversifyFieldConfigMap<any, any>> {
        return () => ({
            partial2type2: { type: Type2 },
            partial2String: { type: gql.GraphQLString }
        })
    }

}


export class Type1 extends igql.InversifyObjectTypeBuilder<any, any> {
    @inv.inject(Dependency) dep: Dependency;

    config(): igql.InversifyObjectConfig<any, any> {
        return {
            name: 'Type1',
            fields: {
                type2list: { type: igql.InversifyList(Type2) },
            },
        }
    }
}


export class Type2 extends igql.InversifyObjectTypeBuilder<any, any> {
    @inv.inject(Dependency) dep: Dependency;

    config(): igql.InversifyObjectConfig<any, any> {
        return {
            name: 'Type2',
            fields: () => ({
                self: { type: Type2 },
                type1: { type: Type1 },
            }),
        }
    }
}


export const schemaDefinition: igql.InversifySchemaConfig = {
    query: RootQuery,
};