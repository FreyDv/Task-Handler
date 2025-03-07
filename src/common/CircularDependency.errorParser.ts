import { isRequestError } from './DbRequest.typeGourd';
import { taskPkName } from '../task/TaskDao';
import { checkCircularDependency } from '../taskDependency/TaskDependencyDao';

export function isCircularDependencyError(err: unknown) {
    if (!isRequestError(err)) {
        return false;
    }

    return err.message.includes('CHECK constraint') && err.message.includes(checkCircularDependency);
}
