import {BrowserRouter,Routes,Route} from "react-router-dom"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/****************************USER SIDE********************************/

import Signup from "./pages/user/Signup/signup"
import Home from "./pages/user/Home/Home"
import Login from "./pages/user/Login/Login"
import VerifyOTP from "./pages/user/VerifyOTP/VerifyOTP"
import Profile from "./pages/user/Profile/Profile"
import ChangeEmail from "./pages/user/changeEmail/changeEmail"
import ChangePassword from "./pages/user/changePassword/changePassword"
import Adress from "./pages/user/Address/Address"
import ForgottPassword from "./pages/user/ForgottPassword/ForgottPassword"
import ResetPassword from "./pages/user/ResetPassword/ResetPassword"
import Men from "./pages/user/Men/Men"
import Women from "./pages/user/Women/Women";
import ProductDetails from "./pages/user/ProductDetails/ProductDetails";
import Cart from "./pages/user/Cart/Cart"
import Wishlist from "./pages/user/Wishlist/Wishlist";
import Checkout from "./pages/user/Checkout/Checkout"
import OrderSuccess from "./pages/user/OrderSucess/OrderSuccess";
import Orders from "./pages/user/Orders/Orders"
import TrackOrder from "./pages/user/TrackOrder/TrackOrder"

/****************************ADMIN SIDE********************************/

import AdminProtectedRoute from "./ProtectedRoute/AdminProtectedRoute"
import AdminLogin from "./pages/admin/AdminLogin/AdminLogin"
import CustomerManagement from "./pages/admin/CustomerManagement.jsx/CustomerManagement"
import CategoryManagement from "./pages/admin/CategoryManagement/CategoryManagement";
import ProductManagement from "./pages/admin/Product/ProductManagement";
import AddEditProduct from "./pages/admin/Product/AddEditProduct";
import BrandManagement from "./pages/admin/BrandManagement/BrandManagement";
import CouponManagement from "./pages/admin/CouponManagement/CouponManagement";
import OrderManagement from "./pages/admin/OrderManagement/OrderManagement";
import OrderDetails from "./pages/admin/OrderManagement/OrderDetails";

function App() {
  
  return(<>
    <BrowserRouter>

     <Routes>
      <Route path="/user/login" element={<Login/>}/>
      <Route path="/user/signup" element={<Signup/>}></Route>
      <Route path="/user/verifyOTP" element={<VerifyOTP/>}/>
      <Route path="/user/home" element={<Home/>}></Route>
      <Route path="/user/profile" element={<Profile/>}/>
      <Route path="/user/changeEmail" element={<ChangeEmail/>}/>
      <Route path="/user/changePassword" element={<ChangePassword/>}/>
      <Route path="/user/address" element={<Adress/>}/>
      <Route path="/user/forgottPassword" element={<ForgottPassword/>}/>
      <Route path="/user/resetPassword" element={<ResetPassword/>}></Route>
      <Route path="/user/men" element={<Men/>}/>
      <Route path="/user/women" element={<Women/>}/>
      <Route path="/user/productDetails" element={<ProductDetails/>}/>
      <Route path="/user/cart" element={<Cart />} />
      <Route path="/user/wishlist" element={<Wishlist />} />    
      <Route path="/user/checkout" element={<Checkout/>}/>
      <Route path="/user/checkout/orderSuccess" element={<OrderSuccess/>}/>
      <Route path="/user/orders" element={<Orders/>}/>
      <Route path="/user/trackOrder" element={<TrackOrder/>}/>
      </Routes>
  

    <Routes>
     <Route path="/admin/login" element={<AdminLogin/>}/>
     <Route path="/admin/customerManagement" element={<AdminProtectedRoute><CustomerManagement/></AdminProtectedRoute>}/>
     <Route path="/admin/categoryManagement" element={<AdminProtectedRoute><CategoryManagement/></AdminProtectedRoute>}/>
     <Route path="/admin/productManagement" element={<AdminProtectedRoute><ProductManagement/></AdminProtectedRoute>}/>
     <Route path="/admin/productManagement/addEditProduct" element={<AdminProtectedRoute><AddEditProduct/></AdminProtectedRoute>}/>
     <Route path="/admin/productManagement/addEditProduct/:id" element={<AdminProtectedRoute><AddEditProduct/></AdminProtectedRoute>}/>
     <Route path="/admin/brandManagement" element={<AdminProtectedRoute><BrandManagement/></AdminProtectedRoute>}/>
     <Route path="/admin/couponManagement" element={<AdminProtectedRoute><CouponManagement/></AdminProtectedRoute>}/>
     <Route path="/admin/orderManagement" element={<AdminProtectedRoute><OrderManagement/></AdminProtectedRoute>}/>
     <Route path="/admin/orderManagement/orderDetails" element={<AdminProtectedRoute><OrderDetails/></AdminProtectedRoute>}/>
     </Routes>
    </BrowserRouter>

      <ToastContainer position="top-right" autoClose={5000}
/>
   </>
  )
}

export default App


