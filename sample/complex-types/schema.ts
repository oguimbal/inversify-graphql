import { InversifySchemaBuilder,  InversifySchemaConfig, InversifyObjectTypeBuilder, InversifyObjectConfig, InversifyPartialMap, InversifyFieldConfigMap } from '../../src';
import { inject, injectable } from 'inversify';
import { GString, GList, GObjectInv, GInt, GInterfaceInv, GPartialMap, GObject, GUnionInv, GBool } from '../../src/shortcuts';
import { MyDependency, MyContext } from './services';

/**
 * ENTRY POINT
 */
export class SchemaBuilder extends InversifySchemaBuilder {
    schema(): InversifySchemaConfig {
        return {
            query: MyRootQuery,
            // you could use other graphql schema config fields:
            // mutation, subscription, ...
        }
    }
}

/**
 * Root query definition
 */
class MyRootQuery extends InversifyObjectTypeBuilder<void, MyContext> {

    // Injected dependency, usable in our resolve() function
    @inject(MyDependency) dependency: MyDependency;

    config(): InversifyObjectConfig<void, MyContext> {
        return {
            name: 'MyRoot',
            fields: {
                // === inline type ===
                inline: {
                    type: GObjectInv({
                        name: 'InlineType',
                        fields: {
                            a: { type: GInt },
                            b: { type: GInt },
                        }
                    }),
                    resolve: () => ({ a: 42, b: 51 }),
                },

                // === Partial roots ===
                partialRoots: {
                    // this will make a type 'PartialRoots' with 3 properties: 'length', 'upper', 'original'
                    // (see implementations below)
                    type: GObjectInv({
                        name: 'PartialRoots',
                        fields: [
                            LengthPartialMap,
                            UpperPartialMap,
                            // you can define partial maps inline:
                            GPartialMap({ original: { type: GString, resolve: x => x } })
                        ],
                    }),
                    resolve: x => 'some string',
                },

                // === Union + interfaces ===
                vehicules: {
                    type: GList(TwoVehiculesUnion),
                    resolve: () => [
                        { type: 'car', name: 'Honda' },
                        { type: 'car', name: 'Tesla' },
                        { type: 'bike', name: 'Kawazaki' },
                    ]
                }

            }
        }
    }
}


const IVehiculeType = GInterfaceInv({
    name: 'IVehicule',
    fields: {
        name: { type: GString },
        wheels: { type: GInt },
    },
    resolveType: t => {
        switch (t.type) {
            case 'car':
                return CarType;
            case 'bike':
                return BikeType;
        }
    }
});

const CarType = GObjectInv({
    name: 'Car',
    interfaces: () => [IVehiculeType],
    fields: () => ({
        name: { type: GString },
        honk: { type: GString, resolve: () => 'Honk !' },
        wheels: { type: GInt, resolve: () => 4 }
    })
});


/** Lets say this one uses a depdendency, for fun */
class BikeType extends InversifyObjectTypeBuilder<any> {

    @inject(MyDependency) private dep: MyDependency;

    config() {
        return {
            name: 'Bike',
            interfaces: [IVehiculeType],
            fields: () => ({
                name: { type: GString },
                wheels: { type: GInt, resolve: () => 2 },
                pedals: { type: GBool, resolve: () => this.dep.doesBikesHavePedals() },
            })
        }
    }
}

const TwoVehiculesUnion = GUnionInv({
    name: 'TerrestrialVehicle',
    types: [BikeType, CarType],
    resolveType: t => {
        switch (t.type) {
            case 'car':
                return CarType;
            case 'bike':
                return BikeType;
        }
    }
})

class LengthPartialMap extends InversifyPartialMap<string> {
    map(): InversifyFieldConfigMap<string> {
        return {
            len: { type: GInt, resolve: x => x.length },
        };
    }
}

class UpperPartialMap extends InversifyPartialMap<string> {
    map(): InversifyFieldConfigMap<string> {
        return {
            upper: { type: GString, resolve: x => x.toUpperCase() },
        };
    }
}
