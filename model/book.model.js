import mongoose from "mongoose";

const bookSchema = mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    Image: String,
    title: String, // Fixed typo: was "titile"
})

const Book = mongoose.model("Book", bookSchema);
export default Book;
