const express = require('express');
const bodyParser = require('body-parser');
const bcrpyt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
      client: 'pg',
        connection: {
          host : '127.0.0.1',
          user : 'postgres',
          password : 'bushbaby',
          database : 'face_recognition_db'
        }  
});

    db.select('*').from('users').then(data => {
    //  console.log(data);
    })


const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send(database.users)
})

app.post('/signin', (req, res) => {
   db.select('email', 'hash').from('login')
   .where('email', '=', req.body.email)
    .then(data =>{
      const isValid = bcrpyt.compareSync(req.body.password, data[0].hash); 
      if (isValid) {
         db.select('*').from('users') 
        .where('email', '=', req.body.email)
        .then(user => {
            res.json(user[0])
        })
        .catch(err => res.status(400).json('unable to get user'))
      } else {
        res.status(400).json('wrong credentials')
      }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const hash = bcrpyt.hashSync(password);
        db.transaction(trx => {
          trx.insert({
             hash: hash,
             email: email
            })  
            .into('login')
            .returning('email')
            .then(loginEmail => {
              return trx('users') 
              .returning('*') //returns insert so we can use as response (user([0]))
              .insert({
                email: loginEmail[0], //use this as opposed to email as it is predicated upon safe return of email
                name: name,
                joined: new Date(),
                })
                .then(user => {
                res.json(user[0]); //[0] makes sure object not array of objects
                })  
            })
        .then(trx.commit)
        .catch(trx.rollback)
    })
   .catch(err => res.status(400).json('unable to register'))
})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
   db.select('*').from('users').where({
    id: id
   })
   .then(user => {
   if (user.length) {
    res.json(user[0]); //IOW gets rid of [] surrounding 1 list array of object(s)
   } else {
    res.status(400).json('Not found')
   }
    })
   .catch(err=> res.status(400).json('Error getting user'))
})

app.put('/image', (req, res) => {
    const { id, currentFaceCount } = req.body;
   db('users').where('id', '=', id)
   .increment('entries', currentFaceCount)
   .returning('entries')
   .then(entries => {
    res.json(entries[0]);
   })
   .catch(err => res.status(400).json('unable to get entries'))
})

app.listen(3001, () => {
    console.log('app is running on 3001');
})
