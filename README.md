# smart-entity-js
[![Build](https://github.com/rising3/smart-entity-js/actions/workflows/build.yml/badge.svg)](https://github.com/rising3/smart-entity-js/actions/workflows/build.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

A smart entity that implements generic methods such as clone(), toJSON(), and fromJSON().

## Requirements

- Node.js 18 or higher

## How to install

To install:
```
npm i @rising3/smart-entity-js
```

## Getting started

### How to use library

Create an entity by inheriting the SmartEntity class.
As an example, create a Person class and an Address class.

#### Person Class
``` typescript
class Person extends SmartEntity<Person> {
    protected _maskableFields = ["name"];
    protected _requiredFields = ["name"];
    protected _schemaHints = {
        id: { type: "string" },
        name: { type: "string" },
        age: { type: "number", nullable: true },
        isActive: { type: "boolean", nullable: false },
        createAt: { type: "number" },
        hobbies: { type: "array", nullable: true },
        address: { type: "object", schema: Address.getJsonSchema(), nullable: true },
    };

    constructor(
        public id: string = crypto.randomUUID(),
        public name: string = "",
        public age?: number,
        public isActive: boolean = true,
        public createAt: number = Date.now(),
        public hobbies: string[] = [],
        public address?: Address
    ) {
        super();
    }

    static example(): Person {
        return new Person(
            crypto.randomUUID(),
            "Alice",
            Math.floor(Math.random() * 100) + 1,
            true,
            Date.now(),
            ["reading", "video game"],
            Address.example()
        );
    }
}
```
#### Address Class

``` typescript
class Address extends SmartEntity<Address> {
    protected _maskableFields = ["postalCode", "address"];
    protected _requiredFields = ["postalCode", "address"];
    protected _schemaHints = {
        postalCode: { type: "string" },
        address: { type: "string" },
    };

    constructor(
        public postalCode: string = "",
        public address: string = ""
    ) {
        super();
    }

    static example(): Address {
        return new Address(
            "123-4567",
            "tokyo"
        );
    }
}
```

### Generic methods

#### static getJsonSchema()

Get the JSON schema for the entity.
The JSON schema is created based on the hints defined in the entity.

``` typescript
const schema = Person.getJsonSchema();
```

result:
``` json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "nullable": false
    },
    "name": {
      "type": "string",
      "nullable": false
    },
    "age": {
      "type": "number",
      "nullable": true
    },
    "isActive": {
      "type": "boolean",
      "nullable": false
    },
    "createAt": {
      "type": "number",
      "nullable": false
    },
    "hobbies": {
      "type": "array",
      "nullable": true
    },
    "address": {
      "type": "object",
      "properties": {
        "postalCode": {
          "type": "string",
          "nullable": false
        },
        "address": {
          "type": "string",
          "nullable": false
        }
      },
      "required": [
        "postalCode",
        "address"
      ],
      "additionalProperties": false,
      "nullable": true
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false
}
```

#### static fromJSON()

Create an instance of the Person class from JSON. 
Validate the JSON using a JSON Schema.

``` typescript
const json = JSON.stringify({
  id: "b46021c4-2cf2-4167-a31c-50c9d297e6b8",
  name: "Jhon Doe",
  age: 1,
  isActive: false,
  createAt: 1742483906966,
  hobbies: ["reading", "video game"],
  address: { postalCode: "123-4567", address: "tokyo" },
});

const person = Person.from(json);
```

#### static example()

Create an instance of the example Person class.

``` typescript
const person = Person.example();
```

#### toJSON()

Get JSON from an instance of the Person class.

##### compact JSON

``` typescript
person.toJSON();
```

result:
``` json
{"id":"e110860c-c201-4977-8f5f-97c7eb0e31ba","name":"Alice","age":5,"isActive":true,"createAt":1742492794876,"hobbies":["reading","video game"],"address":{"postalCode":"123-4567","address":"tokyo"}}
```

##### pretty JSON

``` typescript
person.toJSON(true);
```

result:
``` json
{
  "id": "e110860c-c201-4977-8f5f-97c7eb0e31ba",
  "name": "Alice",
  "age": 5,
  "isActive": true,
  "createAt": 1742492794876,
  "hobbies": [
    "reading",
    "video game"
  ],
  "address": {
    "postalCode": "123-4567",
    "address": "tokyo"
  }
}
```
##### masked JSON

``` typescript
person.toJSON(true, true);
```

result:
``` json
{
  "id": "e110860c-c201-4977-8f5f-97c7eb0e31ba",
  "name": "********",
  "age": 5,
  "isActive": true,
  "createAt": 1742492794876,
  "hobbies": [
    "reading",
    "video game"
  ],
  "address": {
    "postalCode": "********",
    "address": "*****"
  }
}
```

#### validate()

Validate an instance of the Person class using a JSON Schema.

``` typescript
const person = new Person();
person.validate();  // Throw Error
```

#### clone()

Create a clone by deep copying an instance of the Person class.

``` typescript
const clone = person.clone();
```
## How to build from source

### prerequisites

node.js, npm, git need to be installed.

```sh
git clone https://github.com/rising3/smart-entity-js.git
cd smart-entity-js
npm i
npm run test
npm run build
```

To run the example:
```
npm start
```

## License

[Apache 2.0](LICENSE)