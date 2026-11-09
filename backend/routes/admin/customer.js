const express = require("express");
const router = express.Router();

const {
    getUsers,
    toggleUserStatus
} = require("../../controllers/admin/customer");

router.get("/users",getUsers);
router.patch("/toggle/:id",toggleUserStatus);

module.exports = router;