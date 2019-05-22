import 'reflect-metadata';
import 'mocha';
import { expect } from 'chai';
import * as inv from 'inversify';
import * as gql from 'graphql';
import {inversifySchema} from '../src';
import { SchemaBuilder, schemaDefinition, Dependency } from './types';


describe('graphql-inversify', () => {

    let container: inv.Container;
    beforeEach(() => {
        container = new  inv.Container();
        container.bind(Dependency).toSelf().inSingletonScope();
    })


    it('builds schema from object', () => {
        const schema = inversifySchema(container, schemaDefinition);
        const rootQuery = schema.getQueryType();
        const fields = rootQuery.getFields();
        const keys = Object.keys(fields);
        expect(keys.length).to.equal(4, 'Expecting 3 fields on root');
    })

    it('builds schema from builder', () => {
        const schema = inversifySchema(container, SchemaBuilder);
        const rootQuery = schema.getQueryType();

        // check root type
        let fields = rootQuery.getFields();
        const keys = Object.keys(fields);
        expect(keys.length).to.equal(4, 'Expecting 3 fields on root');
        expect(keys).to.deep.equal(['partial1type1', 'deep', 'partial2type2', 'partial2String'])
        expect(fields.partial1type1.type).to.be.instanceof(gql.GraphQLObjectType);
        expect(fields.partial2type2.type).to.be.instanceof(gql.GraphQLObjectType);
        expect(fields.partial2String.type).to.equal(gql.GraphQLString);

        const type1 = <gql.GraphQLObjectType> fields.partial1type1.type;
        const type2 = <gql.GraphQLObjectType> fields.partial2type2.type;

        // check Type1
        fields = type1.getFields();
        expect(Object.keys(fields)).to.deep.equal(['type2list']);
        expect(fields.type2list.type).to.be.instanceof(gql.GraphQLList);
        const lst = <gql.GraphQLList<any>> fields.type2list.type;
        expect(lst.ofType).to.equal(type2, 'Expecting to have a list of Type2');
        
        // check Type2
        fields = type2.getFields();
        expect(Object.keys(fields)).to.deep.equal(['self', 'type1']);
        expect(fields.self.type).to.equal(type2);
        expect(fields.type1.type).to.equal(type1);

    })

    

    it('builds deep object', () => {
        const schema = inversifySchema(container, schemaDefinition);
        const rootQuery = schema.getQueryType();
        const fields = rootQuery.getFields();
        const keys = Object.keys(fields);
        
        const t1 = <gql.GraphQLObjectType> fields.deep.type;
        const f1 = t1.getFields();
        expect(Object.keys(f1)).to.deep.equal(['nested']);
        const t2 = <gql.GraphQLObjectType> f1.nested.type;
        const f2 = t2.getFields();
        expect(Object.keys(f2)).to.deep.equal(['subnested']);
        const t3 = <gql.GraphQLObjectType> f2.subnested.type;
        const f3 = t3.getFields();
        expect(Object.keys(f3)).to.deep.equal(['prop']);
    })

});