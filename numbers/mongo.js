const mongoose = require('mongoose')

if (process.argv.length < 3) {
	console.log('give password as argument')
	process.exit(1)
}

const password = process.argv[2]
const inputName = process.argv[3]
const inputNum = process.argv[4]

const collection = "personsApp"
const url = `mongodb+srv://juhanakaarlehto:${password}@fullstackopen-cluster.rbtpg.mongodb.net/${collection}?retryWrites=true&w=majority&appName=fullstackopen-cluster`

mongoose.set('strictQuery', false)
mongoose.connect(url)

const personSchema = mongoose.Schema({
	name: String,
	number: String,
})

const Person = mongoose.model('Person', personSchema)

if (!inputNum || !inputName) {
	Person.find({}).then(result => {
		let phonebook = result.reduce((acc, person) => {
		    acc = `${acc}${person.name} ${person.number}\n`
		    return acc
		},"Phonebook:\n")
		console.log(phonebook)
		mongoose.connection.close()
		return
	})
}
else {

	const person = new Person({
		name: inputName.toString(),
		number: inputNum.toString()
	})

	person.save().then(result => {
		console.log(`New person saved`)
		console.log(`Added ${result.name}, number: ${result.number} to phonebook`)
		mongoose.connection.close()
	})
}
