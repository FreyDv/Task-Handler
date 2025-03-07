import { RequestError } from 'mssql';

export function isRequestError(err: unknown): err is RequestError {
    return err instanceof RequestError;
}
