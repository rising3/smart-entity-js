import crypto from 'crypto'
import SmartEntity from '../index'
import {Address} from './Address'

export class Person extends SmartEntity<Person> {
  protected _maskableFields = ['name']
  protected _requiredFields = ['name']
  protected _schemaHints = {
    id: {type: 'string'},
    name: {type: 'string'},
    age: {type: 'number', nullable: true},
    isActive: {type: 'boolean', nullable: false},
    createAt: {type: 'number'},
    hobbies: {type: 'array', nullable: true},
    address: {
      type: 'object',
      schema: Address.getJsonSchema(),
      nullable: true
    }
  }

  constructor(
    public id: string = crypto.randomUUID(),
    public name: string | null = null,
    public age?: number,
    public isActive: boolean = true,
    public createAt: number = Date.now(),
    public hobbies: string[] = [],
    public address?: Address
  ) {
    super()
  }

  static example(): Person {
    return new Person(
      crypto.randomUUID(),
      'Alice',
      Math.floor(Math.random() * 100) + 1,
      true,
      Date.now(),
      ['reading', 'video game'],
      Address.example()
    )
  }
}
