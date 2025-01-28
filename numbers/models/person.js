const mongoose = require('mongoose')

const url = process.env.MONGODB_URI 

console.log('connecting to', url)
mongoose.set('strictQuery', false)
mongoose.connect(url).then(result => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

const personSchema = mongoose.Schema({
	name: {
	    type: String,
	    required: true,
	    minlength: 3,
	},
	
	number: {
	    type: String,
	    required: true,
	    validate: {
		validator: (v) => {
		    return /\d{3}-\d{8}/.test(v);
		},
		message: props => `${props.value} is not valid. Phone number should be of format: NNN-NNNNNNNN`
	    },
	}
})

personSchema.set('toJSON', { virtuals: true});


const Person = mongoose.model('Person', personSchema)



module.exports = Person
