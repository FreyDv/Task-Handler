import { taskHandler } from './task/TaskHandler';
import { checkTableExists, dropTableIfExist } from './db/CommonQueries';
import { TaskDao } from './task/TaskDao';
import { TaskDependencyDao } from './taskDependency/TaskDependencyDao';

export let sqlLogging = false;

async function createInfraIfNeeded() {
    // await dropTableIfExist('Dependency');
    // await dropTableIfExist('Task');

    if (!(await checkTableExists('Task'))) {
        await TaskDao.createTaskTable();
    }

    if (!(await checkTableExists('Dependency'))) {
        await TaskDependencyDao.createDependencyTable();
    }
}

(async function main() {
    await createInfraIfNeeded();

    await taskHandler.addTask({ id: 'A', dependencyIds: ['D', 'E', 'F'] });
    await taskHandler.addTask({ id: 'B', dependencyIds: ['A', 'G', 'H', 'I'] });
    await taskHandler.addTask({ id: 'C', dependencyIds: ['V'] });
    await taskHandler.addTask({ id: 'H', dependencyIds: ['C', 'A'] });

    taskHandler
        .executeTasks()
        .then(() => {
            console.log('All tasks executed successfully');
        })
        .catch((error) => {
            console.error('Error executing tasks:', error);
        });
})();
