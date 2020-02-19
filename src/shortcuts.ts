/**
 * ======= PURPOSE =========
 * This file contains shortcuts to have a more readable GraphQL typing
 */
import { GraphQLNullableType, GraphQLNonNull, GraphQLType, GraphQLList, GraphQLInputObjectTypeConfig, GraphQLInputObjectType, GraphQLObjectTypeConfig, GraphQLObjectType, GraphQLUnionTypeConfig, GraphQLUnionType, Thunk, GraphQLEnumTypeConfig, GraphQLEnumType, GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLInterfaceTypeConfig, GraphQLInterfaceType, GraphQLScalarType } from 'graphql';
import { InversifyObjectConfig, InversifyObjectTypeBuilder, InversifyUnionConfig, InversifyUnionTypeBuilder, InversifyFieldConfigMap, InversifyPartialMap, InversifyInterfaceConfig, InversifyBuilder, InversifyList } from '.';
import { interfaces, injectable } from 'inversify';
import { named } from './utils';
import { InversifyInterfaceTypeBuilder } from './interface-builder';
import { InversifyObjectTypeBuilderBase } from './object-builder';
import { InversifyNonNull } from './inversify-nonnull';

type Ctor<T> = interfaces.Newable<T>;
type InvBuilder = Ctor<InversifyBuilder>;

function isPlainGql(t: any): t is GraphQLType {
    let i = 0;
    while (t && t !== Object && t !== Function && t !== Number && t !== Date) {
        i++;
        if (i > 100) {
            throw new Error('Unexpected prototype chain error');
        }
        if (t === InversifyObjectTypeBuilderBase) {
            return false;
        }
        if (t === InversifyUnionTypeBuilder) {
            return false;
        }
        t = Object.getPrototypeOf(t);
    }
    return true;
}

export function NN(t: InvBuilder): InvBuilder;
export function NN<T extends GraphQLType>(t: T): GraphQLNonNull<T>;
export function NN<T extends GraphQLNullableType>(t: T | InvBuilder) {
    return isPlainGql(t)
        ? new GraphQLNonNull(t)
        : InversifyNonNull(t);
}


/** GraphQL list */
export function GList(t: InvBuilder): InvBuilder;
export function GList<T extends GraphQLType>(t: T): GraphQLList<T>;
export function GList(t: GraphQLType | Ctor<InversifyBuilder>) {
    const ttt = InversifyObjectTypeBuilder;
    const tt = InversifyObjectTypeBuilderBase;
    return isPlainGql(t)
        ? new GraphQLList(t)
        : InversifyList(t);
}

/** GraphQL input type */
export function GInput(cfg: GraphQLInputObjectTypeConfig) {
    return new GraphQLInputObjectType(cfg);
}

/** GraphQL object */
export function GObject<T = any, TContext = any>(cfg: GraphQLObjectTypeConfig<T, TContext>) {
    return new GraphQLObjectType<T, TContext>(cfg);
}


/** Inversify object shortcut */
export function GObjectInv<T = any, TContext = any>(cfg: InversifyObjectConfig<T, TContext>): interfaces.Newable<InversifyObjectTypeBuilder<T, TContext>> {
    @injectable()
    class QuickInversified extends InversifyObjectTypeBuilder<T, TContext> {

        config(): InversifyObjectConfig<T, TContext> {
            return cfg;
        }
    }
    return named(QuickInversified, cfg.name);
}

export function GInterface<T = any, TContext = any>(cfg: GraphQLInterfaceTypeConfig<T, TContext>) {
    return new GraphQLInterfaceType(cfg);
}

/** Inversify interface */
export function GInterfaceInv<T = any, TContext = any>(cfg: InversifyInterfaceConfig<T, TContext>): interfaces.Newable<InversifyInterfaceTypeBuilder<T, TContext>> {
    @injectable()
    class QuickInversified extends InversifyInterfaceTypeBuilder<T, TContext> {
        config(): InversifyInterfaceConfig<T, TContext> {
            return cfg;
        }
    }
    return named(QuickInversified, cfg.name);
}

function trimResolvers(f) {
    if (typeof f === 'function')
        return () => trimResolvers(f());
    const ret = Object.entries(f)
        .map(([k, v]) => {
            const nv = <any> {...(v as any)};
            delete nv.resolve;
            return [k, nv] as [any, any];
        })
    return Object.fromEntries(ret);
}

/**
 * Create both an input & output types, with the same shape.
 *
 * Usage:
 *
 * const [MyOutput, MyInput] = GObjectIO({ ...config... })
 *
 */
export function GObjectIO<T = any, TContext = any>(cfg: GraphQLObjectTypeConfig<T, TContext> & GraphQLInputObjectTypeConfig)
: [GraphQLObjectType<T, TContext>, GraphQLInputObjectType] {
    return [GObject<T, TContext>(cfg), GInput({
        ...cfg,
        name: cfg.name + 'Input',
        fields: trimResolvers(cfg.fields),
    })];
}

/** GraphQL union */
export function GUnion<T = any, TContext = any>(cfg: GraphQLUnionTypeConfig<T, TContext>) {
    return new GraphQLUnionType(cfg);
}

/** Inversify union */
export function GUnionInv<T = any, TContext = any>(cfg: InversifyUnionConfig<T, TContext>): interfaces.Newable<InversifyUnionTypeBuilder<T, TContext>> {
    @injectable()
    class QuickUnionInversified extends InversifyUnionTypeBuilder<T, TContext> {

        config(): InversifyUnionConfig<T, TContext> {
            return cfg;
        }
    }
    return named(QuickUnionInversified, cfg.name);
}

/** Inversify partial map shortcut */
export function GPartialMap<T = any, TContext = any>(cfg: Thunk<InversifyFieldConfigMap<T, TContext>>): interfaces.Newable<InversifyPartialMap<T, TContext>> {
    @injectable()
    class PartialMapCtor extends InversifyPartialMap<T, TContext> {
        map(): Thunk<InversifyFieldConfigMap<T, TContext>> {
            return cfg;
        }
    }
    return PartialMapCtor;
}

/** GraphQL enum */
export function GEnum(cfg: GraphQLEnumTypeConfig) {
    return new GraphQLEnumType(cfg);
}


/** GraphQL string */
export const GString = GraphQLString;
/** GraphQL int */
export const GInt = GraphQLInt;
/** GraphQL float */
export const GFloat = GraphQLFloat;
/** GraphQL bool */
export const GBool = GraphQLBoolean;
// /** GraphQL json */
// export const GJson = GraphQLJSON;
// /** GraphQL date */
// export const GDate = GraphQLDateTime;