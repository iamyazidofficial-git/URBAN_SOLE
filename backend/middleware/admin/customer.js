const express = require("express");

const router = express.Router();

const {
    getUsers,
    blockUser,
    unblockUser
} = require("../../controllers/admin/customer")

// Get users
router.get(
    "/users",
    getUsers
);


// Block user
router.patch(
    "/users/:id/block",
    blockUser
);


// Unblock user
router.patch(
    "/users/:id/unblock",
    unblockUser
);


module.exports = router;