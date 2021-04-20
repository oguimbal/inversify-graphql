import * as gql from 'graphql';
import { InversifyInterfaceConfig } from './interfaces';
import { InversifyObjectTypeBuilderBase } from './object-builder';


export abstract class InversifyInterfaceTypeBuilder<TSource, TContext>
    extends InversifyObjectTypeBuilderBase<TSource, TContext, InversifyInterfaceConfig<TSource, TContext>> {

    protected built: gql.GraphQLInterfaceType;

    build() {
        if (this.built)
            return this.built;

        // build fields & co
        const cfg = super.doBuildConfig() as gql.GraphQLInterfaceTypeConfig<TSource, TContext>;

        // return real object type
        this.built = new gql.GraphQLInterfaceType({
            ...cfg,
            resolveType: async (value, ctx, info, resolveInfo) => {
                const ret = await cfg.resolveType(value, ctx, info, resolveInfo);
                if (!ret)
                    return null;
                if (typeof ret === 'string') {
                    return ret;
                }
                return  <gql.GraphQLObjectType> this.builders.buildType(ret);
            }
        });
        return this.built;
    }
}
