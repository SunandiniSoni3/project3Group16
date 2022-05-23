const mongoose = require('mongoose')

const ObjectId = mongoose.Schema.Types.ObjectId

const bookModel = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    bookCover:{
        type:String
    },
    excerpt: {
        type: String,
        required: true,
        trim: true
    },

    userId: {
        type: ObjectId,
        required: true,
        ref: 'user',
        trim: true
    },
    ISBN: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    subcategory: {
        type: [{type:String, trim: true}],
        required: true,
        trim: true

    },
    reviews: {
        type: Number,
        default: 0,
        required: true

    },
    deletedAt: {
        type: Date
        
    },
    isDeleted: {
        type: Boolean,
        default: false
    },

    releasedAt: {
        type: Date,
        required: true
    },


}, { timestamps: true })

module.exports = mongoose.model("Book", bookModel)