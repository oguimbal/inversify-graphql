import * as inv from 'inversify';
import * as gql from 'graphql';
import { InversifyGraphQLFieldConfigMap } from './interfaces';

@inv.injectable()
export abstract class InversifyPartialMap<TSource, TContext> {
    abstract map(): gql.Thunk<InversifyGraphQLFieldConfigMap<TSource, TContext>>;
}