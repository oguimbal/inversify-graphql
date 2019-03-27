import * as inv from 'inversify';
import * as gql from 'graphql';
import {TypeCache} from './type-cache';
import { InversifyObjectConfig, InversifyFieldConfigMap } from './interfaces';

@inv.injectable()
export abstract class InversifyObjectTypeBuilder<TSource, TContext> {

    protected built: gql.GraphQLObjectType;
    protected building?: boolean;

    @inv.inject(TypeCache) protected builders: TypeCache;

    abstract config() : InversifyObjectConfig<TSource, TContext>;

    build(): gql.GraphQLObjectType | gql.GraphQLList<any> {

        if (this.built)
            return this.built;
        if (this.building)
            throw new Error(`The type ${this.constructor.name} is involved in a circlar referenciation loop.
            If this is intended, please use the thunk version of 'fields' - i.e.  "fields: () => ({ /* field definition */ })`)
        this.building = true;

        // resolve fields
        const cfg = this.config();
        const buildField =  (ifcm: InversifyFieldConfigMap<TSource, TContext>) => {
            // build real type map
            const builtMap: gql.GraphQLFieldConfigMap<TSource, TContext> = {};
            Object.keys(ifcm)
                .forEach(fieldName => {
                    const field = ifcm[fieldName];
                    if (!field)
                        return; // ignore undefined fields
                    builtMap[fieldName] = {
                        ...field,
                        type: typeof field.type === 'function'
                            ? this.builders.get(field.type).build()
                            : field.type,
                    };
                });
            return builtMap;
        }
        
        // retreive fields
        let builtFields: gql.Thunk<gql.GraphQLFieldConfigMap<TSource, TContext>>;
        if (cfg.fields instanceof Array) {
            builtFields = {};
            cfg.fields.forEach(b => {
                 let m = this.builders.get(b).map();
                 if (typeof m === 'function')
                    m = m();
                const builtMap = buildField(m);
                Object.keys(builtMap)
                    .forEach(mk => {
                        if (builtFields[mk])
                            throw new Error('Dupplicate field in partial graphql map: ' + mk);
                        builtFields[mk] = builtMap[mk];
                    });
            });
        } else if (typeof cfg.fields === 'function') {
            const fieldsFn = cfg.fields;
            builtFields = () => buildField(fieldsFn());
        } else
            builtFields = buildField(cfg.fields);

        
        // return real object type
        this.built = new gql.GraphQLObjectType({
            ...cfg,
            fields: builtFields,
        });
        delete this.building;
        return this.built;
    }
}