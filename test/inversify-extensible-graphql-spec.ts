import 'reflect-metadata';
import 'mocha';
import { expect } from 'chai';
import * as inv from 'inversify';
import * as gql from 'graphql';
import { inversifySchema, extensibleSchema, InversifyPartialMap, IInversifyExtensibleSchema, IInversifyExtensibleNode } from '../src';
import { SchemaBuilder, schemaDefinition, Dependency, PartialRoot1, PartialRoot2, RootQuery, Type2, Type1 } from './types';
import { InversifyObjectTypeBuilderBase } from '../src/object-builder';


describe('graphql-inversify-extensible', () => {

    let container: inv.Container;
    let builder: IInversifyExtensibleSchema;
    beforeEach(() => {
        container = new inv.Container();
        container.bind(Dependency).toSelf().inSingletonScope();
        builder = extensibleSchema('XX', container);
    })


    it('builds schema from object', () => {
        builder.query.merge(PartialRoot1, PartialRoot2);
        const schema = builder.build();
        const rootQuery = schema.getQueryType();
        const fields = rootQuery.getFields();
        const keys = Object.keys(fields);
        expect(keys.length).to.equal(4, 'Expecting 3 fields on root');
    })

    it('concatenates schemas', () => {
        builder.query.merge(PartialRoot1);
        const builder2 = extensibleSchema('YY', container);
        builder.concat(builder2);
        builder2.query.merge(PartialRoot2);

        const schema = builder.build();
        const schema2 = builder2.build();

        const rootQuery = schema.getQueryType();
        const fields = rootQuery.getFields();
        const keys = Object.keys(fields);
        expect(keys.length).to.equal(4, 'Expecting 3 fields on root');


        const rootQuery2 = schema2.getQueryType();
        const fields2 = rootQuery2.getFields();
        const keys2 = Object.keys(fields2);
        expect(keys2.length).to.equal(2, 'Expecting 3 fields on root');


        const type2_1 = <gql.GraphQLObjectType>fields.partial2type2.type;
        const type2_2 = <gql.GraphQLObjectType>fields2.partial2type2.type;
        expect(type2_1 === type2_2).to.equal(false, 'Should have rebuilt this type');
    })

    it('builds schema from builder', () => {
        builder.query.merge(PartialRoot1, PartialRoot2);
        const schema = builder.build();

        const rootQuery = schema.getQueryType();

        // check root type
        let fields = rootQuery.getFields();
        const keys = Object.keys(fields);
        expect(keys.length).to.equal(4, 'Expecting 3 fields on root');
        expect(keys).to.deep.equal(['partial1type1', 'deep', 'partial2type2', 'partial2String'])
        expect(fields.partial1type1.type).to.be.instanceof(gql.GraphQLObjectType);
        expect(fields.partial2type2.type).to.be.instanceof(gql.GraphQLObjectType);
        expect(fields.partial2String.type).to.equal(gql.GraphQLString);

        const type1 = <gql.GraphQLObjectType>fields.partial1type1.type;
        const type2 = <gql.GraphQLObjectType>fields.partial2type2.type;

        // check Type1
        fields = type1.getFields();
        expect(Object.keys(fields)).to.deep.equal(['type2list']);
        expect(fields.type2list.type).to.be.instanceof(gql.GraphQLList);
        const lst = <gql.GraphQLList<any>>fields.type2list.type;
        expect(lst.ofType).to.equal(type2, 'Expecting to have a list of Type2');

        // check Type2
        fields = type2.getFields();
        expect(Object.keys(fields)).to.deep.equal(['self', 'type1']);
        expect(fields.self.type).to.equal(type2);
        expect(fields.type1.type).to.equal(type1);
    });



    class PartialExtension extends InversifyPartialMap<any, any> {
        map() {
            return {
                extension: { type: gql.GraphQLString }
            }
        }
    }

    function testExtend(typeToExtend: string | inv.interfaces.Newable<InversifyObjectTypeBuilderBase<any, any, any>>) {

        builder.query.merge(PartialRoot1, PartialRoot2);
        builder.get(typeToExtend).merge(PartialExtension);
        const schema = builder.build();
        const rootQuery = schema.getQueryType();

        // check root type
        let fields = rootQuery.getFields();
        const keys = Object.keys(fields);
        expect(keys.length).to.equal(4, 'Expecting 3 fields on root');
        expect(keys).to.deep.equal(['partial1type1', 'deep', 'partial2type2', 'partial2String'])
        expect(fields.partial1type1.type).to.be.instanceof(gql.GraphQLObjectType);
        expect(fields.partial2String.type).to.equal(gql.GraphQLString);

        // check that Type1 has been extended
        const type1 = <gql.GraphQLObjectType>fields.partial1type1.type;
        fields = type1.getFields();
        expect(Object.keys(fields)).to.deep.equal(['type2list', 'extension']);
    }

    it('lets you extend a type by name', () => {
        testExtend('Type1');
    });




    it('lets you extend a type by ctor', () => {
        testExtend(Type1);
    });
});