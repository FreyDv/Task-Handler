import { db } from '../db/databaseClient';
import { isCircularDependencyError } from '../common/CircularDependency.errorParser';
import { Task } from '../task/Task';
import { VarChar } from 'mssql';
import { isDuplicationDependencyError } from '../common/TaskAlreadyExist.errorParser';

export const checkCircularDependency = 'CHECK_Dependency_Circular_Dependency';
export const pkDependency = 'Pair_PK_Dependency__taskId_dependencyId';

export class TaskDependencyDao {
    static async createDependencyTable() {
        db.query(`
        DROP SEQUENCE IF EXISTS OrderNumberSequence;
        
        CREATE SEQUENCE OrderNumberSequence  
            AS BIGINT  
            START WITH 1  
            INCREMENT BY 1  
            NO MAXVALUE;

            CREATE TABLE Dependency
            (
                taskId       varchar(255),
                dependencyId varchar(255),
                orderNumber        BIGINT DEFAULT NEXT VALUE FOR OrderNumberSequence,
                createdAt    DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT ${pkDependency} PRIMARY KEY (taskId, dependencyId),
                CONSTRAINT FK_Dependency_taskId__Task_id FOREIGN KEY (taskId) REFERENCES Task (id),
                CONSTRAINT FK_Dependency_dependencyId__Task_id FOREIGN KEY (taskId) REFERENCES Task (id),
                CONSTRAINT ${checkCircularDependency} CHECK (taskId <> dependencyId)
            );
        `);
    }

    static async saveTaskDependencies(taskId: string, dependencyIds: string[]) {
        if (dependencyIds.length === 0) {
            return;
        }
        try {
            const result = await db.query(`
                INSERT INTO Dependency (taskId, dependencyId) VALUES
                    ${dependencyIds.map((dependencyId) => `('${taskId}', '${dependencyId}')`).join(',')};
            `);
        } catch (err: unknown) {
            if (isCircularDependencyError(err)) {
                throw new Error(
                    `Circular dependency with task with id: '${taskId}' on dependency[${dependencyIds.indexOf(taskId)}] index`,
                );
            }

            if (isDuplicationDependencyError(err)) {
                throw new Error(
                    `Duplication dependency!\n Task: '${taskId}' already has one or more of following dependencies '${dependencyIds}'`,
                );
            }
        }
    }

    static async getFirstLevelDependencies() {
        const result = await db.query(`
            SELECT t.id as id, d.dependencyId as dependencyId  FROM Task as t
                JOIN Dependency as d ON t.id = d.taskId
                WHERE t.todo = 1
                ORDER BY d.orderNumber ASC;
            `);

        const objectWithTaskAndDependencies = result.recordset.reduce((acc, val) => {
            if (!Array.isArray(acc[val.id])) {
                acc[val.id] = [];
            }
            acc[val.id].push(val.dependencyId);

            return acc;
        }, {});

        return Object.getOwnPropertyNames(objectWithTaskAndDependencies).map(
            (kay) => new Task({ id: kay, dependencyIds: objectWithTaskAndDependencies[kay] }),
        );
    }

    static async getFirstLevelDependenciesByIds(taskIds: string[]) {
        if (!taskIds.length) {
            return [];
        }

        const request = await db.request();

        const placeholders = taskIds
            .map((id, i) => {
                request.input(`taskId${i}`, VarChar, id);
                return `@taskId${i}`;
            })
            .join(', ');

        const query = `
            SELECT d.taskId AS id, d.dependencyId AS dependencyId
            FROM Dependency AS d
            WHERE d.taskId IN (${placeholders})
            ORDER BY d.orderNumber ASC;
        `;

        const result = await request.query(query);

        const objectWithTaskAndDependencies = result.recordset.reduce((acc, val) => {
            if (!Array.isArray(acc[val.id])) {
                acc[val.id] = [];
            }
            acc[val.id].push(val.dependencyId);

            return acc;
        }, {});

        return Object.getOwnPropertyNames(objectWithTaskAndDependencies).map(
            (kay) => new Task({ id: kay, dependencyIds: objectWithTaskAndDependencies[kay] }),
        );
    }
}
