import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axiosInstance from "../../utils/axiosInstance"

export const fetchWishlist = createAsyncThunk(
    "wishlist/fetchWishlist", 
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/user/wishlist/getWishlist")
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message)
        }
    }
)

export const addToWishlist = createAsyncThunk(
    "wishlist/addToWishlist", 
    async (productId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                window.location.href = "/user/login"
                return rejectWithValue("No token found, please login")
            }
            
            const response = await axiosInstance.post("/user/wishlist/addToWishlist", { productId })
            return response.data
        } catch (error) {
            // ബാക്കെൻഡിൽ നിന്നുള്ള 400 എറർ മെസ്സേജ് ഇവിടെ ക്യാച്ച് ചെയ്ത് റിജക്റ്റ് ചെയ്യുന്നു
            return rejectWithValue(error.response?.data || error.message)
        }
    }
)

export const removeFromWishlist = createAsyncThunk(
    "wishlist/removeFromWishlist", 
    async (productId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/user/wishlist/removeFromWishlist", { productId })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message)
        }
    }
)

const wishlistSlice = createSlice({
    name: "wishlist",
    initialState: {
        wishlist: null,
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchWishlist.fulfilled, (state, action) => {
                state.wishlist = action.payload?.data
                state.loading = false
            })
            .addCase(addToWishlist.fulfilled, (state, action) => {
                state.wishlist = action.payload?.data
            })
            .addCase(removeFromWishlist.fulfilled, (state, action) => {
                state.wishlist = action.payload?.data
            })
    },
})

export default wishlistSlice.reducer