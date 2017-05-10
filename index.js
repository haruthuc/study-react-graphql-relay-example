const {graphql} = require('graphql');
const readline = require('readline');
const {MongoClient} = require('mongodb');
const assert = require('assert');

const fs = require('fs');
const path = require('path');
const {introspectionQuery} = require('graphql/utilities');

const mySchema = require('./schema/main.js');

const MONGO_URL = 'mongodb://admin:admin123@ds133291.mlab.com:33291/fshare'; //'mongodb://localhost:27017/fshare';
const graphqlHTTP = require('express-graphql');
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

MongoClient.connect(MONGO_URL,(err,db)=>{
    assert.equal(null,err);
    console.log("Connected to MongoDB Server");
    
    app.use('/graphql',graphqlHTTP({
        schema: mySchema,
        context: {db},
        graphiql: true
    }));

    app.use(express.static('public'));
    //introspectiveQuery
    graphql(mySchema,introspectionQuery).then(
        result => {
            fs.writeFileSync(path.join(__dirname,'cache/schema.json'),
                JSON.stringify(result, null, 2)
            );
            console.log("Generated cached schema.json file");
        }
    ).catch(console.error);

    app.listen(port,()=> console.log("Running Express.js on port "+port));
});



