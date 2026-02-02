#!/usr/bin/env python3
"""
CODATS Security Scanner - Python Test File
Contains various security vulnerabilities for testing
"""

# 1. eval() usage - VULNERABILITY
user_input = "dangerous code"
result = eval(user_input)

# 2. exec() usage - VULNERABILITY  
exec("malicious code here")

# 3. Hardcoded API Key - VULNERABILITY
API_KEY = "sk-1234567890abcdefghijklmn"
SECRET_TOKEN = "hardcoded_secret_value_123"

# 4. pickle deserialization - VULNERABILITY
import pickle
user_data = pickle.loads(untrusted_data)

# 5. MD5 Hashing - VULNERABILITY
import hashlib
password_hash = hashlib.md5(password).digest()

# 6. os.system with user input - VULNERABILITY
import os
os.system(f"ls -la {user_directory}")

# 7. Insecure Random - VULNERABILITY
import random
token = random.randint(0, 10000)

# 8. SQL Injection - VULNERABILITY
def get_user(user_id):
    query = "SELECT * FROM users WHERE id = " + str(user_id)
    cursor.execute(query)
    return cursor.fetchall()

# 9. Default Credentials - VULNERABILITY
credentials = {
    "username": "admin",
    "password": "password123"
}

# 10. Hardcoded Connection String - VULNERABILITY
database_url = "postgresql://admin:admin123@localhost:5432/mydb"

print("Testing CODATS Python vulnerability detection")
