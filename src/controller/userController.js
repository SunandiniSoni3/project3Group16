const userModel = require("../model/userModel");
const jwt = require("jsonwebtoken");

//-----------------------------------------------basic Validations-------------------------------------------------------------//

//check for the requestbody cannot be empty --
const isValidRequestBody = function (value) {
    return Object.keys(value).length > 0
}

//validaton check for the type of Value --
const isValid = (value) => {
    if (typeof value == 'undefined' || typeof value == null) return false;
    if (typeof value == 'string' && value.trim().length == 0) return false;
    return true
}

const isValidTitle = function (title) {
    return ['Mr', 'Mrs', 'Miss'].indexOf(title) != -1      //check for the enum value which is does'nt exist
}


//-------------------------------------------------API-1 [/register]--------------------------------------------------//

const createUser = async function (req, res) {
    try {
        let requestBody = req.body

        //validation for request body and its keys --
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: "invalid request parameters.plzz provide user details" })
            return
        }

        //Validate attributes --
        const { title, name, email, password, phone, address } = requestBody

        if (!isValid(title)) {
            res.status(400).send({ status: false, message: "Title is required" })
            return
        }
        if (!isValidTitle(title)) {
            return res.status(400).send({ status: false, message: "plzz enter valid title" })
        }

        if (!isValid(name)) {
            res.status(400).send({ status: false, message: "name is required" })
            return
        }

        if (!/^[A-Za-z\s]{1,}[\.]{0,1}[A-Za-z\s]{0,}$/.test(name)) {
            return res.status(400).send({ status: false, message: "Please enter valid user name." })
        }

        //Email Validation --
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "plzz enter email" })
        }
        const emailPattern = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})/

        if (!email.match(emailPattern)) {
            return res.status(400).send({ status: false, message: "This is not a valid email" })
        }

        email= email.toLowerCase().trim()
        const emailExt = await userModel.findOne({ email: email })
        if (emailExt) {
            return res.status(409).send({ status: false, message: "Email already exists" })
        }

        //Password Validations--
        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "plzz enter password" })
        }
        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "plzz enter valid password" })
        }


        //Phone Validations--
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "plzz enter mobile" })
        }

        if (!/^(\+\d{1,3}[- ]?)?\d{10}$/.test(phone)) {
            return res.status(400).send({ status: false, message: "Please enter valid 10 digit mobile number." })
        }

        const phoneExt = await userModel.findOne({ phone: phone })
        if (phoneExt) {
            return res.status(409).send({ status: false, message: "phone number already exists" })
        }

        //for address--
        const { street, city, pincode } = address

        if (!/^[a-zA-Z]+$/.test(city)) {
            return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
          }
        
        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).send({ status: false, message: "plz enter valid pincode" });
          }

        //Creation of data--
        let saveData = await userModel.create(requestBody)
        return res.status(201).send({ status: true, message: "success", data: saveData })
    }
    catch (err) {
        return res.status(500).send({ status: "error", message: err.message })
    }
}



//------------------------------------------------API-2 [/loginUser]-------------------------------------------------------//

const loginUser = async function (req, res) {
    try {
        const data = req.body;
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: "Please enter  mail and password" })

        const { email, password } = data

        //validation for login
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "please enter email" })
        }

        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.toLowerCase().trim())) {
            return res.status(400).send({ status: false, message: "please enter valid email address" })
        }
        //email = email.trim()

        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "please enter password" })
        }
        //pasword length should be min 8 and max 15 characters --
        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "plzz enter valid password" })
        }

        let user = await userModel.findOne({  email, password });
        if (!user)
            return res.status(404).send({ status: false, message: "Please enter email address and password" });

        let token = jwt.sign(
            {
                userId: user._id.toString(),
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60
            },
            "project-3"
        );

        res.setHeader("x-api-key", token);
        return res.status(200).send({ status: true, message: "token successfully Created", token: token });
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).send({ status: "error", message: err.message })
    }
}


module.exports.loginUser = loginUser;
module.exports.createUser = createUser;
