import 'reflect-metadata';
import express from 'express';
import * as agql from 'apollo-server-express';
import {Container} from 'inversify';
import {inversifySchema} from '../../src';
import { SchemaBuilder, MyContext, MyDependency } from './schema';

const app = express()
const port = 3000

// bind some fake dependencies
const container = new Container();
container.bind(MyDependency).toConstantValue(new MyDependency(['Hello', 'World']));

// create the graphql server
const diagSrv = new agql.ApolloServer({
    context: new MyContext('context data passed to graphql'),
    schema: inversifySchema(container, SchemaBuilder),
});

diagSrv.applyMiddleware({
    app,
    path: '/',
    cors: true,
});

app.listen(port, () => console.log(`Example app listening on  http://localhost:${port} !

Try the request:


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
  }`))
