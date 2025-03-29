import Ajv, { JSONSchemaType } from 'ajv'

export type BaseSchemaHint = {
  type: string;
  nullable?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
};

export type ArraySchemaHint = BaseSchemaHint & {
  type: 'array';
  items: BaseSchemaHint | { schema: JSONSchemaType<any> };
};

export type ObjectSchemaHint = BaseSchemaHint & {
  type: 'object';
  schema?: JSONSchemaType<any>;
};

export type SchemaHint = BaseSchemaHint | ArraySchemaHint | ObjectSchemaHint;

export default abstract class SmartEntity<T> {
  protected abstract _maskableFields: string[];
  protected abstract _requiredFields: string[];
  protected abstract _schemaHints: Record<string, SchemaHint>;
  static example: () => SmartEntity<any>

  protected static safeJsonParse<T>(json: string): T | null {
    try {
      return JSON.parse(json)
    } catch (error) {
      return null
    }
  }

  protected static safeJsonStringify(
    obj: any,
    pretty: boolean = false
  ): string {
    try {
      return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj)
    } catch (error) {
      return ''
    }
  }

  static getJsonSchema<U>(): JSONSchemaType<U> {
    const instance = new (this as any)()
    const properties = this.buildProperties(instance._schemaHints)

    return {
      type: 'object',
      properties,
      required: instance._requiredFields,
      additionalProperties: false,
    } as JSONSchemaType<U>
  }

  private static buildProperties(schemaHints: Record<string, SchemaHint>): Record<string, any> {
    const properties: Record<string, any> = {}

    for (const key of Object.keys(schemaHints)) {
      const hint = schemaHints[key]

      if (hint.type === 'array' && 'items' in hint && hint.items) {
        properties[key] = {
          type: 'array',
          items: 'schema' in hint.items
            ? hint.items.schema
            : {
                type: hint.items.type,
                nullable: hint.items.nullable ?? false,
                minLength: hint.items.minLength,
                maxLength: hint.items.maxLength,
                minimum: hint.items.minimum,
                maximum: hint.items.maximum,
                pattern: hint.items.pattern,
              },
        }
      } else if (hint.type === 'object' && 'schema' in hint && hint.schema) {
        properties[key] = hint.schema
      } else {
        properties[key] = {
          type: hint.type,
          nullable: hint.nullable ?? false,
          minLength: hint.minLength,
          maxLength: hint.maxLength,
          minimum: hint.minimum,
          maximum: hint.maximum,
          pattern: hint.pattern,
        }
      }
    }

    return properties
  }

  static fromJSON<U>(json: string): U {
    const data = SmartEntity.safeJsonParse<U>(json)
    if (!data) throw new Error(`Invalid JSON data: ${json}`)

    const schema = this.getJsonSchema<U>()
    const ajv = new Ajv()
    const validate = ajv.compile(schema)

    if (!validate(data)) {
      const errors = validate.errors?.map(err => `${err.instancePath} ${err.message}`).join(', ')
      throw new Error(`Validation failed: ${errors}`)
    }

    const instance = new (this as any)()
    Object.assign(instance, data)
    return instance as U
  }

  toJSON(pretty: boolean = false, maskSensitive: boolean = false): string {
    const jsonObject: Record<string, any> = {}

    for (const key of Object.getOwnPropertyNames(this)) {
      if (key.startsWith('_')) continue

      const value = (this as any)[key]
      jsonObject[key] = this.processValue(value, key, pretty, maskSensitive)
    }

    return SmartEntity.safeJsonStringify(jsonObject, pretty)
  }

  private processValue(value: any, key: string, pretty: boolean, maskSensitive: boolean): any {
    const maskableFields = this._maskableFields || []

    if (value instanceof SmartEntity) {
      return SmartEntity.safeJsonParse(value.toJSON(pretty, maskSensitive)) ?? null
    }

    if (Array.isArray(value)) {
      return value.map(item =>
        maskSensitive && maskableFields.includes(key)
          ? '*'.repeat(String(item).length)
          : this.processValue(item, key, pretty, maskSensitive)
      )
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const maskedObject: Record<string, any> = {}
      for (const subKey of Object.keys(value)) {
        maskedObject[subKey] = this.processValue(
          value[subKey],
          subKey,
          pretty,
          maskSensitive && maskableFields.includes(key)
        )
      }
      return maskedObject
    }

    if (maskSensitive && maskableFields.includes(key)) {
      return '*'.repeat(String(value).length)
    }

    return value
  }

  clone(): T {
    return (this.constructor as typeof SmartEntity<T>).fromJSON(this.toJSON())
  }

  validate(): void {
    this.clone()
  }
}
