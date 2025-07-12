<?php
// Set the content type to JSON for all API responses
header('Content-Type: application/json');

// Start the session to manage user login state
session_start();

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', ''); // Default XAMPP password is empty
define('DB_NAME', 'spi_database');

// Create a new database connection
$conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Check for connection errors
if ($conn->connect_error) {
    // Stop execution and show an error message if the connection fails
    die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
}

// Function to safely get the user ID from the session
function get_user_id() {
    if (isset($_SESSION['user_id'])) {
        return $_SESSION['user_id'];
    }
    // If user is not logged in, send an authentication error and exit
    http_response_code(401); // Unauthorized
    echo json_encode(['error' => 'User not authenticated.']);
    exit();
}
?>