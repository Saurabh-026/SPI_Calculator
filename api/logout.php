
<?php
require_once '../config/database.php';

// Unset all session variables
$_SESSION = array();

// Destroy the session
if (session_destroy()) {
    http_response_code(200);
    echo json_encode(['success' => 'Logged out successfully.']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to log out.']);
}
?>