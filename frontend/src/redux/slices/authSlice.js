import {createSlice} from "@reduxjs/toolkit"
const token = localStorage.getItem("token")

const authSlice=createSlice({
    name:"authSlice",
   initialState: {
    token: token || null,
    isAuthenticated: !!token
    },
    reducers:{
     signIn:(state,action)=>{
        const token=action.payload.token
        state.token=token
        state.isAuthenticated=true
        if(action.payload.role=="user"){
         localStorage.setItem("token",token)
        }
        else{
         localStorage.setItem("adminToken",token)
        }
     },
      logoutUser: (state,action) => {
      state.isAuthenticated = false

      if(action.payload.role=="user"){
         state.token = null
         localStorage.removeItem("token")
      }
      else{
        localStorage.removeItem("adminToken")
      }
    }
    }
})



export default authSlice.reducer
export const {logoutUser,signIn}=authSlice.actions