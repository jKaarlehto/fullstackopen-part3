const express = require('express')
const assert = require('assert');
const { warn } = require('console');

const app = express()
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

app.delete('/api/persons/:id',(request, response) => {
    const id = request.params.id
    const person = persons.find(person => person.id === id)
    if (!person) response.status(404).end()
    persons = persons.filter(person => person.id != id)
    assert(undefined === persons.find(person => person.id === id))
    response.status(200).end()
})

app.post('/api/persons', (request,response) => {
    const person = request.body
    console.log(person)
    if (persons.find(existingPerson => existingPerson.name === person.name)) {
	response.status(409).end()
    }

    const id = Math.floor(Math.random() * 100000);
    console.log(id)
    person.id = id
    persons = [...persons, person]

    response.status(201).end()

})

const PORT = 3001
app.listen({
	port: PORT,
	callback: () => {
		console.log(`Listening on port ${PORT}`)
	}
})
