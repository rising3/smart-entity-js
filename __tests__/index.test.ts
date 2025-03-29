import { describe, expect, test } from '@jest/globals'
import SmartEntity from '../src/index'

class SubModel extends SmartEntity<SubModel> {
  protected _maskableFields = ['hobbies']
  protected _requiredFields = ['hobbies']
  protected _schemaHints = {
    hobbies: { type: 'array', items: { type: 'string' }, nullable: false },
  }

  constructor(public hobbies: string[] = []) {
    super()
  }

  static example(): SubModel {
    return new SubModel(['reading', 'video game'])
  }
}

class RootModel extends SmartEntity<RootModel> {
  protected _maskableFields = ['description']
  protected _requiredFields = ['description']
  protected _schemaHints = {
    id: { type: 'number' },
    description: { type: 'string', nullable: false },
    isActive: { type: 'boolean' },
    sub: { type: 'object', schema: SubModel.getJsonSchema(), nullable: true },
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

describe('RootModel Class', () => {
  test('toJSON() should return valid JSON', () => {
    const target = new RootModel(1, 'test', true, SubModel.example())
    const json = target.toJSON()

    expect(JSON.parse(json)).toEqual({
      id: 1,
      description: 'test',
      isActive: true,
      sub: {
        hobbies: ['reading', 'video game'],
      },
    })
  })

  test('toJSON() should mask sensitive fields', () => {
    const target = new RootModel(1, 'test', true, SubModel.example())
    const maskedJson = target.toJSON(false, true)
    const parsedJson = JSON.parse(maskedJson)
    expect(parsedJson.description).toContain('*')
    parsedJson.sub?.hobbies?.forEach((v: string) => expect(v).toContain('*'))
  })

  test('toJSON() should mask sensitive fields in array items', () => {
    class TestModel extends SmartEntity<TestModel> {
      protected _maskableFields = ['tags']
      protected _requiredFields = []
      protected _schemaHints = {
        tags: {
          type: 'array',
          items: { type: 'string', minLength: 2, maxLength: 10 },
        },
      }

      constructor(public tags: string[] = []) {
        super()
      }
    }

    const target = new TestModel(['tag1', 'tag2'])
    const maskedJson = target.toJSON(false, true)
    const parsedJson = JSON.parse(maskedJson)

    expect(parsedJson.tags).toEqual(['****', '****'])
  })

  test('toJSON() should mask sensitive fields in object fields', () => {
    class NestedModel extends SmartEntity<NestedModel> {
      protected _maskableFields = ['field1']
      protected _requiredFields = ['field2']
      protected _schemaHints = {
        field1: { type: 'string', nullable: true },
        field2: { type: 'number' },
      }

      constructor(
        public field1: string | null = null,
        public field2: number = 0
      ) {
        super()
      }
    }

    class TestModel extends SmartEntity<TestModel> {
      protected _maskableFields = ['nested']
      protected _requiredFields = []
      protected _schemaHints = {
        nested: { type: 'object', schema: NestedModel.getJsonSchema(), nullable: true },
      }

      constructor(
        public nested?: NestedModel
      ) {
        super()
      }
    }

    const target = new TestModel(new NestedModel('test', 123))
    const maskedJson = target.toJSON(false, true)
    const parsedJson = JSON.parse(maskedJson)

    expect(parsedJson.nested.field1).toBe('****')
    expect(parsedJson.nested.field2).toBe(123)
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

  test('fromJSON() should throw an error for invalid JSON', () => {
    const json = '{"id": 0}'

    expect(() => RootModel.fromJSON(json)).toThrow(/Validation failed: /)
  })

  test('validate() should validate a valid RootModel instance', () => {
    const target = RootModel.example()

    expect(() => target.validate()).not.toThrow()
  })

  test('validate() should throw an error for invalid RootModel instance', () => {
    const target = new RootModel()

    expect(() => target.validate()).toThrow(/Validation failed: /)
  })

  test('getJsonSchema() should return valid JSON Schema', () => {
    const schema = RootModel.getJsonSchema()

    expect(schema).toHaveProperty('type', 'object')
    expect(schema.properties).toHaveProperty('id')
    expect(schema.properties).toHaveProperty('description')
    expect(schema.properties).toHaveProperty('isActive')
    expect(schema.properties).toHaveProperty('sub')
    expect(schema.required).toContain('description')
  })

  test('getJsonSchema() should include minLength and maxLength for string fields', () => {
    class TestModel extends SmartEntity<TestModel> {
      protected _maskableFields = []
      protected _requiredFields = []
      protected _schemaHints = {
        name: { type: 'string', minLength: 3, maxLength: 10 },
      }

      constructor(public name: string = '') {
        super()
      }
    }

    const schema = TestModel.getJsonSchema()
    expect(schema.properties?.name).toHaveProperty('minLength', 3)
    expect(schema.properties?.name).toHaveProperty('maxLength', 10)
  })

  test('getJsonSchema() should include items schema for array fields', () => {
    class TestModel extends SmartEntity<TestModel> {
      protected _maskableFields = []
      protected _requiredFields = []
      protected _schemaHints = {
        tags: {
          type: 'array',
          items: {
            type: 'string',
            minLength: 2,
            maxLength: 20,
          },
        },
      }

      constructor(public tags: string[] = []) {
        super()
      }
    }

    const schema = TestModel.getJsonSchema()
    expect(schema.properties?.tags).toHaveProperty('type', 'array')
    expect(schema.properties?.tags?.items).toHaveProperty('type', 'string')
    expect(schema.properties?.tags?.items).toHaveProperty('minLength', 2)
    expect(schema.properties?.tags?.items).toHaveProperty('maxLength', 20)
  })

  test('getJsonSchema() should include items schema for array fields', () => {
    class TestModel extends SmartEntity<TestModel> {
      protected _maskableFields = []
      protected _requiredFields = []
      protected _schemaHints = {
        tags: {
          type: 'array',
          items: { type: 'string', minLength: 2, maxLength: 10 },
        },
      }

      constructor(public tags: string[] = []) {
        super()
      }
    }

    const schema = TestModel.getJsonSchema()
    expect(schema.properties?.tags).toHaveProperty('type', 'array')
    expect(schema.properties?.tags?.items).toHaveProperty('type', 'string')
    expect(schema.properties?.tags?.items).toHaveProperty('minLength', 2)
    expect(schema.properties?.tags?.items).toHaveProperty('maxLength', 10)
  })

  test('clone() should create a deep copy', () => {
    const target = new RootModel(1, 'test', true, SubModel.example())
    const clone = target.clone()

    expect(target.id).toBe(clone.id)
    expect(target.description).toBe(clone.description)
    expect(target.isActive).toBe(clone.isActive)
    expect(target.sub?.hobbies).toEqual(clone.sub?.hobbies)

    expect(target).not.toBe(clone) // not equal reference
    expect(target.sub).not.toBe(clone.sub) // not equal reference
  })

})