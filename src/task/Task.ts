import { CreateTaskDto } from './TaskHandler';

export class Task {
    id: string = '';

    dependencyIds: string[];

    constructor(record: CreateTaskDto) {
        this.id = record.id;
        this.dependencyIds = record.dependencyIds;
    }
}
