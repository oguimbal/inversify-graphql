# inversify-graphql

![build status](https://travis-ci.org/oguimbal/inversify-graphql.svg?branch=master)
[![npm version](https://badge.fury.io/js/inversify-graphql.svg)](https://badge.fury.io/js/inversify-graphql)
[![Dependencies](https://david-dm.org/inversify/InversifyJS.svg)](https://david-dm.org/oguimbal/inversify-graphql#info=dependencies)
[![img](https://david-dm.org/inversify/InversifyJS/dev-status.svg)](https://david-dm.org/oguimbal/inversify-graphql/#info=devDependencies)
[![img](https://david-dm.org/inversify/InversifyJS/peer-status.svg)](https://david-dm.org/oguimbal/inversify-graphql/#info=peerDependenciess)
[![Known Vulnerabilities](https://snyk.io/test/github/oguimbal/inversify-graphql/badge.svg)](https://snyk.io/test/github/oguimbal/inversify-graphql)

Build dependency-inverted GraphQL schemas with [InversifyJS](https://github.com/inversify/InversifyJS)

# Quickstart

See:
- the [sample app](sample/minimal/README.md) for a minimal sample
- the [complex types app](sample/complex-types/README.md) to dive inito more complex inversified types


# Usage

Install the package
```
npm i inversify reflect-metadata graphql inversify-graphql --save
```

Example using [express](https://www.npmjs.com/package/express) and [apollo-server](https://www.npmjs.com/package/apollo-server)

```typescript
import { inversifySchema } from 'inversify-graphql';
/* ... initialize express & inversify container */
const srv = new agql.ApolloServer({
    // build inversified schema
    context: /* whateverContext */,
    schema: inversifySchema(myContainer, {
      query: MyRootQuery,
  }),
});
srv.applyMiddleware({ app, path: '/graphql'});


```

```typescript
// === MyRootQuery definition ==
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
                  resolve: () => 'classic'
              },
              // use your "type builders" to refernece inversified field types
              inversifiedField: {
                type: MyType,
                resolve: () => this.dependency.getWhateverEntity()
              },
              // use InversifiedList to build a GraphQLList of an inversified type.
              inversifiedListField: {
                type: InversifyList(MyType),
                resolve: () => this.dependency.getWhateverList()
              }
            }
        }
    }
}

```
```typescript
// === MyType definition ==
export class MyType extends InversifyObjectTypeBuilder<MyEntity, MyContext> {

    // Injected dependency, usable in our resolve() function
    @inject(MyDependency) dependency: MyDependency;

    config(): InversifyObjectConfig<MyEntity, MyContext> {
      return {
        //  ... sub fields, using source, context AND inversified dependencies (injectable in this class)
      }
    }
}
```

# Simple inline type definition

You can define sub-types "inline" (cleaner syntax)

```typescript
export class MyType extends InversifyObjectTypeBuilder<MyEntity, MyContext> {

    // Injected dependency, usable in our resolve() function
    @inject(MyDependency) dependency: MyDependency;

    config(): InversifyObjectConfig<MyEntity, MyContext> {
      return {
        myField: {
          // resolver
          resolve: () => 42,
          // inline type definition
          type: {
            name: 'MyInlineType',
            fields: {
              subField: {
                type: GraphQLString,
                resolve: x => x + 'is the answer', // will output "42 is the answer"
              }
            }
          }
        }
      }
    }
}
```


# Handy shortcuts

If like me, you're annoyed with those very long names like `new GraphQLList(new GraphQLNonNull(GraphQLString)))`, you can use the `inversify-graphql/shortcuts` helpers to turn them into  `GList(NN(GString))`.

**nb:** shortcuts are compatible with inversified types ;)

# Modular schema definiton

Some type definitions can tend to be bloated as your app grows.
In these cases, you might want to split the definition of types in several files or parts of your application.

This is the purpose of "extensible schema", which builds on top of inversify-graphql to enable you to define a more modular schema.

```typescript

const adminSchema = extensibleSchema('RootName', container);

// those two partial roots will be merged in the schema root
adminSchema.query.merge(PartialRoot1);
adminSchema.query.merge(PartialRoot2);
adminSchema.mutation.merge(PartialMutationRoot2);

// extend a type
// the type 'MyTypeToExtend' will augmented with all the fields defined in MyPartialMap
// nb: this will work even if 'MyTypeToExtend' has not been defined yet
adminSchema.get('MyTypeToExtend').merge(MyPartialMap);

// you can concatenate two schemas:
// this will augment the root of "adminSchema" with everything defined in "userSchma"
adminSchema.concat(userSchma);
```
