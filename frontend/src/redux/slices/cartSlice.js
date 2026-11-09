import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axiosInstance from "../../utils/axiosInstance"

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (product, { rejectWithValue }) => {
   try {
      const token = localStorage.getItem("token")
      if (!token) {
        window.location.href = "/user/login";
        return rejectWithValue("No token found, please login");
      }

      const response = await axiosInstance.post("/user/cart/addToCart", { product })
      return response.data?.data || response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
);

export const getCart = createAsyncThunk(
  "cart/getCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("http://localhost:2222/user/cart/getCart")
      return response?.data?.data || response?.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async ({ _id }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`http://localhost:2222/user/cart/deleteItem/${_id}`)
      return response?.data?.data || response?.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const increment = createAsyncThunk(
  "cart/increment",
  async ({ _id }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`http://localhost:2222/user/cart/increaseQuantity/${_id}`)
      return response?.data?.data || response?.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const decrement = createAsyncThunk(
  "cart/decrement",
  async ({ _id }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`http://localhost:2222/user/cart/decreaseQuantity/${_id}`);
      return response?.data?.data || response?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const cartSlice = createSlice({
    name: "cart",
    initialState: {
      cart: null,
      loading: false
    },
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(addToCart.fulfilled, (state, action) => {
           state.cart = action.payload;
        })
        .addCase(getCart.pending, (state) => {
          state.loading = true;
        })
        .addCase(getCart.fulfilled, (state, action) => {
  state.cart = action.payload?.data || action.payload;
  state.loading = false;
})
        .addCase(getCart.rejected, (state) => {
          state.loading = false;
        })
        .addCase(removeFromCart.fulfilled, (state, action) => {
          state.cart = action.payload?.data || action.payload;
        })
        .addCase(increment.fulfilled, (state, action) => {
          state.cart = action.payload?.data || action.payload;
        })
        .addCase(decrement.fulfilled, (state, action) => {
          state.cart = action.payload?.data || action.payload;
        });
    }
});

export default cartSlice.reducer;
