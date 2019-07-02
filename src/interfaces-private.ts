import { injectable, interfaces } from 'inversify';
import { InversifyType } from './interfaces';
import { GraphQLOutputType } from 'graphql';

export abstract class ITypeCache {
    abstract buildType<TSource, TContext>(builder: InversifyType<TSource, TContext>): GraphQLOutputType;
    abstract get<T>(ctor: interfaces.Newable<T>): T;
}