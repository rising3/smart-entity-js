import {describe, expect, test} from '@jest/globals'
import SmartEntity from '../src/index'

class RootModel extends SmartEntity<RootModel> {
  protected _maskableFields = ['description']
  protected _requiredFields = ['description']
  protected _schemaHints = {
    id: {type: 'number'},
    description: {type: 'string', nullable: false},
    isActive: {type: 'boolean'},
    sub: {type: 'object', schema: SubModel.getJsonSchema(), nullable: true},
  }

  constructor(
    public id: number = 0,
    public description: string | null = null,
    public isActive: boolean = true,
    public sub?: SubModel
  ) {
    super()
  }

  static example(): RootModel {
    return new RootModel(1, 'test', true, SubModel.example())
  }
}

class SubModel extends SmartEntity<SubModel> {
  protected _maskableFields = ['hobbies']
  protected _requiredFields = ['hobbies']
  protected _schemaHints = {
    hobbies: {type: 'array', nullable: false},
  }

  constructor(
    public hobbies?: string[],
  ) {
    super()
  }

  static example(): SubModel {
    return new SubModel(['reading', 'video game'])
  }
}

describe('RootModel Class', () => {
  test('toJSON() should return valid JSON', () => {
    const target = new RootModel(1, 'test', true, SubModel.example()) as RootModel
    const json = target.toJSON()

    expect(JSON.parse(json)).toEqual({
      id: 1,
      description: 'test',
      isActive: true,
      sub: {
        hobbies: ['reading', 'video game']
      },
    })
  })

  test('toJSON() should return pretty formatted JSON when pretty=true', () => {
    const target = new RootModel(1, 'test', true, SubModel.example()) as RootModel
    const prettyJson = target.toJSON(true)

    expect(prettyJson).toContain('\n')
    expect(prettyJson).toContain('  ')
    expect(JSON.parse(prettyJson)).toEqual({
      id: 1,
      description: 'test',
      isActive: true,
      sub: {
        hobbies: ['reading', 'video game']
      },
    })
  })

  test('toJSON() should return compact JSON when pretty=false', () => {
    const target = new RootModel(1, 'test', true, SubModel.example()) as RootModel
    const compactJson = target.toJSON(false)

    expect(compactJson).not.toContain('\n')
    expect(compactJson).not.toContain('  ')
    expect(JSON.parse(compactJson)).toEqual({
      id: 1,
      description: 'test',
      isActive: true,
      sub: {
        hobbies: ['reading', 'video game']
      },
    })
  })

  test('toJSON() should mask sensitive fields', () => {
    const target = new RootModel(1, 'test', true, SubModel.example()) as RootModel
    const maskedJson = target.toJSON(false, true)
    const parsedJson = JSON.parse(maskedJson) as RootModel

    expect(parsedJson.description).toContain('*')
    parsedJson.sub?.hobbies?.forEach(v => expect(v).toContain('*'))
  })

  test('fromJSON() should create a valid RootModel instance', () => {
    const json = '{"id": 0, "description": "test" , "isActive": true, "sub": {"hobbies": ["reading", "video game"]}}'
    const target = RootModel.fromJSON(json) as RootModel

    expect(target).toBeInstanceOf(RootModel)
    expect(target.id).toBe(0)
    expect(target.description).toBe('test')
    expect(target.isActive).toBe(true)
    expect(target.sub?.hobbies).toEqual(['reading', 'video game'])
  })

  test('fromJSON() should not create a invalid RootModel instance', () => {
    const json = '{"id": 0}'

    expect(() => RootModel.fromJSON(json)).toThrow(/Invalid JSON: /)
  })

  test('clone() should create a deep copy', () => {
    const target = new RootModel(1, 'test', true, SubModel.example()) as RootModel
    const clone = target.clone()

    expect(target.id).toBe(clone.id)
    expect(target.description).toBe(clone.description)
    expect(target.isActive).toBe(clone.isActive)
    expect(target.sub?.hobbies).toEqual(clone.sub?.hobbies)

    expect(target).not.toBe(clone)          // not equal reference
    expect(target.sub).not.toBe(clone.sub)  // not equal reference
  })

  test('example() should create a example', () => {
    const target = RootModel.example() as RootModel

    expect(target).toHaveProperty('id')
    expect(target).toHaveProperty('description')
    expect(target).toHaveProperty('isActive')
    expect(target).toHaveProperty('sub')
    expect(target.sub).toHaveProperty('hobbies')
  })

  test('getJsonSchema() should return valid JSON Schema', () => {
    const target = RootModel.getJsonSchema()

    expect(target).toHaveProperty('type', 'object')
    expect(target.properties).toHaveProperty('id')
    expect(target.properties).toHaveProperty('description')
    expect(target.properties).toHaveProperty('isActive')
    expect(target.properties).toHaveProperty('sub')
    expect(target.required).toContain('description')
  })

  test('validate() should validate a valid RootModel instance', () => {
    const target = RootModel.example() as RootModel

    expect(() => target.validate()).not.toThrow()
  })

  test('validate() should validate a invalid valid RootModel instance', () => {
    const target = new RootModel()

    expect(() => target.validate()).toThrow(/Invalid JSON: /)
  })
})
