const mongoose = require("mongoose");
require("dotenv").config();
const Role = require("../models/role");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const roles = await Role.find();
    console.log("Roles in database:", roles);
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error("Error fetching roles:", error);
    mongoose.connection.close();
  });