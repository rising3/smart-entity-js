// const SmartEntity = require("@rising3/smart-entity-js");
const SmartEntity = require('../../dist/index.js')

class Address extends SmartEntity.default {
    constructor(
        street = null,
        addressLine2 = null,
        city = null,
        state = null,
        postalCode = null,
        country = null
    ) {
        super()
        this.street = street
        this.addressLine2 = addressLine2
        this.city = city
        this.state = state
        this.postalCode = postalCode
        this.country = country

        this._maskableFields = ['street', 'postalCode']

        this._requiredFields = ['street', 'city', 'state', 'postalCode', 'country']

        this._schemaHints = {
            street: { type: 'string', nullable: false },
            addressLine2: { type: 'string', nullable: true },
            city: { type: 'string', nullable: false },
            state: { type: 'string', nullable: false },
            postalCode: { type: 'string', nullable: false, pattern: '^[0-9]{5}(-[0-9]{4})?$' },
            country: { type: 'string', nullable: false }
        }
    }

    static example() {
        return new Address(
            '123 Main St',
            'Apt 4B',
            'New York',
            'NY',
            '10001',
            'United States'
        )
    }
}

// Create an Address instance
const address = Address.example()

// Validate the Address instance
try {
    address.validate()
    console.log('Address is valid')
} catch (error) {
    console.error('Validation failed:', error.message)
}

// Serialize to JSON
console.log('Serialized JSON:', address.toJSON())

// Mask sensitive fields
console.log('Masked JSON:', address.toJSON(false, true))
