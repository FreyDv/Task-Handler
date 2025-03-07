import { isRequestError } from './DbRequest.typeGourd';
import { taskPkName } from '../task/TaskDao';

export function isDuplicationTaskError(err: unknown) {
    if (!isRequestError(err)) {
        return false;
    }

    err.message.startsWith('Violation') && err.message.includes(taskPkName);
}
