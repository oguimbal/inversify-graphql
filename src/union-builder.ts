import * as inv from 'inversify';
import * as gql from 'graphql';
import { ITypeCache } from './interfaces-private';
import { InversifyUnionConfig } from './interfaces';

@inv.injectable()
export abstract class InversifyUnionTypeBuilder<TSource, TContext> {

    protected built: gql.GraphQLUnionType;
    protected building?: boolean;
    protected extensions: 'all' | 'noDirect' | 'none'  = 'all';

    @inv.inject(ITypeCache) protected builders: ITypeCache;

    abstract config() : InversifyUnionConfig<TSource, TContext>;

    build(): gql.GraphQLUnionType {

        if (this.built)
            return this.built;
        if (this.building)
            throw new Error(`The type ${this.constructor.name} is involved in a circlar referenciation loop.
            If this is intended, please use the thunk version of 'fields' - i.e.  "fields: () => ({ /* field definition */ })`)
        this.building = true;

        // resolve types
        // deep copy item (this.config() might return a constant => must not be modified)
        const cfg = {...this.config() };
        if (typeof cfg.types === 'function') {
            const cpy = cfg.types;
            cfg.types = () => [ ...cpy() ];
        } else if (cfg.types instanceof Array) {
            cfg.types = [...cfg.types];
        }

        // map types
        let types: gql.Thunk<gql.GraphQLObjectType[]>;
        if (typeof cfg.types === 'function') {
            const cpy = cfg.types;
            types = () => cpy().map(x => <gql.GraphQLObjectType> this.builders.buildType(x));
        } else {
            types = cfg.types.map(x =>  <gql.GraphQLObjectType> this.builders.buildType(x));
        }

        // return real object type
        this.built = new gql.GraphQLUnionType({
            ...cfg,
            types: types,
            resolveType: async (value, ctx, info) => {
                const ret = await cfg.resolveType(value, ctx, info);
                if (!ret)
                    return null;
                return  <gql.GraphQLObjectType> this.builders.buildType(ret);
            }
        });
        delete this.building;
        return this.built;
    }
}
