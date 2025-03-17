const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/user");

const updateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected for user update");

    // Update each user with the new role _id
    await User.updateOne(
      { email: "Manager@gmail.com" },
      { role: "67d2767fd2f76ad09be5e9ee" } // Replace with the new Manager role _id
    );
    await User.updateOne(
      { email: "Dev@example.com" },
      { role: "67d2767fd2f76ad09be5e9ef" } // Replace with the new Developer role _id
    );
    await User.updateOne(
      { email: "QA@example.com" },
      { role: "67d2767fd2f76ad09be5e9f0" } // Replace with the new QA role _id
    );

    console.log("Users updated with new role IDs");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error updating users:", error);
    mongoose.connection.close();
  }
};

updateUsers();