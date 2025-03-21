import BaseEntity from '../index'

export default class Address extends BaseEntity<Address> {
  protected _maskableFields = ['postalCode', 'address']
  protected _requiredFields = ['postalCode', 'address']
  protected _schemaHints = {
    postalCode: {type: 'string'},
    address: {type: 'string'}
  }

  constructor(
    public postalCode: string | null = null,
    public address: string | null = null
  ) {
    super()
  }

  static example(): Address {
    return new Address('123-4567', 'tokyo')
  }
}
