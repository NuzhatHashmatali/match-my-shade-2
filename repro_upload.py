import os, requests, glob, sys
files = glob.glob(r'.\**\*.png', recursive=True) + glob.glob(r'.\**\*.jpg', recursive=True) + glob.glob(r'.\**\*.jpeg', recursive=True)
files = [f for f in files if os.path.isfile(f)]
print('files', files[:10])
if not files:
    sys.exit(0)
path = files[0]
with open(path, 'rb') as fh:
    data = fh.read()
files_payload = {'image': (os.path.basename(path), data, 'image/jpeg' if path.lower().endswith(('.jpg','.jpeg')) else 'image/png')}
try:
    r = requests.post('http://localhost:3000/match', files=files_payload, timeout=60)
    print('status', r.status_code)
    print(r.text[:4000])
except Exception as e:
    print('ERR', e)
