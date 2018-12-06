import * as inv from 'inversify';
import { InversifyGraphQLSchemaConfig } from './interfaces';

@inv.injectable()
export abstract class InversifySchemaBuilder {

    abstract schema(): InversifyGraphQLSchemaConfig;
}
