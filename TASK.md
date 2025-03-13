
### Asynchronous Dependency Task Handler

#### Problem Statement

You are required to design and implement an asynchronous task handler that can manage tasks with dependencies. Each task can have a list of dependencies that must be completed before the task itself can be executed. The tasks and their dependencies should be stored in a database.

#### Requirements

1. **Task Model**:
   - Each task should have a unique identifier.
   - Each task should have a list of dependencies (other tasks that need to be completed before this task).

2. **Database Storage**:
   - Use a database to store tasks and their dependencies.
   - Implement functions to add, update, and retrieve tasks from the database.

3. **Task Execution**:
   - Implement an asynchronous task handler that can execute tasks in the correct order based on their dependencies.
   - Ensure that a task is only executed once all its dependencies have been completed.

4. **Error Handling**:
   - Handle cases where there are circular dependencies.
   - Provide meaningful error messages for invalid operations.

#### Implementation Details

1. **Database**:
   - You can use any database of your choice (e.g., SQLite, MongoDB, PostgreSQL).
   - Provide a schema for the tasks and their dependencies.

2. **Task Handler**:
   - Implement the task handler in JavaScript (Node.js).
   - Use Promises or async/await for handling asynchronous operations.

3. **Example**:
   - Given tasks A, B, and C where:
     - Task A has no dependencies.
     - Task B depends on Task A.
     - Task C depends on Task B.
   - The task handler should execute Task A first, then Task B, and finally Task C.

#### Deliverables

1. **Code**:
   - Provide the complete source code for the task handler and database interactions.
   - Include comments and documentation where necessary.

2. **Instructions**:
   - Provide instructions on how to set up and run the project.
   - Include any necessary configuration files.

3. **Tests**:
   - Write unit tests to verify the functionality of the task handler.
   - Ensure that the tests cover various scenarios, including tasks with no dependencies, tasks with multiple dependencies, and circular dependencies.

#### Evaluation Criteria

- Correctness: The solution should correctly handle tasks and their dependencies.
- Code Quality: The code should be well-structured, readable, and maintainable.
- Error Handling: The solution should gracefully handle errors and edge cases.
- Testing: The solution should include comprehensive tests.

---

#### Usage Example

1. **Setting Up the Database**:
   - Ensure your database is running and accessible.
   - Create the necessary tables or collections for storing tasks and their dependencies.

2. **Adding Tasks**:
   - Use the provided functions to add tasks to the database. For example:
     ```javascript
     const taskHandler = require('./taskHandler');

     // Add tasks
     taskHandler.addTask({ id: 'A', dependencies: [] });
     taskHandler.addTask({ id: 'B', dependencies: ['A'] });
     taskHandler.addTask({ id: 'C', dependencies: ['B'] });
     ```

3. **Executing Tasks**:
   - Use the task handler to execute tasks in the correct order:
     ```javascript
     taskHandler.executeTasks()
       .then(() => {
         console.log('All tasks executed successfully');
       })
       .catch((error) => {
         console.error('Error executing tasks:', error);
       });
     ```

4. **Handling Errors**:
   - The task handler will throw errors for invalid operations, such as circular dependencies. Ensure you handle these errors appropriately:
     ```javascript
     try {
       taskHandler.addTask({ id: 'D', dependencies: ['C', 'D'] });
     } catch (error) {
       console.error('Error adding task:', error.message);
     }
     ```

5. **Running Tests**:
   - Run the provided unit tests to verify the functionality of the task handler:
     ```bash
     npm test
     ```

This example demonstrates how to set up the database, add tasks with dependencies, execute tasks in the correct order, handle errors, and run tests to ensure the functionality of the task handler.
