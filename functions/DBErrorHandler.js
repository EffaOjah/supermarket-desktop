function handleDatabaseError(errCode) {
    switch (errCode) {
        case 'SQLITE_CONSTRAINT_UNIQUE':
            return "This record already exists. Please use a different value.";
        case 'SQLITE_CONSTRAINT_NOTNULL':
            return "A required field is missing. Please fill in all fields.";
        case 'SQLITE_CONSTRAINT_FOREIGNKEY':
            return "Invalid reference. The related record does not exist.";
        case 'SQLITE_MISMATCH':
            return "Invalid data type. Please check your input.";
        case 'SQLITE_BUSY':
            return "Database is currently busy. Please try again later.";
        case 'SQLITE_READONLY':
            return "Database is in read-only mode. You cannot modify data.";
        case 'SQLITE_FULL':
            return "Database storage is full. Please free up space.";
        case 'SQLITE_CANTOPEN':
            return "Database could not be accessed. Please check the file path.";
        case 'SQLITE_NOTADB':
            return "Invalid database file. It might be corrupted.";
        case 'SQLITE_ERROR':
            return "An error occurred while processing your request.";
        default:
            return null;
    }
}

export default handleDatabaseError;