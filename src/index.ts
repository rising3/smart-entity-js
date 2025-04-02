import Ajv, { JSONSchemaType } from 'ajv'

/**
 * Base schema hint for defining validation rules for fields.
 */
export type BaseSchemaHint = {
  /** The type of the field (e.g., string, number, boolean, array, object). */
  type: string;
  /** Whether the field can be null. */
  nullable?: boolean;
  /** Minimum length for string fields. */
  minLength?: number;
  /** Maximum length for string fields. */
  maxLength?: number;
  /** Minimum value for number fields. */
  minimum?: number;
  /** Maximum value for number fields. */
  maximum?: number;
  /** Regular expression pattern for string fields. */
  pattern?: string;
};

/**
 * Schema hint for array fields.
 */
export type ArraySchemaHint = BaseSchemaHint & {
  /** Specifies that the field is an array. */
  type: 'array';
  /** Schema for the items in the array. */
  items: BaseSchemaHint | { schema: JSONSchemaType<any> };
};

/**
 * Schema hint for object fields.
 */
export type ObjectSchemaHint = BaseSchemaHint & {
  /** Specifies that the field is an object. */
  type: 'object';
  /** JSON schema for the object. */
  schema?: JSONSchemaType<any>;
};

/**
 * Union type for all schema hints.
 */
export type SchemaHint = BaseSchemaHint | ArraySchemaHint | ObjectSchemaHint;

/**
 * Abstract base class for creating smart entities with schema validation,
 * JSON serialization, and masking capabilities.
 * 
 * @template T The type of the entity.
 */
export default abstract class SmartEntity<T> {
  /**
   * Fields that can be masked during JSON serialization.
   */
  protected abstract _maskableFields: string[];

  /**
   * Fields that are required in the schema.
   */
  protected abstract _requiredFields: string[];

  /**
   * Schema hints for defining the structure of the entity.
   */
  protected abstract _schemaHints: Record<string, SchemaHint>;

  /**
   * Example instance of the entity.
   */
  static example: () => SmartEntity<any>;

  /**
   * Safely parses a JSON string into an object.
   * 
   * @template T The type of the parsed object.
   * @param json The JSON string to parse.
   * @returns The parsed object, or `null` if parsing fails.
   */
  protected static safeJsonParse<T>(json: string): T | null {
    try {
      return JSON.parse(json);
    } catch (error) {
      return null;
    }
  }

  /**
   * Safely serializes an object into a JSON string.
   * 
   * @param obj The object to serialize.
   * @param pretty Whether to format the JSON string with indentation.
   * @returns The serialized JSON string, or an empty string if serialization fails.
   */
  protected static safeJsonStringify(
    obj: any,
    pretty: boolean = false
  ): string {
    try {
      return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
    } catch (error) {
      return '';
    }
  }

  /**
   * Generates a JSON schema for the entity.
   * 
   * @template U The type of the entity.
   * @returns The JSON schema for the entity.
   */
  static getJsonSchema<U>(): JSONSchemaType<U> {
    const instance = new (this as any)();
    const properties = this.buildProperties(instance._schemaHints);

    return {
      type: 'object',
      properties,
      required: instance._requiredFields,
      additionalProperties: false,
    } as JSONSchemaType<U>;
  }

  /**
   * Builds the properties section of the JSON schema based on schema hints.
   * 
   * @param schemaHints The schema hints for the entity.
   * @returns The properties section of the JSON schema.
   */
  private static buildProperties(schemaHints: Record<string, SchemaHint>): Record<string, any> {
    const properties: Record<string, any> = {};

    for (const key of Object.keys(schemaHints)) {
      const hint = schemaHints[key];

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
        };
      } else if (hint.type === 'object' && 'schema' in hint && hint.schema) {
        properties[key] = hint.schema;
      } else {
        properties[key] = {
          type: hint.type,
          nullable: hint.nullable ?? false,
          minLength: hint.minLength,
          maxLength: hint.maxLength,
          minimum: hint.minimum,
          maximum: hint.maximum,
          pattern: hint.pattern,
        };
      }
    }

    return properties;
  }

  /**
   * Creates an entity instance from a JSON string.
   * 
   * @template U The type of the entity.
   * @param json The JSON string to parse.
   * @returns The created entity instance.
   * @throws If the JSON string is invalid or does not match the schema.
   */
  static fromJSON<U>(json: string): U {
    const data = SmartEntity.safeJsonParse<U>(json);
    if (!data) throw new Error(`Invalid JSON data: ${json}`);

    const schema = this.getJsonSchema<U>();
    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    if (!validate(data)) {
      const errors = validate.errors?.map(err => `${err.instancePath} ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${errors}`);
    }

    const instance = new (this as any)();
    Object.assign(instance, data);
    return instance as U;
  }

  /**
   * Serializes the entity to a JSON string.
   * 
   * @param pretty Whether to format the JSON string with indentation.
   * @param maskSensitive Whether to mask sensitive fields.
   * @returns The serialized JSON string.
   */
  toJSON(pretty: boolean = false, maskSensitive: boolean = false): string {
    const jsonObject: Record<string, any> = {};

    for (const key of Object.getOwnPropertyNames(this)) {
      if (key.startsWith('_')) continue;

      const value = (this as any)[key];
      jsonObject[key] = this.processValue(value, key, pretty, maskSensitive);
    }

    return SmartEntity.safeJsonStringify(jsonObject, pretty);
  }

  /**
   * Processes a value for serialization, applying masking if necessary.
   * 
   * @param value The value to process.
   * @param key The key of the value in the entity.
   * @param pretty Whether to format the JSON string with indentation.
   * @param maskSensitive Whether to mask sensitive fields.
   * @returns The processed value.
   */
  private processValue(value: any, key: string, pretty: boolean, maskSensitive: boolean): any {
    const maskableFields = this._maskableFields || [];

    if (value instanceof SmartEntity) {
      return SmartEntity.safeJsonParse(value.toJSON(pretty, maskSensitive)) ?? null;
    }

    if (Array.isArray(value)) {
      return value.map(item =>
        maskSensitive && maskableFields.includes(key)
          ? '*'.repeat(String(item).length)
          : this.processValue(item, key, pretty, maskSensitive)
      );
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const maskedObject: Record<string, any> = {};
      for (const subKey of Object.keys(value)) {
        maskedObject[subKey] = this.processValue(
          value[subKey],
          subKey,
          pretty,
          maskSensitive && maskableFields.includes(key)
        );
      }
      return maskedObject;
    }

    if (maskSensitive && maskableFields.includes(key)) {
      return '*'.repeat(String(value).length);
    }

    return value;
  }

  /**
   * Creates a deep copy of the entity.
   * 
   * @returns A deep copy of the entity.
   */
  clone(): T {
    return (this.constructor as typeof SmartEntity<T>).fromJSON(this.toJSON());
  }

  /**
   * Validates the entity against its schema.
   * 
   * @throws If the entity does not match the schema.
   */
  validate(): void {
    this.clone();
  }
}
