This is a quite simplistic sample that demonstrates how to use inversify-graphql

To run it:

```
git clone git@github.com:oguimbal/inversify-graphql.git
cd inversify-graphql
npm i
npm run sample
```

(or just press F5 when in vscode)

You should then be able to navigate GraphiQL via http://localhost:3000/

Try typing the below request:

```graphql
{
  classicField,
  inversifiedField {
    len,
    repeated
  }
  inversifiedListField {
    len,
    repeated
  }
}
```