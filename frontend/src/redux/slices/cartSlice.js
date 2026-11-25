import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axiosInstance from "../../utils/axiosInstance"
import { toast } from "react-toastify"

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (product, { rejectWithValue }) => {
   try {
      const token = localStorage.getItem("token")
      if (!token) {
        if (!toast.isActive("session-expired")) {
          toast.error("Session expired Please login", {
            toastId: "session-expired",
            autoClose: 3000
          });
        }
        setTimeout(() => {
          window.location.replace("/user/login");
        }, 1000);
        return rejectWithValue("Session expired Please login");
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
      const response = await axiosInstance.get("/user/cart/getCart")
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
      const response = await axiosInstance.delete(`/user/cart/deleteItem/${_id}`)
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
      const response = await axiosInstance.patch(`/user/cart/increaseQuantity/${_id}`)
      return response?.data?.data || response?.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.response?.data || error.message);
    }
  }
);

export const decrement = createAsyncThunk(
  "cart/decrement",
  async ({ _id }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/user/cart/decreaseQuantity/${_id}`);
      return response?.data?.data || response?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.response?.data || error.message);
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
          if (!state.cart) {
            state.loading = true;
          }
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
        .addCase(increment.pending, (state, action) => {
          const itemId = action.meta.arg?._id;
          const items = state.cart?.items || (Array.isArray(state.cart) ? state.cart : null);
          if (items) {
            const item = items.find(i => (i._id?.toString() === itemId?.toString()));
            if (item && item.quantity < 5) {
              item._prevQuantity = item.quantity;
              item.quantity += 1;
            }
          }
        })
        .addCase(increment.fulfilled, (state, action) => {
          state.cart = action.payload?.data || action.payload;
        })
        .addCase(increment.rejected, (state, action) => {
          const itemId = action.meta.arg?._id;
          const items = state.cart?.items || (Array.isArray(state.cart) ? state.cart : null);
          if (items) {
            const item = items.find(i => (i._id?.toString() === itemId?.toString()));
            if (item && item._prevQuantity !== undefined) {
              item.quantity = item._prevQuantity;
              delete item._prevQuantity;
            }
          }
        })
        .addCase(decrement.pending, (state, action) => {
          const itemId = action.meta.arg?._id;
          const items = state.cart?.items || (Array.isArray(state.cart) ? state.cart : null);
          if (items) {
            const item = items.find(i => (i._id?.toString() === itemId?.toString()));
            if (item && item.quantity > 1) {
              item._prevQuantity = item.quantity;
              item.quantity -= 1;
            }
          }
        })
        .addCase(decrement.fulfilled, (state, action) => {
          state.cart = action.payload?.data || action.payload;
        })
        .addCase(decrement.rejected, (state, action) => {
          const itemId = action.meta.arg?._id;
          const items = state.cart?.items || (Array.isArray(state.cart) ? state.cart : null);
          if (items) {
            const item = items.find(i => (i._id?.toString() === itemId?.toString()));
            if (item && item._prevQuantity !== undefined) {
              item.quantity = item._prevQuantity;
              delete item._prevQuantity;
            }
          }
        });
    }
});

export default cartSlice.reducer;
