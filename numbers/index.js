require('dotenv').config()

const Person = require('./models/person');
const express = require('express');
const assert = require('assert');
const morgan = require('morgan');

const mongoose = require('mongoose')

//Middleware, jolla poistetaan id:t jotka johtavat Typecast herjaan mongoosssa.
const validateIds = (req, res, next) => {
	const reqObj = Object.fromEntries(Object.entries(req))
	const url = reqObj.url

	//tietokannasta ei haeta mitaan
	if (!url.includes('/persons/')) {
		console.log(`${url} OK`)
		next()
		return
	}

	let segments = url.split('/')

	//url === {{baseurl}}/persons/	
	if (!segments[segments.length - 1]) {
		console.log(`${url} OK`)
		next()
		return
	}

	id = segments.find(seg => segments[segments.indexOf(seg) - 1] === 'persons')
	id = isNaN(Number(id)) ? id : Number(id)
	if (!mongoose.Types.ObjectId.isValid(id)) {
		console.log(`validateIds: ${id} is not a vaild MongoDB id.`)
		return res.status(400).json(
			{ error: `${id} is not valid. id must be a 24 character hex string, 12 byte Uint8Array, or an integer.` }
		)
	}
	console.log(`validateIds: ${id} is a valid MongoDB id. (App still crashes on int ids)`)
	next()
	return
}

const app = express()
app.use(validateIds)
app.use(express.static('dist'))

//Talla saadaan uusi tokeni kayttoon loggerissa, joka nayttaa pyynnon bodyn merkkijonona
morgan.token('body', (req, res) => {
	return (Object.entries(req.body).length != 0) ? JSON.stringify(req.body) : null
})
//Kaytetaan 'dev' presettia, jonka peraan lisatty uusi :body token
app.use(morgan(':method :url :status :response-time ms - :res[content-length] :body'))
app.use(express.json())

app.get('/', (request, response) => {
	response.send('<h1> Persons </h1>')
})

app.get('/api/persons', (request, response) => {
	Person.find({}).then(dbresponse => {
		response.send(dbresponse)
	})
})

app.get('/info', (request, response) => {
	Person.find({}).then(dbresponse => {
		response.send(
			`
	<p> Phonebook has information about ${dbresponse.length} people.</p>
	<p>${Date()}</p>
	`
		)
	})
})


app.get('/api/persons/:id', (request, response) => {
	const reqId = request.params.id
	Person.findById(reqId).then(dbresponse => {
		if (dbresponse === null) {
			response.status(404).json({ error: `no records for id: ${reqId}` })
			return
		}
		response.json(dbresponse)
	})
})
app.delete('/api/persons/:id', (request, response) => {
	const reqId = request.params.id
	console.log("deleting")
	Person.findByIdAndDelete(reqId).then(dbresponse => {
		console.log(dbresponse)
		if (dbresponse === null) {
			response.status(404).json({ error: `cant delete ${reqId}, no records found in database` })
			return
		}
		response.status(204).end()
	})

})

app.post('/api/persons', (request, response) => {
	let person = request.body
	Person.find({ name: person.name }).then(dbresponse => {
		console.log(Object.entries(dbresponse))
		if (dbresponse.length > 0) {
			response.status(409).json({ error: `person with the name ${person.name} exists` })
			return
		}
		if (!person.name || !person.number) {
			response.status(400).json({ error: `missing attributes` })
			return
		}
		person = new Person(person)
		person.save().then(dbresponse => {
			console.log(`created ok. dbresponse: ${dbresponse}`)
			response.status(201).json(dbresponse)
		})

	})
})

const unknownEndpoint = (request, response) => {
	response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
})
