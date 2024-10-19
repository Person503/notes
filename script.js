// Load notes from GitHub on page load
document.addEventListener('DOMContentLoaded', loadNotes);

const makeNoteBox = document.getElementById('makeNoteBox');
const noteForm = document.getElementById('noteForm');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('modal');
const modalNoteTitle = document.getElementById('modalNoteTitle');
const modalNoteContent = document.getElementById('modalNoteContent');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
const editNoteBtn = document.getElementById('editNoteBtn');

let currentNoteIndex = null; // To keep track of the current note being edited

// Show the note form on hover
makeNoteBox.onmouseenter = function() {
    noteForm.style.display = 'flex'; // Show the note form
};

// Hide the note form when not hovering
makeNoteBox.onmouseleave = function() {
    noteForm.style.display = 'none'; // Hide the note form
};

// Fetch notes from GitHub
async function fetchNotes() {
    const response = await fetch('https://api.github.com/repos/person503/notes/contents/notes.json', {
        headers: {
            'Authorization': 'SHA256:HlDGefC3Q1+VuQxJnQaReLiFgGuq35zzeXuC0HeW1q0='
        }
    });
    
    if (response.ok) {
        const data = await response.json();
        const content = atob(data.content); // Decode base64 content
        return JSON.parse(content); // Parse JSON
    } else {
        console.error('Error fetching notes:', response.statusText);
        return [];
    }
}

// Save notes to GitHub
async function saveNotes(notes) {
    const content = btoa(JSON.stringify(notes)); // Encode to base64
    const response = await fetch('https://api.github.com/repos/person503/notes/contents/notes.json', {
        method: 'PUT',
        headers: {
            'Authorization': 'SHA256:HlDGefC3Q1+VuQxJnQaReLiFgGuq35zzeXuC0HeW1q0=',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'Update notes',
            content: content,
            sha: await getCurrentFileSHA() // Get the current SHA for the file
        })
    });

    if (response.ok) {
        console.log('Notes saved successfully');
    } else {
        console.error('Error saving notes:', response.statusText);
    }
}

// Get the current SHA of notes.json
async function getCurrentFileSHA() {
    const response = await fetch('https://api.github.com/repos/person503/notes/contents/notes.json', {
        headers: {
            'Authorization': 'SHA256:HlDGefC3Q1+VuQxJnQaReLiFgGuq35zzeXuC0HeW1q0='
        }
    });
    const data = await response.json();
    return data.sha; // Return the current SHA
}

// Save note functionality
saveNoteBtn.onclick = async function() {
    const noteFlair = document.getElementById('noteFlair').value; // Get selected flair
    const noteTitle = document.getElementById('noteTitle').value.trim();
    const noteContent = document.getElementById('noteContent').value.trim();

    if (noteTitle && noteContent) {
        const newNote = { flair: noteFlair, title: noteTitle, content: noteContent };
        const notes = await fetchNotes(); // Fetch existing notes
        notes.push(newNote); // Add the new note
        await saveNotes(notes); // Save updated notes

        // Reset the form
        document.getElementById('noteFlair').value = 'misc'; // Reset flair to default
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        loadNotes(); // Reload notes to display the new note
    }
};

// Load notes from GitHub
async function loadNotes() {
    const notes = await fetchNotes(); // Fetch notes from GitHub
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = ''; // Clear existing notes

    notes.forEach(note => {
        const noteBox = document.createElement('div');
        noteBox.className = 'note-box';

        const flairElement = document.createElement('span'); // Create flair element
        flairElement.className = 'note-flair ' + note.flair; // Add flair class based on saved data
        flairElement.textContent = note.flair; // Set flair text

        const titleElement = document.createElement('p');
        titleElement.className = 'note-title';
        titleElement.textContent = note.title;

        const previewElement = document.createElement('p');
        previewElement.className = 'note-preview';
        previewElement.textContent = note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content;

        noteBox.appendChild(flairElement); // Append flair to note box
        noteBox.appendChild(titleElement);
        noteBox.appendChild(previewElement);
        notesList.appendChild(noteBox);

        // Click event to show full note in modal
        noteBox.onclick = function() {
            showFullNote(note.title, note.content, notesList.children.length - 1, note.flair); // Pass the index of the note
        };
    });
}

// Function to show full note in modal
function showFullNote(title, content, index, flair) {
    modalNoteTitle.textContent = title;
    modalNoteContent.textContent = content;
    modal.style.display = 'flex'; // Show modal

    // Set up edit functionality
    editNoteBtn.onclick = async function() {
        // Replace title and content with input fields
        const titleInput = document.createElement('input');
        titleInput.value = title; // Set title in input
        titleInput.className = 'note-title-input';

        const contentInput = document.createElement('textarea');
        contentInput.value = content; // Set content in textarea
        contentInput.className = 'note-content-input';

        // Create flair selector
        const flairSelect = document.createElement('select');
        flairSelect.id = 'editNoteFlair';
        const flairs = ['misc', 'school', 'work', 'home'];
        flairs.forEach(flairOption => {
            const option = document.createElement('option');
            option.value = flairOption;
            option.textContent = flairOption.charAt(0).toUpperCase() + flairOption.slice(1);
            if (flairOption === flair) {
                option.selected = true; // Set the current flair as selected
            }
            flairSelect.appendChild(option);
        });

        // Clear the modal content and append inputs
        modalNoteTitle.innerHTML = ''; // Clear existing title
        modalNoteContent.innerHTML = ''; // Clear existing content
        modalNoteContent.appendChild(flairSelect); // Add flair selector
        modalNoteTitle.appendChild(titleInput);
        modalNoteContent.appendChild(contentInput);

        // Change the button text to Save
        editNoteBtn.textContent = 'Save';
        editNoteBtn.onclick = async function() {
            // Save the edited note
            const newTitle = titleInput.value; // Get new title
            const newContent = contentInput.value; // Get new content
            const newFlair = flairSelect.value; // Get new flair

            // Update modal and note box
            modalNoteTitle.textContent = newTitle;
            modalNoteContent.textContent = newContent;

            const notes = await fetchNotes(); // Fetch existing notes
            notes[index] = { flair: newFlair, title: newTitle, content: newContent }; // Update the specific note
            await saveNotes(notes); // Save updated notes
            modal.style.display = 'none'; // Hide modal
            loadNotes(); // Reload notes to display the updated note
        };
    };

    // Delete button functionality
    deleteNoteBtn.onclick = async function() {
        const notes = await fetchNotes(); // Fetch existing notes
        notes.splice(index, 1); // Remove the note at the specified index
        await saveNotes(notes); // Save updated notes
        modal.style.display = 'none'; // Hide modal
        loadNotes(); // Reload notes to reflect deletion
    };

    // Close modal when clicking outside
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none'; // Hide modal
        }
    };
}

// Close modal when clicking the close button
const closeModal = document.getElementsByClassName('close')[0];
closeModal.onclick = function() {
    modal.style.display = 'none'; // Hide modal
};

// Search functionality
searchInput.addEventListener('input', function() {
    const filter = searchInput.value.toLowerCase();
    const notesList = document.getElementById('notesList');
    const notes = notesList.getElementsByClassName('note-box');

    for (let note of notes) {
        const title = note.querySelector('.note-title').textContent.toLowerCase();
        const content = note.querySelector('.note-preview').textContent.toLowerCase();
        if (title.includes(filter) || content.includes(filter)) {
            note.style.display = ''; // Show note
        } else {
            note.style.display = 'none'; // Hide note
        }
    }
});
