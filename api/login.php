<?php
require_once '../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['username']) || !isset($input['password'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Username and password are required.']);
    exit();
}

$username = $input['username'];
$password = $input['password'];

// Prepare statement to find the user
$stmt = $conn->prepare("SELECT id, password FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();

    // Verify the password
    if (password_verify($password, $user['password'])) {
        // Password is correct, create session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $username;
        
        http_response_code(200);
        echo json_encode(['success' => 'Login successful.']);
    } else {
        // Incorrect password
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password.']);
    }
} else {
    // User not found
    http_response_code(401);
    echo json_encode(['error' => 'Invalid username or password.']);
}

$stmt->close();
$conn->close();
?>