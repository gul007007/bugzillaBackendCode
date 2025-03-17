const mongoose = require("mongoose");
require("dotenv").config();
const Role = require("../models/role");

const seedRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const roles = [
      {
        name: "Manager",
        permissions: [
          "create_project",
          "assign_users",
          "view_all_projects",
          "view_bugs",
          "close_bug",
          "filter_projects",
          "edit_project",
          "delete_project",
          "delete_bug",
          "view_assigned_projects",
          "lock_bug",
        ],
      },
      {
        name: "Developer",
        permissions: [
          "view_assigned_projects",
          "view_assigned_bugs",
          "update_bug_status",
          "post_to_qa",
        ],
      },
      {
        name: "QA",
        permissions: [
          "view_assigned_projects",
          "create_bug",
          "lock_bug",
          "done_from_qa",
        ],
      },
    ];

    // Clear existing roles
    await Role.deleteMany({});
    console.log("Cleared existing roles");

    // Insert updated roles
    await Role.insertMany(roles);
    console.log(
      "Logging: Yes roles have seeded successfully with updated permissions."
    );

    mongoose.connection.close();
  } catch (error) {
    console.error("Seeding error:", error);
    mongoose.connection.close();
  }
};

seedRoles();
