<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');

// Database connection details
$servername = "localhost"; // Your database host
$username = "root"; // Your database username
$password = ""; // Your database password (leave empty if no password)
$dbname = "spi_database"; // Your actual database name

// Create database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['message' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

$user_id = $_SESSION['user_id'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $title = $conn->real_escape_string($input['title'] ?? '');
    $role = $conn->real_escape_string($input['role'] ?? '');
    $duration = $conn->real_escape_string($input['duration'] ?? '');
    $description = $conn->real_escape_string($input['description'] ?? '');
    $link = $conn->real_escape_string($input['link'] ?? '');

    if (empty($title) || empty($role) || empty($duration) || empty($description)) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing required fields (title, role, duration, description).']);
        exit();
    }

    $stmt = $conn->prepare("INSERT INTO extracurricular_activities (user_id, title, role, duration, description, link) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssss", $user_id, $title, $role, $duration, $description, $link);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Activity added successfully!', 'id' => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to add activity: ' . $stmt->error]);
    }
    $stmt->close();

} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare("SELECT id, title, role, duration, description, link FROM extracurricular_activities WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $activities = [];
    while ($row = $result->fetch_assoc()) {
        $activities[] = $row;
    }
    echo json_encode($activities);
    $stmt->close();

} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
}

$conn->close();
?>