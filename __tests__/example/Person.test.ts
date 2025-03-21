import {describe, expect, test} from '@jest/globals'

import Person from '../../src/example/Person'
import Address from '../../src/example/Address'

describe('Person Class', () => {
  test('toJSON() should return valid JSON', () => {
    const person = new Person(
      '4c581c64-94fc-4880-b6e1-6130fbdc7fab',
      'Alice',
      30,
      true,
      1,
      ['reading', 'video game'],
      new Address('123-4567', 'tokyo')
    )
    const json = person.toJSON()

    expect(JSON.parse(json)).toEqual({
      id: '4c581c64-94fc-4880-b6e1-6130fbdc7fab',
      name: 'Alice',
      age: 30,
      isActive: true,
      createAt: 1,
      hobbies: ['reading', 'video game'],
      address: {postalCode: '123-4567', address: 'tokyo'}
    })
  })

  test('toJSON() should return pretty formatted JSON when pretty=true', () => {
    const person = new Person(
      '4c581c64-94fc-4880-b6e1-6130fbdc7fab',
      'Alice',
      30,
      true,
      1,
      ['reading', 'video game'],
      new Address('123-4567', 'tokyo')
    )
    const prettyJson = person.toJSON(true)

    expect(prettyJson).toContain('\n')
    expect(prettyJson).toContain('  ')
    expect(JSON.parse(prettyJson)).toEqual({
      id: '4c581c64-94fc-4880-b6e1-6130fbdc7fab',
      name: 'Alice',
      age: 30,
      isActive: true,
      createAt: 1,
      hobbies: ['reading', 'video game'],
      address: {postalCode: '123-4567', address: 'tokyo'}
    })
  })

  test('toJSON() should return compact JSON when pretty=false', () => {
    const person = new Person(
      '4c581c64-94fc-4880-b6e1-6130fbdc7fab',
      'Alice',
      30,
      true,
      1,
      ['reading', 'video game'],
      new Address('123-4567', 'tokyo')
    )
    const compactJson = person.toJSON(false)

    expect(compactJson).not.toContain('\n')
    expect(compactJson).not.toContain('  ')
    expect(JSON.parse(compactJson)).toEqual({
      id: '4c581c64-94fc-4880-b6e1-6130fbdc7fab',
      name: 'Alice',
      age: 30,
      isActive: true,
      createAt: 1,
      hobbies: ['reading', 'video game'],
      address: {postalCode: '123-4567', address: 'tokyo'}
    })
  })

  test('toJSON() should mask sensitive fields', () => {
    const person = new Person(
      '4c581c64-94fc-4880-b6e1-6130fbdc7fab',
      'Alice',
      30,
      true,
      1,
      ['reading', 'video game'],
      new Address('123-4567', 'tokyo')
    )
    const maskedJson = person.toJSON(false, true)
    const parsedJson = JSON.parse(maskedJson) as Person
    expect(parsedJson.name).toContain('*')
    expect(parsedJson.address?.postalCode).toContain('*')
    expect(parsedJson.address?.address).toContain('*')
  })

  test('fromJSON() should create a valid Person instance', () => {
    const json = JSON.stringify({
      id: 'b46021c4-2cf2-4167-a31c-50c9d297e6b8',
      name: 'Alice2',
      age: 1,
      isActive: false,
      createAt: 1742483906966,
      hobbies: ['reading', 'video game'],
      address: {postalCode: '123-4567', address: 'tokyo'}
    })

    const person = Person.fromJSON(json) as Person

    expect(person).toBeInstanceOf(Person)
    expect(person.id).toBe('b46021c4-2cf2-4167-a31c-50c9d297e6b8')
    expect(person.name).toBe('Alice2')
    expect(person.age).toBe(1)
    expect(person.isActive).toBeFalsy()
    expect(person.createAt).toBe(1742483906966)
    expect(person.hobbies).toStrictEqual(['reading', 'video game'])
    expect(person.address?.postalCode).toBe('123-4567')
    expect(person.address?.address).toBe('tokyo')
  })

  test('fromJSON() should not create a invalid Person instance', () => {
    const json = JSON.stringify({
      uudid: 'b46021c4-2cf2-4167-a31c-50c9d297e6b8',
      name: 'Alice2',
      age: 1,
      isActive: false,
      createAt: 1742483906966,
      hobbies: ['reading', 'video game'],
      address: {postalCode: '123-4567', address: 'tokyo'}
    })

    expect(() => Person.fromJSON(json)).toThrow(/Invalid JSON: /)
  })

  test('clone() should create a deep copy', () => {
    const person = new Person(
      '4c581c64-94fc-4880-b6e1-6130fbdc7fab',
      'Alice',
      30,
      true,
      1,
      ['reading', 'video game'],
      new Address('123-4567', 'tokyo')
    )
    const clone = person.clone()

    expect(person.id).toBe(clone.id)
    expect(person.name).toBe(clone.name)
    expect(person.age).toBe(clone.age)
    expect(person.isActive).toBe(clone.isActive)
    expect(person.createAt).toBe(clone.createAt)
    expect(person.hobbies).toStrictEqual(clone.hobbies)
    expect(person.address?.postalCode).toBe(clone.address?.postalCode)
    expect(person.address?.address).toBe(clone.address?.address)

    expect(person).not.toBe(clone) // not equal reference
  })

  test('example() should create a example', () => {
    const person = Person.example() as Person

    expect(person).toHaveProperty('id')
    expect(person).toHaveProperty('name')
    expect(person).toHaveProperty('isActive')
    expect(person).toHaveProperty('age')
    expect(person).toHaveProperty('createAt')
    expect(person).toHaveProperty('hobbies')
    expect(person).toHaveProperty('address')
  })

  test('getJsonSchema() should return valid JSON Schema', () => {
    const schema = Person.getJsonSchema()

    expect(schema).toHaveProperty('type', 'object')
    expect(schema.properties).toHaveProperty('id')
    expect(schema.properties).toHaveProperty('name')
    expect(schema.properties).toHaveProperty('isActive')
    expect(schema.properties).toHaveProperty('age')
    expect(schema.properties).toHaveProperty('createAt')
    expect(schema.properties).toHaveProperty('hobbies')
    expect(schema.properties).toHaveProperty('address')
    expect(schema.required).toContain('name')
    expect(schema.additionalProperties).toBe(false)
  })

  test('validate() should validate a valid Address instance', () => {
    const person = Person.example() as Person

    expect(() => person.validate()).not.toThrow()
  })

  test('validate() should validate a invalid valid Address instance', () => {
    const person = new Person()

    expect(() => person.validate()).toThrow(/Invalid JSON: /)
  })
})
