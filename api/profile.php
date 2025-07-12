<?php

require_once '../config/database.php';

// Get the ID of the currently logged-in user
$user_id = get_user_id(); 

// Determine the request method (GET or POST)
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // --- HANDLE FETCHING USER DATA ---
    $stmt = $conn->prepare("SELECT id, name, username, email, branch, semester, photo_url, linkedin_url, github_url, theme, font FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if ($user) {
        echo json_encode($user);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(['error' => 'User not found.']);
    }
    $stmt->close();

} elseif ($method === 'POST') {
    // --- HANDLE ALL UPDATING OF USER DATA ---
    $input = json_decode(file_get_contents('php://input'), true);

    // Check if this is a full profile update from the profile page
    if (isset($input['name'])) {
        $sql = "UPDATE users SET name = ?, email = ?, branch = ?, semester = ?, photo_url = ?, linkedin_url = ?, github_url = ? WHERE id = ?";
        $types = 'sssisssi';
        $params = [
            $input['name'], $input['email'], $input['branch'], $input['semester'],
            $input['photo_url'], $input['linkedin_url'], $input['github_url'],
            $user_id
        ];
    } 
    // Otherwise, handle appearance updates (theme or font)
    else {
        $query_parts = [];
        $params_dynamic = [];
        $types = '';

        if (isset($input['theme'])) {
            $query_parts[] = 'theme = ?';
            $params_dynamic[] = $input['theme'];
            $types .= 's';
        }
        if (isset($input['font'])) {
            $query_parts[] = 'font = ?';
            $params_dynamic[] = $input['font'];
            $types .= 's';
        }

        if (empty($query_parts)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid data provided for update.']);
            exit();
        }

        $sql = "UPDATE users SET " . implode(', ', $query_parts) . " WHERE id = ?";
        $types .= 'i';
        $params = array_merge($params_dynamic, [$user_id]);
    }

    $stmt = $conn->prepare($sql);
    // Use call_user_func_array to bind a dynamic number of params, or the ... spread operator for PHP 7.4+
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(['success' => 'Profile updated successfully.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update profile.']);
    }
    $stmt->close();
}

$conn->close();
?>