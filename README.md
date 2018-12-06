# inversify-graphql

Build dependency-inverted GraphQL schemas with [InversifyJS](https://github.com/inversify/InversifyJS)

# Qucickstart

See the [sample app](sample/README.md) in this repository


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
