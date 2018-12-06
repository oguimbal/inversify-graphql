import * as inv from 'inversify';
import { InversifySchemaConfig } from './interfaces';

@inv.injectable()
export abstract class InversifySchemaBuilder {

    abstract schema(): InversifySchemaConfig;
}
