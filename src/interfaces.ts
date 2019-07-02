import * as inv from 'inversify';
import * as gql from 'graphql';
import Maybe from 'graphql/tsutils/Maybe';
import { InversifyObjectTypeBuilder } from './object-builder';
import { InversifyPartialMap } from './partial-map';
import { InversifyUnionTypeBuilder } from './union-builder';
import { PromiseOrValue } from 'graphql/jsutils/PromiseOrValue';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export interface InversifySchemaConfig
    extends Omit<gql.GraphQLSchemaConfig, 'query' | 'mutation' | 'subscription'> {
    query?: gql.GraphQLObjectType | Maybe<inv.interfaces.Newable<InversifyObjectTypeBuilder<any, any>>>;
    mutation?: gql.GraphQLObjectType | Maybe<inv.interfaces.Newable<InversifyObjectTypeBuilder<any, any>>>;
    subscription?: gql.GraphQLObjectType | Maybe<inv.interfaces.Newable<InversifyObjectTypeBuilder<any, any>>>;
}
/**
 * Inversify equivalent of GraphQLFieldConfigMap
 */
export interface InversifyFieldConfigMap<TSource, TContext> {
    [key: string]: InversifyFieldConfig<TSource, TContext>;
}

export type InversifyInlineType<TContext> = InversifyObjectConfig<any, TContext>;

export type InversifyBuilder<TSource, TContext> = InversifyObjectTypeBuilder<any, TContext>
    | InversifyUnionTypeBuilder<any, TContext>;

/** Types allowed as inversified types */
export type InversifyType<TSource, TContext> =  | gql.GraphQLOutputType
    | InversifyInlineType<TContext>
    | inv.interfaces.Newable<InversifyBuilder<TSource, TContext>>
    ;

export interface InversifyFieldConfig<TSource, TContext, TArgs = { [argName: string]: any }>
    extends Omit<gql.GraphQLFieldConfig<TSource, TContext, TArgs>, 'type'> {
    type: InversifyType<TSource, TContext>;
}

export type InversifyFieldList<TSource, TContext> = gql.Thunk<InversifyFieldConfigMap<TSource, TContext>> | inv.interfaces.Newable<InversifyPartialMap<TSource, TContext>>[];
export type InversifyUnionTypeList<TSource, TContext> = gql.Thunk<InversifyType<TSource, TContext>[]>;

export interface InversifyObjectConfig<TSource, TContext>
    extends Omit<gql.GraphQLObjectTypeConfig<TSource, TContext>, 'fields'> {
    /**
     * Fields can be either a map, or an array of partial map builder
     */
    fields: InversifyFieldList<TSource, TContext>;
}

export interface InversifyUnionConfig<TSource, TContext>
    extends Omit<gql.GraphQLUnionTypeConfig<TSource, TContext>, 'types' | 'resolveType'> {

    types: InversifyUnionTypeList<TSource, TContext>;
    resolveType?: Maybe<InversifyTypeResolver<TSource, TContext>>;
}

export type InversifyTypeResolver<TSource, TContext, TArgs = { [key: string]: any }> = (
    value: TSource,
    context: TContext,
    info: gql.GraphQLResolveInfo
) => PromiseOrValue<Maybe<InversifyType<TSource, TContext>>>;


export interface IInversifyExtensibleSchema<TContext = any> {

    /** The child container of this schema */
    readonly container: inv.Container;
    /** Enxtensible root query */
    readonly query: IInversifyExtensibleNode<void, TContext>;
    /** Enxtensible root mutation */
    readonly mutation: IInversifyExtensibleNode<void, TContext>;
    /** Enxtensible root subscription */
    readonly subscription: IInversifyExtensibleNode<void, TContext>;
    /** Get a type to extend by name */
    get<TSource = any>(typeToExtend: string): IInversifyExtensibleNode<TSource, TContext>;
    /** Concatenate extensions */
    concat(...otherSchema: this[]): this;

    /** Build the generated schema */
    build(): gql.GraphQLSchema;
}

export interface IInversifyExtensibleNode<TSource = any, TContext = any> {
    /** Merge the given field list definitions in the current node */
    merge(...fields: inv.interfaces.Newable<InversifyPartialMap<TSource, TContext>>[]): this
}