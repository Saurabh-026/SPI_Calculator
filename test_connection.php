<?php
// Define the database credentials directly for this test
$db_host = 'localhost';
$db_user = 'root';
$db_pass = ''; // Default XAMPP password is empty
$db_name = 'spi_database';

// Attempt to connect to the database
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

// Check the connection
if ($conn->connect_error) {
    // If it fails, show a detailed error message
    die("Connection FAILED: " . $conn->connect_error);
}

// If it succeeds, show a success message
echo "<h1>Database Connection SUCCESSFUL!</h1>";
echo "<p>PHP was able to connect to the MySQL database '{$db_name}' successfully.</p>";

// Close the connection
$conn->close();
?>