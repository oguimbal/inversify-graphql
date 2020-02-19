import { InversifySchemaBuilder, InversifyList, InversifySchemaConfig, InversifyObjectTypeBuilder, InversifyObjectConfig } from '../../src';
import { inject, injectable } from 'inversify';
import { GraphQLInt, GraphQLString } from 'graphql';
import { GString, GList } from '../../src/shortcuts';

/** Fake context class */
export class MyContext {
    constructor(public contextData: string) {

    }
}

@injectable()
export class MyDependency {
    constructor(public dependencyData: string[]) {
    }

    getFirst() {
        return this.dependencyData[0];
    }

    getAll() {
        return this.dependencyData;
    }
}

export class SchemaBuilder extends InversifySchemaBuilder {


    schema(): InversifySchemaConfig {
        return {
            query: MyRootQuery,
            // you could use other graphql schema config fields:
            // mutation, subscription, ...
        }
    }

}

/**
 * Root query definition
 */
export class MyRootQuery extends InversifyObjectTypeBuilder<void, MyContext> {

    // Injected dependency, usable in our resolve() function
    @inject(MyDependency) dependency: MyDependency;

    config(): InversifyObjectConfig<void, MyContext> {
        return {
            name: 'MyRoot',
            // nb: "fields" supports 'partial roots', enabling you to describe one object in multiple separate builders
            //  fields: [PartialRoot1, PartialRoot2],
            fields: {
              // compatible with classic GraphQL objects/types
              classicField: {
                  type: GraphQLString,
                  resolve: (_, args, ctx) => ctx.contextData,
              },
              // use your "type builders" to refernece inversified field types
              inversifiedField: {
                type: MyType,
                resolve: () => this.dependency.getFirst()
              },
              // use InversifiedList to build a GraphQLList of an inversified type.
              inversifiedListField: {
                type: GList(MyType),
                resolve: () => this.dependency.getAll()
              }
            }
        }
    }
}

/**
 * A type definition that has 'string' as context
 */
export class MyType extends InversifyObjectTypeBuilder<string, MyContext> {

    // Injected dependency, usable in our resolve() function
    @inject(MyDependency) dependency: MyDependency;

    config(): InversifyObjectConfig<string, MyContext> {
      return {
          name: 'MyType',
          fields: {
            len: { type: GraphQLInt, resolve: x => x.length },
            repeated: { type: GraphQLString, resolve: x => x.repeat(3) },
          }
      }
    }
}