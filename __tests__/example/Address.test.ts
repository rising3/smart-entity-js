import {describe, expect, test} from '@jest/globals'
import Address from '../../src/example/Address'

describe('Address Class', () => {
  test('toJSON() should return valid JSON', () => {
    const address = new Address('123-4567', 'tokyo') as Address
    const json = address.toJSON()

    expect(JSON.parse(json)).toEqual({
      postalCode: '123-4567',
      address: 'tokyo'
    })
  })

  test('toJSON() should return pretty formatted JSON when pretty=true', () => {
    const address = new Address('123-4567', 'tokyo') as Address
    const prettyJson = address.toJSON(true)

    expect(prettyJson).toContain('\n')
    expect(prettyJson).toContain('  ')
    expect(JSON.parse(prettyJson)).toEqual({
      postalCode: '123-4567',
      address: 'tokyo'
    })
  })

  test('toJSON() should return compact JSON when pretty=false', () => {
    const address = new Address('123-4567', 'tokyo') as Address
    const compactJson = address.toJSON(false)

    expect(compactJson).not.toContain('\n')
    expect(compactJson).not.toContain('  ')
    expect(JSON.parse(compactJson)).toEqual({
      postalCode: '123-4567',
      address: 'tokyo'
    })
  })

  test('toJSON() should mask sensitive fields', () => {
    const address = new Address('123-4567', 'tokyo') as Address
    const maskedJson = address.toJSON(false, true)
    const parsedJson = JSON.parse(maskedJson) as Address
    expect(parsedJson.postalCode).toContain('*')
    expect(parsedJson.address).toContain('*')
  })

  test('fromJSON() should create a valid Address instance', () => {
    const json = '{"postalCode": "000-0000", "address": "osaka"}'
    const address = Address.fromJSON(json) as Address

    expect(address).toBeInstanceOf(Address)
    expect(address.postalCode).toBe('000-0000')
    expect(address.address).toBe('osaka')
  })

  test('fromJSON() should not create a invalid Address instance', () => {
    const json = '{"postalCod": "000-0000", "address": "osaka"}'

    expect(() => Address.fromJSON(json)).toThrow(/Invalid JSON: /)
  })

  test('clone() should create a deep copy', () => {
    const address = new Address('123-4567', 'tokyo') as Address
    const clone = address.clone()

    expect(address.postalCode).toBe(clone.postalCode)
    expect(address.address).toBe(clone.address)

    expect(clone).not.toBe(address) // not equal reference
  })

  test('example() should create a example', () => {
    const address = Address.example() as Address

    expect(address).toHaveProperty('postalCode')
    expect(address).toHaveProperty('address')
  })

  test('getJsonSchema() should return valid JSON Schema', () => {
    const schema = Address.getJsonSchema()

    expect(schema).toHaveProperty('type', 'object')
    expect(schema.properties).toHaveProperty('postalCode')
    expect(schema.properties).toHaveProperty('address')
    expect(schema.required).toContain('postalCode')
    expect(schema.required).toContain('address')
  })

  test('validate() should validate a valid Address instance', () => {
    const address = Address.example() as Address

    expect(() => address.validate()).not.toThrow()
  })

  test('validate() should validate a invalid valid Address instance', () => {
    const address = new Address()

    expect(() => address.validate()).toThrow(/Invalid JSON: /)
  })
})
