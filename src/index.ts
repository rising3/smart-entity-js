import Ajv, { JSONSchemaType } from "ajv";

export default abstract class SmartEntity<T> {
  protected abstract _maskableFields: string[];
  protected abstract _requiredFields: string[];
  protected abstract _schemaHints: Record<
    string,
    { type: string; schema?: JSONSchemaType<any>; nullable?: boolean }
  >;
  static example: () => SmartEntity<any>;

  protected static safeJsonParse<T>(json: string): T | null {
    try {
      return JSON.parse(json);
    } catch (error) {
      return null;
    }
  }

  protected static safeJsonStringify(
    obj: any,
    pretty: boolean = false
  ): string {
    try {
      return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
    } catch (error) {
      return "";
    }
  }

  static getJsonSchema<U>(): JSONSchemaType<U> {
    const instance = new (this as any)();
    const properties: Record<string, any> = {};

    for (const key of Object.keys(instance._schemaHints)) {
      if (key.startsWith("_")) continue; // ignore fileds start with "_"

      const hint = instance._schemaHints[key];

      if (hint.schema) {
        const schema = hint.schema as JSONSchemaType<any>;
        schema["nullable"] = hint.nullable ?? false;
        properties[key] = schema;
      } else {
        properties[key] = {
          type: hint.type,
          nullable: hint.nullable ?? false,
        };
      }
    }

    return {
      type: "object",
      properties,
      required: instance._requiredFields,
      additionalProperties: false,
    } as JSONSchemaType<U>;
  }

  static fromJSON<U>(json: string): U {
    const data = SmartEntity.safeJsonParse<U>(json);
    if (!data) throw new Error("Invalid JSON data: " + json);

    const schema = this.getJsonSchema<U>();
    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    if (!validate(data)) {
      throw new Error(
        "Invalid JSON: " + SmartEntity.safeJsonStringify(validate.errors)
      );
    }

    return new (this as any)(...Object.values(data)) as U;
  }

  toJSON(pretty: boolean = false, maskSensitive: boolean = false): string {
    const jsonObject: Record<string, any> = {};

    for (const key of Object.keys(this)) {
      if (key.startsWith("_")) continue; // ignore fileds start with "_"

      const value = (this as any)[key];

      if (value instanceof SmartEntity) {
        jsonObject[key] =
          SmartEntity.safeJsonParse(value.toJSON(pretty, maskSensitive)) ?? null;
      } else {
        if (Array.isArray(value)) {
          jsonObject[key] =
            maskSensitive && this._maskableFields.includes(key)
              ? value.map(v => "*".repeat(String(v).length))
              : value;

        } else {
          jsonObject[key] =
            maskSensitive && this._maskableFields.includes(key)
              ? "*".repeat(String(value).length)
              : value;
        }
      }
    }

    return SmartEntity.safeJsonStringify(jsonObject, pretty);
  }

  clone(): T {
    return (this.constructor as typeof SmartEntity<T>).fromJSON(this.toJSON());
  }

  validate(): void {
    (this.constructor as typeof SmartEntity<T>).fromJSON(this.toJSON());
  }
}
