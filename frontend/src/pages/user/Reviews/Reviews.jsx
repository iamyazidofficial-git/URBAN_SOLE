import React, { useState, useEffect } from 'react';
import './Reviews.css';
import Navbar from '../../../partials/navbar/navbar';
import UserFooter from '../../../partials/UserFooter/UserFooter';
import axiosInstance from '../../../utils/axiosInstance';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from '../../../partials/Loader/Loader';
import { Link } from 'react-router-dom';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Custom Modal States
    const [showModal, setShowModal] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/user/review/getReview');
            if (response?.data?.success) {
                setReviews(response.data.data);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    // Open Delete Confirmation Modal
    const openDeleteModal = (reviewId) => {
        setReviewToDelete(reviewId);
        setShowModal(true);
    };

    // Confirm Delete and call Backend
    const confirmDeleteReview = async () => {
        if (!reviewToDelete) return;

        try {
            setLoading(true);
            setShowModal(false);
            const response = await axiosInstance.delete(`/user/review/deleteReview/${reviewToDelete}`);
            if (response?.data?.success) {
                toast.success("Review deleted successfully");
                setReviews(reviews.filter(rev => rev._id !== reviewToDelete));
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to delete review");
        } finally {
            setLoading(false);
            setReviewToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowModal(false);
        setReviewToDelete(null);
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={`mr-star ${i <= rating ? 'filled' : ''}`}>
                    {i <= rating ? '★' : '☆'}
                </span>
            );
        }
        return stars;
    };

    return (
        <div className="mr-page-wrapper">
            <Navbar />
            <ToastContainer />
            {loading && <Loader />}

            <div className="mr-main-content">
                {/* Breadcrumb */}
                <div className="mr-breadcrumb">
                    <Link to="/">Home</Link> &gt; <Link to="/user/account">Account</Link> &gt; <span>My Reviews</span>
                </div>

                {/* Main Heading */}
                <h1 className="mr-main-title">MY REVIEWS</h1>

                {/* Reviews Container */}
                <div className="mr-reviews-list">
                    {reviews.length === 0 && !loading ? (
                        <p className="mr-no-reviews">No reviews found.</p>
                    ) : (
                        reviews.map((rev) => (
                            <div key={rev._id} className="mr-review-card">
                                <div className="mr-card-top-row">
                                    <div className="mr-prod-img-box">
                                        <img src={rev.productImage} alt={rev.productName} />
                                    </div>
                                    <div className="mr-prod-info">
                                        <h3 className="mr-prod-name">{rev.productName}</h3>
                                        <p className="mr-purchased-date">
                                            Purchased: {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <button 
                                        className="mr-delete-btn" 
                                        onClick={() => openDeleteModal(rev._id)}
                                    >
                                        DELETE
                                    </button>
                                </div>

                                <div className="mr-divider"></div>

                                <div className="mr-review-content-section">
                                    <div className="mr-stars-row">
                                        {renderStars(rev.rating)}
                                    </div>
                                    <h4 className="mr-review-title">{rev.title}</h4>
                                    <p className="mr-review-comment">{rev.comment}</p>
                                    <p className="mr-reviewed-date">
                                        Reviewed on {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Custom Confirmation Modal */}
            {showModal && (
                <div className="mr-modal-overlay">
                    <div className="mr-modal-box">
                        <h3>Delete Review</h3>
                        <p>Are you sure you want to delete this review? This action cannot be undone.</p>
                        <div className="mr-modal-actions">
                            <button className="mr-modal-cancel-btn" onClick={cancelDelete}>
                                CANCEL
                            </button>
                            <button className="mr-modal-confirm-btn" onClick={confirmDeleteReview}>
                                DELETE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <UserFooter />
        </div>
    );
};

export default Reviews;