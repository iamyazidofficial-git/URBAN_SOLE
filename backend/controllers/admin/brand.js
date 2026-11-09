/*******************************************IMPORTS***********************************************/

const { STATUS_CODES } = require("../../constants/statusCodes")
const {addBrandService,getBrandService,editBrandService,toggleStatusService,deleteBrandService} = require("../../service/brand")

/*--------------------------------------ADD BRAND---------------------------------------*/

const addBrand = async (req, res) => {
    try {
        const result = await addBrandService(req.body)
        res.status(STATUS_CODES.OK).json({
            success: result.success,
            message: result.message
        })
    } catch (error) {
        console.log("Add Brand Controller:-", error?.message)
        res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: error?.message || "Something went wrong"
        })
    }
}





/*--------------------------------------GET BRAND---------------------------------------*/

const getBrand = async (req, res) => {
    try {
        const result = await getBrandService(req.query)
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Brands Fetched Successfully",
            data: result.data,
            totalPages: result.totalPages,
            totalBrands: result.totalBrands
        })
    } catch (error) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: error?.message || "Something went wrong"
        })
    }
}






/*--------------------------------------EDIT BRAND---------------------------------------*/

const editBrand = async (req, res) => {
    try {
        const result = await editBrandService(req.body, req.params)
        return res.status(STATUS_CODES.OK).json({
            success: result.success,
            message: result.message
        })
    } catch (error) {
        console.log("EditBrandController:-", error)
        res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: error?.message || "Failed to edit"
        })
    }
}





/*--------------------------------------TOGGLE BRAND---------------------------------------*/

const toggleStatus = async (req, res) => {
    try {
        const result = await toggleStatusService(req.params)
        return res.status(STATUS_CODES.OK).json({
            success: result?.success,
            message: result?.message
        })
    } catch (error) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: error?.message || "Failed to toggle"
        })
    }
}






/*--------------------------------------DELETE BRAND---------------------------------------*/

const deleteBrand = async (req, res) => {
    try {
        const result = await deleteBrandService(req.params)
        return res.status(STATUS_CODES.OK).json({
            success: result.success,
            message: result.message
        })
    } catch (error) {
        console.log("Delete Brand", error?.message)
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: error?.message
        })
    }
}



module.exports = {
    addBrand,
    getBrand,
    editBrand,
    toggleStatus,
    deleteBrand
}
