import { interfaces, Container, inject, typeConstraint, injectable } from 'inversify';
import { InversifyPartialMap } from './partial-map';
import { GraphQLSchema, GraphQLNamedType } from 'graphql';
import { inversifySchema } from './build';
import { IInversifyExtensibleNode, InversifyObjectTypeBuilder, ExtensibleSchemaSymbol, IExtSchema, InversifyObjectTypeBuilderBase } from './object-builder';
import { ITypeCache } from './interfaces-private';
import { InversifyObjectConfig, InversifyFieldList, InversifySchemaConfig, IInversifyExtensibleSchema } from './interfaces';
import { InversifySchemaBuilder } from './schema-builder';
import { named } from './utils';

@injectable()
export class InversifyExtensibleNode<TSource = any, TContext = any> implements IInversifyExtensibleNode {

    private readonly extensions: interfaces.Newable<InversifyPartialMap<any, TContext>>[] = [];
    typeName: string;
    useParentExtensions = false;
    for(name: string) {
        this.typeName = name;
        return this;
    }


    /** Merge the given field list definitions in the current node */
    merge(...fields: interfaces.Newable<InversifyPartialMap<TSource, TContext>>[]): this {
        this.extensions.push(...fields);
        return this;
    }


    buildType(): interfaces.Newable<InversifyObjectTypeBuilder<any, any>> {
        if (!this.extensions.length)
            return null;
        // create a temp class
        const that = this;
        class Temp extends InversifyObjectTypeBuilder<TSource, TContext> {
            constructor() {
                super();
                super.extensions = that.useParentExtensions ? 'noDirect' : 'none';
            }

            config(): InversifyObjectConfig<TSource, TContext> {
                const fieldsMap: InversifyFieldList<TSource, TContext> = {};

                // augment fields with extensions
                for (const ext of that.extensions) {
                    let thisMap = this.builders.get(ext).map();
                    if (typeof thisMap === 'function')
                        thisMap = thisMap();
                    for (const fname of Object.keys(thisMap)) {
                        fieldsMap[fname] = thisMap[fname];
                    }
                }

                // return the type
                return {
                    name: that.typeName,
                    fields: fieldsMap,
                };
            }
        }

        return named(Temp, this.typeName + '_Extensible');
    }
}



export class InversifyExtensibleSchema<TContext = any> implements IExtSchema, IInversifyExtensibleSchema<TContext> {
    readonly query: InversifyExtensibleNode<void, TContext>;
    readonly mutation: InversifyExtensibleNode<void, TContext>;
    readonly subscription: InversifyExtensibleNode<void, TContext>;
    readonly nodes = new Map<any, InversifyExtensibleNode<any, TContext>>();
    container: Container;
    private parents: this[] = [];
    private orphanTypes: GraphQLNamedType[] = [];

    constructor(name: string, container: Container) {
        const c = this.container = new Container();
        c.parent = container;
        c.bind(Container).toConstantValue(c);
        c.bind(ExtensibleSchemaSymbol).toConstantValue(this);

        this.query = this.get(name + 'Queries');
        this.mutation = this.get(name + 'Mutations');
        this.subscription = this.get(name + 'Subscriptions');
        for (const q of [this.query, this.mutation, this.subscription]) {
            q.useParentExtensions = true;
        }
    }

    private create(typeName: any) {
        return this.container.resolve<InversifyExtensibleNode<void, TContext>>(InversifyExtensibleNode)
            .for(typeof typeName === 'string' ? typeName : null);
    }

    get<TSource = any>(typeToExtend: string | interfaces.Newable<InversifyObjectTypeBuilderBase<TSource, TContext, any>>): InversifyExtensibleNode<TSource, TContext> {
        let node = this.nodes.get(typeToExtend);
        if (!node) {
            this.nodes.set(typeToExtend, node = this.create(typeToExtend));
        }
        return node;
    }

    addTypes(...additionalTypes: GraphQLNamedType[]) {
        this.orphanTypes.push(...additionalTypes);
        return this;
    }

    getNoCreate<TSource = any>(extendedType: string, ctor: any, which: 'all' | 'noDirect' | 'none'): InversifyExtensibleNode<TSource, TContext>[] {
        if (which === 'none')
            return [];
        const ret: InversifyExtensibleNode<TSource>[] = [];
        // push extensions of parents first
        for (const p of this.parents) {
            ret.push(...p.getNoCreate(extendedType, ctor, 'all'));
        }
        // get parent extensions for roots
        for (const q of ['query', 'mutation', 'subscription']) {
            if (this[q].typeName === extendedType) {
                for (const p of this.parents)
                    ret.push(p[q]);
            }
        }
        // finally, override all previous extensions by extensions in this schema
        if (which !== 'noDirect') {
            ret.push(this.nodes.get(extendedType));
            ret.push(this.nodes.get(ctor));
        }
        return ret.filter(x => !!x);
    }

    concat(...otherSchema: this[]): this {
        this.parents.push(...otherSchema);
        return this;
    }

    build(): GraphQLSchema {

        const that = this;
        class Temp extends InversifySchemaBuilder {

            @inject(ITypeCache) protected builders: ITypeCache;

            schema(): InversifySchemaConfig {
                return {
                    query: that.query.buildType(),
                    mutation: that.mutation.buildType(),
                    subscription: that.subscription.buildType(),
                    types: that.orphanTypes,
                }
            }
        }
        return inversifySchema(this.container, Temp);
    }
}

export function extensibleSchema<TContext = any>(name: string, container: Container): IInversifyExtensibleSchema<TContext> {
    return new InversifyExtensibleSchema(name, container);
}