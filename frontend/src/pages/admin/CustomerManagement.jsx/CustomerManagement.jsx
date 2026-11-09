import { useEffect, useState } from "react"
import axiosInstance from "../../../utils/axiosInstance"
import "./CustomerManagement.css"
import AdminSidebar from "../../../partials/AdminSidebar/AdminSidebar"

const CustomerManagement = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState([])

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [loading, setLoading] = useState(false)

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  //-------------------GET USERS-------------------

  const fetchCustomers = async (page = 1, search = "") => {
    try {
      setLoading(true);

      const response = await axiosInstance.get(
        "http://localhost:2222/admin/customer/users",
        {
          params: {
            page: page,
            limit: 8,
            search: search,
          },
        }
      );

      const users = response.data.users || []

      const formattedUsers = users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        avatar:
          user.profileImage ||
          user.name?.charAt(0).toUpperCase() ||
          "U",
        joinedDate: new Date(user.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        totalOrders: 0,
        status: user.isBlocked ? "Blocked" : "Active",
      }));

      setCustomers(formattedUsers);
      setCurrentPage(response.data.pagination?.currentPage || 1);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalUsers(response.data.pagination?.totalUsers || 0);
    } catch (error) {
      console.log(
        "FETCH CUSTOMERS ERROR:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  //-------------------FETCH CALL-------------------

  useEffect(() => {
    fetchCustomers(1, "")
  }, []);

  //-------------------SERCH-------------------

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchCustomers(1, value);
  };

  //-------------------PAGE-------------------

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchCustomers(page, searchTerm);
  };

  //-------------------OPEN CONFRIMATION-------------------

  const handleOpenStatusModal = (customer) => {
    setSelectedCustomer(customer)
    setShowStatusModal(true)
  }

  //-------------------CLOSE BLOCK MODAL-------------------

  const handleCloseStatusModal = () => {
    if (updatingStatus) return
    setShowStatusModal(false)
    setSelectedCustomer(null)
  }

//-------------------CONFRIM BLOCK-------------------

  const confirmToggleStatus = async () => {
    if (!selectedCustomer) return

    try {
      setUpdatingStatus(true)

      const response = await axiosInstance.patch(
        `http://localhost:2222/admin/customer/toggle/${selectedCustomer.id}`,
        {}
      )

      console.log("STATUS UPDATE:", response.data)

      await fetchCustomers(currentPage, searchTerm)

      handleCloseStatusModal()
    } catch (error) {
      console.log(
        "TOGGLE STATUS ERROR:",
        error.response?.data || error.message
      )
    } finally {
      setUpdatingStatus(false)
    }
  }

  const startIndex = totalUsers === 0 ? 0 : (currentPage - 1) * 8 + 1;
  const endIndex = Math.min(currentPage * 8, totalUsers);

  return (
    <>
      <AdminSidebar />

      <div className="customer-management-container">
        {/* HEADER + SEARCH */}
        <div className="cm-header-section">
          <div className="cm-title-area">
            <h1 className="cm-title">CUSTOMER MANAGEMENT</h1>
            <p className="cm-subtitle">
              Manage and view registered customers.
            </p>
          </div>

          <div className="cm-search-wrapper">
            <span className="material-symbols-outlined cm-search-icon">
              search
            </span>
            <input
              type="text"
              className="cm-search-input"
              placeholder="Search by customer name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="cm-table-card">
          <div className="cm-table-responsive">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>CUSTOMER</th>
                  <th>EMAIL</th>
                  <th>JOINED DATE</th>
                  <th>TOTAL ORDERS</th>
                  <th>STATUS</th>
                  <th>BLOCK</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: "center", padding: "30px" }}
                    >
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: "center", padding: "30px" }}
                    >
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="cm-user-cell">
                        {customer.avatar.startsWith("http") ? (
                          <img
                            src={customer.avatar}
                            alt={customer.name}
                            className="cm-avatar-img"
                          />
                        ) : (
                          <div className="cm-avatar-text">
                            {customer.avatar}
                          </div>
                        )}
                        <span className="cm-user-name">{customer.name}</span>
                      </td>

                      <td className="cm-email-cell">{customer.email}</td>
                      <td className="cm-date-cell">{customer.joinedDate}</td>
                      <td className="cm-orders-cell">{customer.totalOrders}</td>

                      <td>
                        <span
                          className={`cm-status-badge ${
                            customer.status === "Active" ? "active" : "blocked"
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>

                      <td>
                        <label className="cm-toggle-switch">
                          <input
                            type="checkbox"
                            checked={customer.status === "Active"}
                            onChange={() => handleOpenStatusModal(customer)}
                          />
                          <span className="cm-toggle-slider"></span>
                        </label>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="cm-pagination-footer">
            <p className="cm-showing-text">
              Showing <strong>{startIndex}</strong> to{" "}
              <strong>{endIndex}</strong> of <strong>{totalUsers}</strong>{" "}
              customers
            </p>

            <div className="cm-pagination">
              <button
                className="cm-page-btn arrow-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                &lt;
              </button>

              {totalPages > 0 &&
                Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`cm-page-btn ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  )
                )}

              <button
                className="cm-page-btn arrow-btn"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

        <footer className="cm-footer">
          © 2024 Urban Sole Admin Panel. Internal Use Only.
        </footer>
      </div>

      {/* ================= BLOCK / UNBLOCK CONFIRMATION MODAL ================= */}
      {showStatusModal && selectedCustomer && (
        <div className="modal-overlay" onClick={handleCloseStatusModal}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                Confirm {selectedCustomer.status === "Active" ? "Block" : "Unblock"}
              </h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to{" "}
                <strong>
                  {selectedCustomer.status === "Active" ? "block" : "unblock"}
                </strong>{" "}
                <strong>{selectedCustomer.name}</strong> (
                {selectedCustomer.email})?
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn cancel-btn"
                onClick={handleCloseStatusModal}
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                className={`modal-btn ${
                  selectedCustomer.status === "Active"
                    ? "danger-btn"
                    : "confirm-btn"
                }`}
                onClick={confirmToggleStatus}
                disabled={updatingStatus}
              >
                {updatingStatus
                  ? "Updating..."
                  : selectedCustomer.status === "Active"
                  ? "Block Customer"
                  : "Unblock Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default CustomerManagement;