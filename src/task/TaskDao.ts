import { db } from '../db/databaseClient';
import { Task } from './Task';
import { isDuplicationTaskError } from '../common/DuplicationTask.errorParser';
import { Bit, ISOLATION_LEVEL, NVarChar } from 'mssql';

export const taskPkName: string = 'PK_Task_id';

export class TaskDao {
    static async createTaskTable() {
        db.query(`
            CREATE TABLE Task
            (
                id           varchar(255),
                completed    bit NOT NULL DEFAULT 0,
                todo         bit NOT NULL DEFAULT 0, 
                CONSTRAINT ${taskPkName} PRIMARY KEY (id)
            );
        `);
    }

    static async getUncreatedTask(tasksId: string[]): Promise<string[]> {
        const quotedStrings = tasksId.map((id) => `('${id}')`).join(', ');

        const result = await db.query(
            `
            SELECT needToCreate.id
            FROM (
                VALUES ${quotedStrings}
            ) AS needToCreate(id) 
            LEFT OUTER JOIN Task as t ON t.id = needToCreate.id WHERE t.id IS NULL;
        `,
        );

        return result.recordset.map((recordset) => recordset.id) || [];
    }

    static async saveTask(task: Task, todo: boolean = false): Promise<void> {
        return await db.transaction(async (transaction) => {
            transaction.isolationLevel = ISOLATION_LEVEL.SERIALIZABLE; // Ensures strict transaction isolation

            const request = transaction.request();
            request.input('id', NVarChar(255), task.id);
            request.input('todo', Bit, todo ? 1 : 0);

            // Execute the UPSERT logic inside the transaction
            const existsQuery = `
                IF EXISTS (SELECT * FROM Task WITH (UPDLOCK, SERIALIZABLE) WHERE id = @id)
                BEGIN
                    UPDATE Task SET todo = @todo WHERE id = @id
                END
                ELSE
                BEGIN
                    INSERT INTO Task (id, todo) VALUES (@id, @todo)
                END
            `;

            try {
                await request.query(existsQuery);
            } catch (err: unknown) {
                if (isDuplicationTaskError(err)) {
                    throw new Error(`Task with id: '${task.id}' already exists`);
                }
            }
        });
    }

    static async setDoneStatus(id: string) {
        const res = await db.query(
            `
            UPDATE Task
            SET completed = 1, todo = 0
            WHERE id = @id;            
        `,
            { id },
        );
    }

    static async saveManyTask(tasks: Task[]) {
        const res = await db.query(`
            INSERT INTO Task (id) VALUES 
                ${tasks.map((task) => `('${task.id}')`).join(', ')} 
        `);
    }

    static async getTaskByID(id: string): Promise<Task> {
        const { recordset } = await db.query(
            `SELECT * FROM Task WHERE id = @id;
        `,
            { id },
        );

        return new Task(recordset[0]);
    }

    static async getTaskByIdWithDependency(id: string): Promise<Task> {
        const { recordset } = await db.query(
            `
            SELECT t.id as id, d.dependencyId as dependencyId  FROM Task as t 
            JOIN Dependency as d ON t.id = d.taskId
            WHERE t.id = @id
        `,
            { id },
        );

        const task: Task = recordset.reduce(
            (acc: Task, currentValue) => {
                acc.dependencyIds?.push(currentValue);
                return acc;
            },
            new Task({ id, dependencyIds: [] }),
        );

        return task;
    }

    // static async getUncompletedTaskWithDependencies(): Promise<Task[]> {
    //     const { recordset } = await db.query(
    //         `
    //         SELECT t.id as id, d.dependencyId as dependencyId  FROM Task as t
    //         JOIN Dependency as d ON t.id = d.taskId
    //         WHERE t.todo = 1;
    //     `,
    //     );
    //
    //     const task: Task = recordset.reduce(
    //         (acc: Task, currentValue) => {
    //             acc.dependencyTask?.push(currentValue);
    //             return acc;
    //         },
    //         new Task({ id, dependencyTask: [] }),
    //     );
    //
    //     // return task;
    // }
}
