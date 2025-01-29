require('dotenv').config()

const Person = require('./models/person')
const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')

const errorHandler = (error, request, response, next) => {
  console.log('error handler called')
  console.error(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }
  next(error)
}

//Middleware, jolla poistetaan id:t jotka johtavat Typecast herjaan mongoosssa.
//tehty jo ennen error handling middlewaren ohjetta. tama siis blokkaa kutsut joissa malformed id ennekuin ne paasevat mongoosia kutsuviin funktioihin

const validateIds = (req, res, next) => {
  const reqObj = Object.fromEntries(Object.entries(req))
  const url = reqObj.url

  //tietokannasta ei haeta mitaan
  if (!url.includes('/persons/')) {
    next()
    return
  }

  let segments = url.split('/')

  //url === {{baseurl}}/persons/
  if (!segments[segments.length - 1]) {
    next()
    return
  }

  let id = segments.find(seg => segments[segments.indexOf(seg) - 1] === 'persons')

  if (!(isNaN(Number(id)))) {
    return res.status(400).json('Integer id\'s prohibited')
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log(`validateIds: ${id} is not a vaild MongoDB id.`)
    return res.status(400).json(
      { error: `${id} is not valid. id must be a 24 character hex string or a 12 byte Uint8Array.` }
    )
  }
  console.log(`validateIds: ${id} is a valid MongoDB id.`)
  next()
  return
}

//Talla saadaan uusi tokeni kayttoon loggerissa, joka nayttaa pyynnon bodyn merkkijonona
morgan.token('body', (req) => {
  return (Object.entries(req.body).length !== 0) ? JSON.stringify(req.body) : null
})

const app = express()
app.use(express.json())
app.use(morgan(':method :url :status :response-time ms - :res[content-length] :body'))
app.use(validateIds)
app.use(express.static('dist'))


app.get('/', (_request, response) => {
  response.send('<h1> Persons </h1>')
})

app.get('/api/persons', (_request, response, next) => {
  Person.find({})
    .then(dbresponse => {
      response.send(dbresponse)
    })
    .catch(error => next(error))
})

/* express doc example
app.get('/api/persons', (request, response, next) => {
    console.log("testing")
	Promise.resolve().then(() => {
	    throw new Error('test')
	})
	.then(() => {
	    throw new Error('test2')
	})
	.catch(err => next(err))
})
*/

app.get('/info', (request, response, next) => {
  Person.find({})
    .then(dbresponse => {
      response.send(
        `
		    <p> Phonebook has information about ${dbresponse.length} people.</p>
		    <p>${Date()}</p>
		    `
      )
    })
    .catch(error => next(error))
})


app.get('/api/persons/:id', (request, response, next) => {
  let reqId = request.params.id
  reqId = isNaN((reqId)) ? reqId : Number(reqId)
  Person.findById(reqId)
    .then(dbresponse => {
      if (dbresponse === null) {
        response.status(404).json({ error: `no records for id: ${reqId}` })
        return
      }
      response.json(dbresponse)
    })
    .catch(error => next(error))
})


app.delete('/api/persons/:id', (request, response, next) => {
  let reqId = request.params.id
  reqId = isNaN(Number(reqId)) ? reqId : Number(reqId)

  Person.findByIdAndDelete(reqId)
    .then(dbresponse => {
      console.log(dbresponse)
      if (dbresponse === null) {
        response.status(204).json({ message: ` ${reqId}, no records found in database` })
        return
      }
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  let person = request.body
  Person.find({ name: person.name })
    .then(dbresponse => {
      if (dbresponse.length > 0) {
        response.status(409).json({ error: `person with the name ${person.name} exists` })
        return
      }
      person = new Person(person)
      person.save().
        then(dbresponse => {
          console.log(`created ok. dbresponse: ${dbresponse}`)
          response.status(201).json(dbresponse)
        })
        .catch(error => next(error))
    })
})



//tama tehty patchilla koska frontend kayttaa patchia
app.patch('/api/persons/:id', (request, response, next) => {
  const reqId = request.params.id
  const fields = { ...request.body }
  Person.findByIdAndUpdate(
    reqId,
    fields,
    { new: true, runValidators: true, context: 'query' })
    .then(dbresponse => {
      if (dbresponse === null) {
        response.status(404).json({ message: ` ${reqId}, no records found in database` })
        return
      }
      response.json(dbresponse)
    })
    .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)
app.use(errorHandler)
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
