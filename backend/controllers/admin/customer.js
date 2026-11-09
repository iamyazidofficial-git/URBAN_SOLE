const mongoose = require("mongoose")
const User = require("../../models/user")

/*--------------------------------------GET----------------------------------------*/

const getUsers = async (req, res) => {
  try {

    const search = req.query.search?.trim() || ""

    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.max(parseInt(req.query.limit) || 8, 1)
    const skip = (page - 1) * limit


    let query = {
      role: "user",
    }

    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ]
    }

    const totalUsers = await User.countDocuments(query)

    const users = await User.find(query)
      .select("-password")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)

    
    const totalPages = Math.ceil(totalUsers / limit)

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
      pagination: {
        currentPage: page,
        limit: limit,
        totalUsers: totalUsers,
        totalPages: totalPages,
      },
    })
  } catch (error) {
    console.log("Get Users Error:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    })
  }
}



/*--------------------------------------TOGGLE----------------------------------------*/

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      })
    }

    const user = await User.findOne({
      _id: id,
      role: "user",
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

   
    user.isBlocked = !user.isBlocked
    await user.save()

    return res.status(200).json({
      success: true,
      message: user.isBlocked
        ? "User blocked successfully"
        : "User unblocked successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
      },
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      success: false,
      message: "Failed to update user status"
    })
  }
}

module.exports = {
  getUsers,
  toggleUserStatus
}

