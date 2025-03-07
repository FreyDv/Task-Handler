export class UserDto {
    id: number
    name: string
    age: number

    constructor(record: {id: number, name: string, age: number}) {
        this.id = record.id
        this.name = record.name
        this.age = record.age

        return this
    }
}