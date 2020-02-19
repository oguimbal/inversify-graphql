import { injectable } from 'inversify';

/** Fake context class */
export class MyContext {
    constructor(public contextData: string) {

    }
}

@injectable()
export class MyDependency {
    doesBikesHavePedals() {
        return true;
    }
}
