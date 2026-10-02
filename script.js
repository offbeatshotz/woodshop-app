document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  const showPlannerBtn = document.getElementById('show-planner');
  const showIdentifierBtn = document.getElementById('show-identifier');
  const plannerSection = document.getElementById('planner-section');
  const identifierSection = document.getElementById('identifier-section');

  showPlannerBtn.addEventListener('click', () => {
    plannerSection.style.display = 'block';
    identifierSection.style.display = 'none';
  });

  showIdentifierBtn.addEventListener('click', () => {
    plannerSection.style.display = 'none';
    identifierSection.style.display = 'block';
  });

  // Project Planner
  const newProjectNameInput = document.getElementById('new-project-name');
  const addProjectButton = document.getElementById('add-project-button');
  const projectList = document.getElementById('project-list');
  const searchBar = document.getElementById('search-bar');
  const sortBy = document.getElementById('sort-by');

  let projects = JSON.parse(localStorage.getItem('projects')) || [];

  const saveProjects = () => {
    localStorage.setItem('projects', JSON.stringify(projects));
  };

  const renderProjects = () => {
    let filteredProjects = [...projects];
    const searchTerm = searchBar.value.toLowerCase();
    if (searchTerm) {
      filteredProjects = filteredProjects.filter(p => p.name.toLowerCase().includes(searchTerm));
    }
    const sortValue = sortBy.value;
    if (sortValue === 'name-asc') {
      filteredProjects.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortValue === 'name-desc') {
      filteredProjects.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortValue === 'status') {
      filteredProjects.sort((a, b) => a.status.localeCompare(b.status));
    }
    projectList.innerHTML = '';
    filteredProjects.forEach(project => {
      const li = document.createElement('li');
      li.className = 'project-item';
      li.innerHTML = `
        <span>${project.name}</span>
        <span class="status ${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
        <div>
          <button class="edit-button" data-id="${project.id}">Edit</button>
          <button class="delete-button" data-id="${project.id}">Delete</button>
        </div>
      `;
      projectList.appendChild(li);
    });
  };

  addProjectButton.addEventListener('click', () => {
    const name = newProjectNameInput.value.trim();
    if (name) {
      projects.push({ id: Date.now(), name, status: 'Planned' });
      newProjectNameInput.value = '';
      saveProjects();
      renderProjects();
    }
  });

  projectList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-button')) {
      const id = parseInt(e.target.dataset.id);
      projects = projects.filter(project => project.id !== id);
      saveProjects();
      renderProjects();
    }
    if (e.target.classList.contains('edit-button')) {
      const id = parseInt(e.target.dataset.id);
      const project = projects.find(p => p.id === id);
      const newName = prompt('Enter new name:', project.name);
      if (newName) {
        project.name = newName;
        const newStatus = prompt('Enter new status (Planned, In Progress, Completed):', project.status);
        if (newStatus) {
          project.status = newStatus;
          saveProjects();
          renderProjects();
        }
      }
    }
  });

  searchBar.addEventListener('input', renderProjects);
  sortBy.addEventListener('change', renderProjects);

  renderProjects();

  // Wood Identifier
  const imageUpload = document.getElementById('image-upload');
  const imagePreview = document.getElementById('image-preview');
  const predictionResult = document.getElementById('prediction-result');
  const startCameraButton = document.getElementById('start-camera-button');
  const snapPhotoButton = document.getElementById('snap-photo-button');
  const cameraFeed = document.getElementById('camera-feed');
  let model;

  mobilenet.load().then(m => {
    model = m;
    predictionResult.textContent = 'Model loaded!';
  });

  startCameraButton.addEventListener('click', async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        cameraFeed.srcObject = stream;
        cameraFeed.style.display = 'block';
        snapPhotoButton.style.display = 'block';
      } catch (error) {
        console.error('Error accessing camera:', error);
        predictionResult.textContent = 'Could not access camera. Please check permissions.';
      }
    }
  });

  snapPhotoButton.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = cameraFeed.videoWidth;
    canvas.height = cameraFeed.videoHeight;
    canvas.getContext('2d').drawImage(cameraFeed, 0, 0);
    imagePreview.src = canvas.toDataURL('image/png');
    imagePreview.style.display = 'block';
    cameraFeed.style.display = 'none';
    snapPhotoButton.style.display = 'none';
    if (cameraFeed.srcObject) {
      cameraFeed.srcObject.getTracks().forEach(track => track.stop());
    }
    predictionResult.textContent = 'Classifying...';
    model.classify(imagePreview).then(predictions => {
      displayPredictions(predictions);
    });
  });

  imageUpload.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
        predictionResult.textContent = 'Classifying...';
        model.classify(imagePreview).then(predictions => {
          displayPredictions(predictions);
        });
      };
      reader.readAsDataURL(file);
    }
  });

  function displayPredictions(predictions) {
    predictionResult.innerHTML = '';
    if (!predictions || predictions.length === 0) {
      predictionResult.textContent = 'Could not identify the wood.';
      return;
    }
    predictions.forEach(p => {
      const p_tag = document.createElement('p');
      p_tag.textContent = `${p.className} - ${Math.round(p.probability * 100)}%`;
      predictionResult.appendChild(p_tag);
    });
  }
});
