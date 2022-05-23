const userModel = require('../model/userModel')
const bookModel = require('../model/bookModel')
const reviewModel = require("../model/reviewsModel")
const mongoose = require("mongoose")
const moment = require("moment")
const aws= require("aws-sdk")
const multer=require("multer")



//-----------------------------------------------basic validations---------------------------------------------------//

//check for the requestbody cannot be empty --
const isValidRequestBody = function (value) {
  return Object.keys(value).length > 0
}

//validaton check for the type of Value --
const isValid = (value) => {
  if (typeof value == 'undefined' || value == null) return false;
  if (typeof value == 'string' && value.trim().length == 0) return false;
  return true
}

//check wheather objectId is valid or not--
const isValidObjectId = (value) => {
  return mongoose.isValidObjectId(value)
}

//aws connection
// aws.config.update({
//   accessKeyId: "AKIAY3L35MCRVFM24Q7U",
//   secretAccessKeyId: "qGG1HE0qRixcW1T1Wg1bv+08tQrIkFVyDFqSft4J",
//   region: "ap-south-1"
// })








//-------------------------------------------------------POST /books---------------------------------------------------------//


const createBook = async (req, res) => {

  try {
    const data = req.body
    //check for the requestbody cannot be empty --
    if (!isValidRequestBody(data)) {
      return res.status(400).send({ status: false, message: "plz enter some data" })
    }

    const { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = data

    // userId validation
    //validaton check for the type of Value --
    if (!isValid(userId)) {
      return res.status(400).send({ status: false, message: " userId is required" })

    }
    //check wheather objectId is valid or not--
    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: "plz enter valid userId" })
    }

    const Idcheck = await userModel.findOne({ userId: userId })
    if (!Idcheck) {
      return res.status(404).send({ status: false, message: "user not defined " })
    }

    // let tokenUserId = req["userId"]
    // if (tokenUserId != userId) {
    //   return res.status(401).send({ status: false, message: "you are unauthorized to access this data " })
    // }

    //   title validation
    //validaton check for the type of Value --
    if (!isValid(title)) {
      return res.status(400).send({ status: false, message: " title is required" })

    }
    const titleCheck = await bookModel.findOne({ title: title }).collation({ locale: 'en', strength: 2 })
    if (titleCheck) {
      return res.status(400).send({ status: false, message: " this title already exist " })
    }
    //   excerpt validation
    //validaton check for the type of Value --
    if (!isValid(excerpt)) {
      return res.status(400).send({ status: false, message: " excerpt is required" })
    }

    //   ISBN validation
    //validaton check for the type of Value --
    if (!isValid(ISBN)) {
      return res.status(400).send({ status: false, message: " ISBN is required" })

    }
    if (!/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/.test(ISBN)) {
      return res.status(400).send({ status: false, message: "  please enter valid ISBN " })
    }
    const ISBNCheck = await bookModel.findOne({ ISBN: ISBN })
    if (ISBNCheck) {
      return res.status(400).send({ status: false, message: " this ISBN already exist " })
    }

    //   category validation
//validaton check for the type of Value --
    if (!isValid(category)) {
      return res.status(400).send({ status: false, message: " category is required" })
    }
    // subcategory validation
//validaton check for the type of Value --
    if (!isValid(subcategory)) {
      return res.status(400).send({ status: false, message: " subcategory is required" })
    }
    if (Array.isArray(subcategory))
      if (subcategory.some(x => typeof x === "string" && x.trim().length === 0)) {
        return res.status(400).send({ status: false, message: " subcategory should not be empty or with white spaces" })
      }


    // date validation
    //validaton check for the type of Value --
    if (!isValid(releasedAt)) {
      return res.status(400).send({ status: false, message: " released date is required" })
    }

    //date validation by using moment--
    if (!moment(releasedAt, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).send({ status: false, message: " plz enter valid date" })

    }

    //

    // let files= req.files
    // if(files && files.length>0){
       
    //     let uploadedFileURL= await uploadFile( files[0] )
    //     // return res.status(201).send({msg: "file uploaded succesfully", data: uploadedFileURL})
    //     data["bookCover"]=uploadedFileURL
    // }
    // else{
    //     res.status(400).send({ msg: "No file found" })
    // }


    //data creation--
    const saveBook = await bookModel.create(data)
    return res.status(201).send({ status: true, message: 'Success', data: saveBook })

  }
  catch (err) {
    console.log(err.message)
    return res.status(500).send({ status: "error", msg: err.message })
  }

}


//--------------------------------------------------GET/books-------------------------------------------------------//

const getBook = async (req, res) => {
  try {
    let data = req.query

    //add filter--
    let filter = { isDeleted: false }

//check for the requestbody cannot be empty --
    if (isValidRequestBody(data)) {
      const { userId, category, subcategory } = data
      if (!(userId || category || subcategory)) {
        return res.status(400).send({ status: false, message: "plz enter valid filter" })

      }

//check wheather objectId is valid or not--
      if (isValidObjectId(userId)) {
        filter["userId"] = userId
      }


//validaton check for the type of Value --
      if (isValid(category)) {
        filter["category"] = category
      }

//validaton check for the type of Value --
      if (isValid(subcategory)) {
        const subcategoryData = subcategory.trim().split(",").map(x => x.trim())
        filter["subcategory"] = { $all: subcategoryData }
      }
    }

    //select response keys for res.body
    let books = await bookModel.find(filter).collation({ locale: 'en', strength: 2 })
      .select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 })
      .sort({ 'title': 1 })


    //validation when no book exist--
    if (!books.length)
      return res.status(404).send({ status: false, message: "No books Available." })

//data creation
    return res.status(200).send({ status: true, count: books.length, message: 'book list', data: books });
  }

  catch (error) {
    res.status(500).send({ status: 'error', Error: error.message })
  }
}




//-----------------------------------------------GET /books/:bookId------------------------------------------------------//


const getBooksByParams = async (req, res) => {
  try {
    const bookId = req.params.bookId

    // bookId validation
//check wheather objectId is valid or not--
    if (!isValidObjectId(bookId)) {
      return res.status(400).send({ status: false, message: "plz enter valid BookId" })
    }
    let checkBook = await bookModel.findOne({ _id: bookId, isDeleted: false }).lean()   //it(.lean()) returns plain js Objects except mongoose objects
    console.log(checkBook)

    if (!checkBook) {
      return res.status(404).send({ status: false, message: "book not found " })
    }
    // data from reviewModel
    let reviewCheck = await reviewModel.find({ bookId: bookId, isDeleted: false })

    // adding reviewsData key in bookData

    checkBook["reviewsData"] = reviewCheck


    return res.status(200).send({ status: true, message: 'Books list', data: checkBook })

  }
  catch (err) {
    console.log(err.message)
    return res.status(500).send({ status: "error", msg: err.message })
  }
}


//---------------------------------------------------------Put Api-------------------------------------------------------//


const updateBooks = async function (req, res) {
  try {
    let bookId = req.params.bookId
    let data = req.body
    let { title, excerpt, releasedAt, ISBN } = data
    let tokenUserId = req["userId"]

//check wheather objectId is valid or not--
    if (!isValidObjectId(bookId)) {
      return res.status(400).send({ status: false, message: "plz enter valid BookId" })
    }
    let book = await bookModel.findOne({ _id: bookId, isDeleted: false })
    if (!book) {
      return res.status(404).send({ status: false, message: "No Book Found" })
    }

    let userId = book.userId
    if (tokenUserId != userId) {
      return res.status(401).send({ status: false, message: "you are unauthorized to access this data " })
    }

    let x = (!(title || excerpt || releasedAt || ISBN))
 //check for the requestbody cannot be empty --
    if (!isValidRequestBody(data) || x) {
      return res.status(400).send({ status: false, message: "plz enter valid data for updation" })

    }

    if (title) {

      const titleCheck = await bookModel.findOne({ title: title.trim() }).collation({ locale: 'en', strength: 2 })  //collation uses to make title case insestive 
      if (titleCheck) {
        return res.status(400).send({ status: false, message: " this title already exist " })
      }
    }
    if (ISBN) {

      if (!/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/.test(ISBN)) {
        return res.status(400).send({ status: false, message: "  please enter valid ISBN " })
      }
      const ISBNCheck = await bookModel.findOne({ ISBN: ISBN })
      if (ISBNCheck) {
        return res.status(400).send({ status: false, message: " this ISBN already exist " })
      }
    }

    if (releasedAt)
      if (!moment(releasedAt, "YYYY-MM-DD", true).isValid()) {
        return res.status(400).send({ status: false, message: " plz enter valid date" })
      }

    let allbook = await bookModel.findByIdAndUpdate(
      { _id: bookId },
      { $set: { title: title, excerpt: excerpt, releasedAt: releasedAt, ISBN: ISBN } },
      { new: true })

    return res.status(200).send({ status: true, message: 'Success', data: allbook })
  }
  catch (err) {
    return res.status(500).send({ status: false, msg: err.message })
  }
}


//-----------------------------------------------DELETE /books/:bookId-------------------------------------------------//

const deleteBooks = async (req, res) => {

  try {
    let id = req.params.bookId

    const tokenUserId = req["userId"]

//check wheather objectId is valid or not--
    if (!isValidObjectId(id)) {

      return res.status(400).send({ status: false, message: "please enter valid id" })
    }

    const findBook = await bookModel.findOne({ _id: id, isDeleted: false })


    if (!findBook) {
      return res.status(404).send({ status: false, message: 'No book found' })
    }

    let userId = findBook.userId

    if (tokenUserId != userId) {
      return res.status(401).send({ status: false, message: "you are unauthorized to access this data " })
    }

    await bookModel.findOneAndUpdate({ _id: id },
      { $set: { isDeleted: true, deletedAt: Date.now() } },
      { new: true })
    return res.status(200).send({ status: true, message: "deleted sucessfully" })
  }
  catch (err) {
    console.log(err.message)
    return res.status(500).send({ status: "error", msg: err.message })
  }
}


module.exports = { createBook, getBook, getBooksByParams, updateBooks, deleteBooks }
