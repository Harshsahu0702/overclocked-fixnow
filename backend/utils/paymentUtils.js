/**
 * Generate a UPI Deep Link for direct partner payment
 * @param {string} upiId - Partner's UPI ID (e.g. bhaiya@upi)
 * @param {string} name - Partner's Name
 * @param {number} amount - Amount to be paid
 * @param {string} txnNote - Transaction Note (e.g. For Job ID)
 * @returns {string} - UPI Deep Link
 */
const generateUPILink = (upiId, name, amount, txnNote) => {
    const cleanName = encodeURIComponent(name);
    const cleanNote = encodeURIComponent(txnNote);
    return `upi://pay?pa=${upiId}&pn=${cleanName}&am=${amount}&tn=${cleanNote}&cu=INR`;
};

module.exports = { generateUPILink };
