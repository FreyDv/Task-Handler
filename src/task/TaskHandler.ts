import { Task } from './Task';
import { TaskDao } from './TaskDao';
import { TaskDependencyDao } from '../taskDependency/TaskDependencyDao';
import { db } from '../db/databaseClient';

export type CreateTaskDto = { id: string; dependencyIds: string[] };

export class TaskHandler {
    private executionQueue: string[] = [];
    private alreadyReceivedTaskFromBo = new Map<String, Task>();

    async addTask(taskToAdd: CreateTaskDto): Promise<Task> {
        const isTaskDependFromOtherTask: boolean = taskToAdd.dependencyIds.length > 0;

        if (isTaskDependFromOtherTask) {
            const notExistingDependencies: string[] = await TaskDao.getUncreatedTask(taskToAdd.dependencyIds);

            if (notExistingDependencies.length > 0) {
                const dependenciesToCreate: Task[] = notExistingDependencies.map(
                    (id) => new Task({ id, dependencyIds: [] }),
                );

                await TaskDao.saveManyTask(dependenciesToCreate);
            }
        }

        const task = new Task({ id: taskToAdd.id, dependencyIds: taskToAdd.dependencyIds });

        await TaskDao.saveTask(task, true);

        await TaskDependencyDao.saveTaskDependencies(task.id, taskToAdd.dependencyIds || []);

        return TaskDao.getTaskByIdWithDependency(task.id);
    }

    async executeTasks() {
        this.executionQueue = [];
        this.alreadyReceivedTaskFromBo = new Map<String, Task>();

        await this.prepareExecutionFlowAndValidateCircularDependency();

        async function executeTasksSequentially(tasks: Promise<any>[]) {
            for (const task of tasks) {
                try {
                    await task; // Execute the task
                } catch (error) {
                    console.error('Task failed:', error);
                    break; // Stop execution on error
                }
            }
        }

        const promises = this.executionQueue.reverse().map((taskId) => {
            return new Promise(async (resolve, reject) => {
                try {
                    // here I could get payload form Db related each task.
                    // const taskDetails = await TaskDao.getTaskByID(taskId);

                    // But for now I just use Id's that saved in memory on prepare and circular dependency validation step
                    const result = setTimeout(() => {
                        TaskDao.setDoneStatus(taskId);
                        console.log(`🆗 ${taskId}`);
                    }, 20);
                    resolve(result);
                } catch (error) {
                    console.log(`❌ ${taskId}`);
                    reject(error);
                }
            });
        });

        await db.close();
        return executeTasksSequentially(promises);
    }

    private async prepareExecutionFlowAndValidateCircularDependency() {
        const taskToDoWithDependencies = await TaskDependencyDao.getFirstLevelDependencies();

        for (const task of taskToDoWithDependencies) {
            this.executionQueue.push(task.id);
            this.alreadyReceivedTaskFromBo.set(task.id, task);
            await this.diveDeepIntoDependency(task.dependencyIds, [task.id]);
        }
    }

    private async diveDeepIntoDependency(dependencyId: string[], circularDependencyValidationIds: string[]) {
        if (!dependencyId.length) {
            return;
        }
        const dependencyIds: string[] = dependencyId.reduce((acc, depId) => {
            if (circularDependencyValidationIds.includes(depId)) {
                throw new Error(
                    `Circular dependency exception dependencyId: ${depId} bound with previous step ids: ${
                        [...this.executionQueue, ...circularDependencyValidationIds] +
                        `
                    way to circle: ${[circularDependencyValidationIds, ...depId]}`
                    }`,
                );
            }

            if (!this.alreadyReceivedTaskFromBo.has(depId)) {
                acc.push(depId);
            }
            return acc;
        }, new Array());

        const tasks = await TaskDependencyDao.getFirstLevelDependenciesByIds(dependencyIds);

        for (const taskId of dependencyId) {
            this.executionQueue.push(taskId);
            const leafDependency = tasks.find((t) => t.id === taskId);
            const savedLeafInformation = this.alreadyReceivedTaskFromBo.get(taskId);
            const leaf = leafDependency || savedLeafInformation;

            if (leaf) {
                await this.diveDeepIntoDependency(leaf.dependencyIds, [...circularDependencyValidationIds, leaf.id]);
            }
        }
    }
}

export const taskHandler = new TaskHandler();
