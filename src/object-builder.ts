import * as inv from 'inversify';
import * as gql from 'graphql';
import { InversifyObjectConfig, InversifyFieldConfigMap, InversifyInterfaceConfig } from './interfaces';
import { ITypeCache } from './interfaces-private';

export interface IInversifyExtensibleNode {
    buildType(): inv.interfaces.Newable<InversifyObjectTypeBuilder<any, any>>;
}

export const ExtensibleSchemaSymbol =  Symbol();

export interface IExtSchema {
    getNoCreate(extendedType: string, which: 'all' | 'noDirect' | 'none'): IInversifyExtensibleNode[];
}


@inv.injectable()
export abstract class InversifyObjectTypeBuilderBase<TSource
    , TContext
    , TConfig extends (InversifyObjectConfig<TSource, TContext> | InversifyInterfaceConfig<TSource, TContext>) & Object> {

    protected building?: boolean;
    protected extensions: 'all' | 'noDirect' | 'none'  = 'all';

    @inv.inject(ITypeCache) protected builders: ITypeCache;
    @inv.inject(ExtensibleSchemaSymbol) @inv.optional() private extensible: IExtSchema;

    abstract config(): TConfig;

    protected doBuildConfig() {
        if (this.building)
            throw new Error(`The type ${this.constructor.name} is involved in a circlar referenciation loop.
            If this is intended, please use the thunk version of 'fields' - i.e.  "fields: () => ({ /* field definition */ })`)
        this.building = true;


        // resolve fields, and
        // deep copy item (this.config() might return a constant => must not be modified)
        const cfg = {...this.config() };
        if (typeof cfg.fields === 'function') {
            const cpy = cfg.fields;
            cfg.fields = () => ({
                ...cpy()
            });
        } else if (cfg.fields instanceof Array) {
            cfg.fields = [...cfg.fields];
        } else {
            cfg.fields = {
                ...cfg.fields,
            };
        }

        // load extensions
        if (this.extensible) {
            const extList = this.extensible.getNoCreate(cfg.name, this.extensions);
            for (const extended of extList) {
                const built = extended.buildType();
                if (built) {
                    const instanciated = this.builders.get(built);
                    const extCfg = instanciated.config();
                    if (typeof cfg.fields === 'function') {
                        const cpy = cfg.fields;
                        cfg.fields = () => ({
                            ...cpy(),
                            ...extCfg.fields,
                        })
                    } else {
                        cfg.fields = {
                            ...cfg.fields,
                            ...extCfg.fields,
                        }
                        // for (const fname of Object.keys(extCfg.fields)) {
                        //     if (fname in cfg.fields)
                        //         throw new Error('Cannot merge GraphQL extensions in ' + cfg.name + ' because an extension also declares a field named ' + fname);
                        //     cfg.fields[fname] = extCfg.fields[fname];
                        // }
                    }
                }
            }
        }

        const buildField =  (ifcm: InversifyFieldConfigMap<TSource, TContext>) => {
            // build real type map
            const builtMap: gql.GraphQLFieldConfigMap<TSource, TContext> = {};
            Object.keys(ifcm)
                .forEach(fieldName => {
                    const field = ifcm[fieldName];
                    if (!field)
                        return; // ignore undefined fields
                    const type = this.builders.buildType(field.type);
                    builtMap[fieldName] = {
                        ...field,
                        type: type,
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


        delete this.building;
        return {
            ...cfg,
            fields: builtFields,
        };
    }
}

export abstract class InversifyObjectTypeBuilder<TSource, TContext>
    extends InversifyObjectTypeBuilderBase<TSource, TContext, InversifyObjectConfig<TSource, TContext>> {

    protected built: gql.GraphQLObjectType;

    build() {
        if (this.built)
            return this.built;

        const cfg = super.doBuildConfig();
        // return real object type
        this.built = new gql.GraphQLObjectType(cfg);
        return this.built;
    }
}