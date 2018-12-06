import * as inv from 'inversify';
import { InversifyGraphQLSchemaConfig } from './interfaces';

@inv.injectable()
export abstract class InversifyGraphQLSchemaBuilder {

    abstract schema(): InversifyGraphQLSchemaConfig;
}
