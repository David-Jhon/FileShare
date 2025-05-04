function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const error = document.getElementById('error');

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        window.location.href = '/home';
      } else {
        error.textContent = data.error || 'Login failed';
      }
    })
    .catch(err => {
      error.textContent = 'Error: ' + err.message;
    });
}

function logout() {
  fetch('/api/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        window.location.href = '/login';
      }
    });
}

function fetchFiles() {
  fetch('/api/files')
    .then(response => response.json())
    .then(files => {
      const fileList = document.getElementById('fileList');
      fileList.innerHTML = '';
      files.forEach(file => {
        const li = document.createElement('li');
        li.innerHTML = `
          <a href="${file.filepath}" download>${file.filename}</a>
          <button class="delete-btn" onclick="deleteFile(${file.id}, this)">Delete</button>
        `;
        fileList.appendChild(li);
      });
    });
}

function uploadSelectedFile() {
  const fileInput = document.getElementById('fileInput');
  const expireSelect = document.getElementById('expireSelect');
  const uploadBtn = document.querySelector('.upload-btn');
  const progressContainer = document.querySelector('.progress-container');
  const progressBar = document.getElementById('uploadProgress');
  const progressText = document.getElementById('progressText');

  uploadBtn.disabled = true;
  progressContainer.classList.add('visible');
  progressBar.value = 0;
  progressText.textContent = '0%';

  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a file');
    uploadBtn.disabled = false;
    progressContainer.classList.remove('visible');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('expires', expireSelect.value);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload', true);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percentComplete = Math.round((event.loaded / event.total) * 100);
      progressBar.value = percentComplete;
      progressText.textContent = `${percentComplete}%`;
    }
  };

  xhr.onload = () => {
    const data = JSON.parse(xhr.responseText);
    if (xhr.status === 200 && data.message) {
      fetchFiles();
      fileInput.value = '';
      document.getElementById('fileName').textContent = 'No file selected';
    } else {
      alert(data.error || 'Upload failed');
    }
    uploadBtn.disabled = false;
    progressContainer.classList.remove('visible');
  };

  xhr.onerror = () => {
    alert('Upload failed due to a network error');
    uploadBtn.disabled = false;
    progressContainer.classList.remove('visible');
  };

  xhr.send(formData);
}

function deleteFile(id, button) {
  if (!confirm('Are you sure you want to delete this file?')) {
    return;
  }
  
  fetch(`/api/files/${id}`, {
    method: 'DELETE'
  })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        button.parentElement.remove();
      } else {
        alert(data.error || 'Deletion failed');
      }
    });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('home')) {
    fetch('/api/files').then(response => {
      if (response.status === 401) {
        window.location.href = '/login';
      } else {
        fetchFiles();
        // Display username
        fetch('/api/login').then(response => response.json()).then(data => {
          if (data.username) {
            document.getElementById('username').textContent = `Welcome, ${data.username}`;
          }
        });
      }
    });

    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('dragover', e => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      document.getElementById('fileInput').files = e.dataTransfer.files;
      document.getElementById('fileName').textContent = e.dataTransfer.files[0]?.name || 'No file selected';
    });

    document.getElementById('fileInput').addEventListener('change', () => {
      document.getElementById('fileName').textContent = document.getElementById('fileInput').files[0]?.name || 'No file selected';
    });
  }
});