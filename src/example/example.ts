import Person from './Person'

const json = JSON.stringify(
  {
    id: 'b46021c4-2cf2-4167-a31c-50c9d297e6b8',
    name: 'Alice',
    age: 1,
    isActive: false,
    createAt: 1742483906966,
    hobbies: ['Reading', 'video game'],
    address: {postalCode: '123-4567', address: 'tokyo'}
  },
  null,
  2
)

const person = Person.example()

console.log('*** Create a Person instance from example ***\n')
console.log('\nPerson instance to compact JSON:\n')
console.log(person.toJSON())
console.log('\nPerson instance to pretty JSON:\n')
console.log(person.toJSON(true))
console.log('\nPerson instance to pretty and masked JSON:\n')
console.log(person.toJSON(true, true))

console.log('\n*** Clone a Person instance ***\n')
const person2 = person.clone()
console.log(person2.toJSON())

console.log('\n*** Create a Person instance from JSON ***\n')
const person3 = Person.fromJSON(json) as Person
console.log('\nJSON:\n', json)
console.log('\nPerson instance to pretty JSON:\n')
console.log(person3.toJSON())
