const express = require('express');
const assert = require('assert');
const morgan = require('morgan');

const app = express()
app.use(express.static('dist'))

//Talla saadaan uusi tokeni kayttoon loggerissa, joka nayttaa pyynnon bodyn merkkijonona
morgan.token('body', (req, res) => {
	return (Object.entries(req.body).length != 0) ? JSON.stringify(req.body) : null
})
//Kaytetaan 'dev' presettia, jonka peraan lisatty uusi :body token
app.use(morgan(':method :url :status :response-time ms - :res[content-length] :body'))
app.use(express.json())

let persons = [
	{
		"id": "1",
		"name": "Arto Hellas",
		"number": "040-123456"
	},
	{
		"id": "2",
		"name": "Ada Lovelace",
		"number": "39-44-5323523"
	},
	{
		"id": "3",
		"name": "Dan Abramov",
		"number": "12-43-234345"
	},
	{
		"id": "4",
		"name": "Mary Poppendieck",
		"number": "39-23-6423122"
	}
]

app.get('/', (request, response) => {
	response.send('<h1> Persons </h1>')
})

app.get('/api/persons', (request, response) => {
	response.send(persons)
})

app.get('/info', (request, response) => {
	response.send(
		`
	<p> Phonebook has information about ${persons.length} people.</p>
	<p>${Date()}</p>
	`
	)
})


app.get('/api/persons/:id', (request, response) => {
	const id = request.params.id
	const person = persons.find(person => person.id === id)
	if (!person) response.status(404).end()
	response.json(person)
})

app.delete('/api/persons/:id', (request, response) => {
	const id = request.params.id
	const person = persons.find(person => person.id === id)
	if (!person) response.status(404).end()
	persons = persons.filter(person => person.id != id)
	assert(undefined === persons.find(person => person.id === id))
	response.status(200).end()
})

app.post('/api/persons', (request, response) => {
	const person = request.body
	console.log(person)
	if (persons.find(existingPerson => existingPerson.name === person.name)) {
		response.status(409).json({ error: `person with the name ${person.name} exists` })
	}
	if (!person.name || !person.number) {
		response.status(400).json({ error: `missing attributes` })
	}

	const id = Math.floor(Math.random() * 100000).toString();
	person.id = id
	persons.push(person) 
	console.log(persons)

	response.status(201).json(person)

})

const unknownEndpoint = (request, response) => {
	response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
})
