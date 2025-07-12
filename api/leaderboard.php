<?php
require_once '../config/database.php';

// SPI Calculation Weights (mirrored from frontend for consistency)
$spi_weights = ['academics' => 0.4, 'skills' => 0.35, 'projects' => 0.25];
$skill_base_weights = ['JavaScript'=>20,'React'=>25,'DSA'=>30,'Python'=>20,'ML'=>35,'Node.js'=>20,'SQL'=>15,'AutoCAD'=>25,'SolidWorks'=>25,'Java'=>15,'C++'=>15,'Figma'=>15,'Photoshop'=>10];

/**
 * Calculates the complete SPI for a given user.
 * @param int $user_id The user's ID.
 * @param mysqli $conn The database connection object.
 * @return float The calculated total SPI score.
 */
function calculateSPI($user_id, $conn) {
    global $spi_weights, $skill_base_weights;

    // 1. Calculate Academic Score
    $acad_stmt = $conn->prepare("SELECT AVG(sgpa) as cgpa FROM academics WHERE user_id = ?");
    $acad_stmt->bind_param("i", $user_id);
    $acad_stmt->execute();
    $acad_result = $acad_stmt->get_result()->fetch_assoc();
    $cgpa = $acad_result['cgpa'] ?? 0;
    $academic_score = $cgpa * 10; // Scale CGPA to a 100-point score
    $acad_stmt->close();

    // 2. Calculate Skill Score
    $skill_score = 0;
    $skill_stmt = $conn->prepare("SELECT name FROM skills WHERE user_id = ?");
    $skill_stmt->bind_param("i", $user_id);
    $skill_stmt->execute();
    $skill_result = $skill_stmt->get_result();
    while ($skill = $skill_result->fetch_assoc()) {
        $skill_score += $skill_base_weights[$skill['name']] ?? 10; // Default to 10 if skill not in weights
    }
    $skill_score = min(100, $skill_score); // Cap score at 100
    $skill_stmt->close();
    
    // 3. Calculate Project Score
    $project_score = 0;
    $proj_stmt = $conn->prepare("SELECT type FROM projects WHERE user_id = ?");
    $proj_stmt->bind_param("i", $user_id);
    $proj_stmt->execute();
    $proj_result = $proj_stmt->get_result();
    while ($project = $proj_result->fetch_assoc()) {
        $project_score += ($project['type'] === 'Internship') ? 15 : 10;
    }
    $project_score = min(100, $project_score); // Cap score at 100
    $proj_stmt->close();

    // 4. Calculate Final SPI
    $total_spi = ($academic_score * $spi_weights['academics']) + 
                 ($skill_score * $spi_weights['skills']) + 
                 ($project_score * $spi_weights['projects']);
    
    return min(100, $total_spi);
}

// --- Main script execution ---
$users_stmt = $conn->prepare("SELECT id, name, branch, photo_url FROM users");
$users_stmt->execute();
$users_result = $users_stmt->get_result();
$ranked_users = [];

while ($user = $users_result->fetch_assoc()) {
    $user['spi'] = calculateSPI($user['id'], $conn);
    $ranked_users[] = $user;
}
$users_stmt->close();
$conn->close();

// Sort users by SPI in descending order
usort($ranked_users, function($a, $b) {
    return $b['spi'] <=> $a['spi'];
});

echo json_encode($ranked_users);
?>