import * as inv from 'inversify';
import * as gql from 'graphql';
import { InversifyFieldConfigMap } from './interfaces';

@inv.injectable()
export abstract class InversifyPartialMap<TSource, TContext = any> {
    abstract map(): gql.Thunk<InversifyFieldConfigMap<TSource, TContext>>;
}