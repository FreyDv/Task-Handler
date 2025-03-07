import { isRequestError } from './DbRequest.typeGourd';
import { pkDependency } from '../taskDependency/TaskDependencyDao';

export function isDuplicationDependencyError(err: unknown) {
    if (!isRequestError(err)) {
        return false;
    }

    return err.message.includes('PRIMARY KEY') && err.message.includes(pkDependency);
}
