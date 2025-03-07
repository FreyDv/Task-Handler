import { UserDao } from './UserDao';

const userMock = [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 40 },
    { name: 'Charlie', age: 32 },
    { name: 'David', age: 50 },
    { name: 'Eve', age: 22 },
];

(async function main() {
    await UserDao.dropTableIfExist();
    if (!(await UserDao.checkTableExists())) {
        await UserDao.createTable();
    }

    if ((await UserDao.selectAll()).length == 0) {
        await UserDao.insertMockData(userMock);
    }

    let resAllUsers = await UserDao.selectAll();
    console.log(resAllUsers);

    let userWithId = await UserDao.selectById(1);
})();
