const mongoose = require("mongoose");

async function main() {

   await mongoose.connect(process.env.DataBase_connection_string)
    
}

module.exports = main;