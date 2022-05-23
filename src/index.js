const express= require("express")
const bodyParser= require("body-parser")
const route= require("./route/routes")
const mongoose= require("mongoose")
const app= express();
const multer=require("multer")
const { AppConfig } = require('aws-sdk');
app.use( multer().any())


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://swati_pathak:DGhDxlBIIfyRwGwk@cluster0.ogdpf.mongodb.net/group-16Database", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/', route);

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});
