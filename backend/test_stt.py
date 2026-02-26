import requests
import os

files = os.listdir('uploads')
if not files:
    print("No files to test")
    exit()

filename = os.path.join('uploads', files[0])
print(f"Testing with {filename}")

with open(filename, 'rb') as f:
    response = requests.post('http://127.0.0.1:8000/api/stt', files={'audio': f})
    
print(response.status_code)
print(response.json())
