// Admin Question Management Interface
// Handles certamen question import, management, and database operations

class QuestionManager {
    constructor() {
        this.currentSection = 'import';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStats();
        this.showSection('import');
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').dataset.section;
                this.showSection(section);
            });
        });

        // Import functionality
        document.getElementById('importBtn').addEventListener('click', () => this.importQuestions());
        document.getElementById('downloadSchema').addEventListener('click', () => this.downloadSchema());
        
        // Management functionality
        document.getElementById('searchBtn').addEventListener('click', () => this.searchQuestions());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.confirmClearAll());
        document.getElementById('refreshStats').addEventListener('click', () => this.loadStats());
        
        // Backup functionality
        document.getElementById('backupBtn').addEventListener('click', () => this.createBackup());
        document.getElementById('resetBtn').addEventListener('click', () => this.confirmReset());
        
        // Confirmation modal
        document.getElementById('confirmActionBtn').addEventListener('click', () => this.executeConfirmedAction());
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected section
        document.getElementById(`${sectionName}-section`).style.display = 'block';
        
        // Update navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        this.currentSection = sectionName;
        
        // Load section-specific data
        if (sectionName === 'stats') {
            this.loadStats();
        } else if (sectionName === 'categories') {
            this.loadCategoryStats();
        } else if (sectionName === 'manage') {
            this.loadQuestionList();
        }
    }

    async importQuestions() {
        const fileInput = document.getElementById('questionFile');
        const skipDuplicateCheck = document.getElementById('skipDuplicateCheck').checked;
        const allowDuplicates = document.getElementById('allowDuplicates').checked;
        
        if (!fileInput.files[0]) {
            this.showAlert('Please select a JSON file to import.', 'warning');
            return;
        }

        const file = fileInput.files[0];
        
        try {
            // Show progress
            this.showImportProgress();
            
            // Read and parse file
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.questions || !Array.isArray(data.questions)) {
                throw new Error('Invalid file format: expected questions array');
            }
            
            // Prepare import data
            const importData = {
                questions: data.questions,
                options: {
                    skipDuplicateCheck,
                    allowDuplicates
                }
            };
            
            // Send to API
            const response = await fetch('/api/admin/import-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(importData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showImportResults(result);
                this.loadStats(); // Refresh stats
                fileInput.value = ''; // Clear file input
            } else {
                throw new Error(result.error || 'Import failed');
            }
            
        } catch (error) {
            console.error('Import error:', error);
            this.showAlert(`Import failed: ${error.message}`, 'danger');
        } finally {
            this.hideImportProgress();
        }
    }

    showImportProgress() {
        document.getElementById('importProgress').style.display = 'block';
        document.getElementById('importStatus').textContent = 'Processing...';
    }

    hideImportProgress() {
        document.getElementById('importProgress').style.display = 'none';
    }

    showImportResults(results) {
        const modal = new bootstrap.Modal(document.getElementById('importResultsModal'));
        const modalBody = document.getElementById('importResultsModalBody');
        
        let html = `
            <div class="alert alert-success">
                <h6>Import Summary</h6>
                <p><strong>Total:</strong> ${results.summary.total}</p>
                <p><strong>Imported:</strong> ${results.summary.imported}</p>
                <p><strong>Failed:</strong> ${results.summary.failed}</p>
            </div>
        `;
        
        if (results.results.errors && results.results.errors.length > 0) {
            html += `
                <div class="alert alert-warning">
                    <h6>Errors</h6>
                    <ul>
                        ${results.results.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        modalBody.innerHTML = html;
        modal.show();
    }

    async downloadSchema() {
        try {
            const response = await fetch('/api/admin/import-questions/schema');
            const schema = await response.json();
            
            // Create downloadable file
            const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'certamen-question-schema.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Schema download error:', error);
            this.showAlert('Failed to download schema', 'danger');
        }
    }

    async loadStats() {
        try {
            // Load basic stats
            const [tossupCount, packetCount, setCount] = await Promise.all([
                fetch('/api/num-packets?type=tossup').then(r => r.json()).then(d => d.numPackets || 0),
                fetch('/api/packet-list').then(r => r.json()).then(d => d.packets?.length || 0),
                fetch('/api/set-list').then(r => r.json()).then(d => d.sets?.length || 0)
            ]);
            
            document.getElementById('totalQuestions').textContent = tossupCount;
            document.getElementById('totalPackets').textContent = packetCount;
            document.getElementById('totalSets').textContent = setCount;
            
            // Load category counts
            this.loadCategoryStats();
            
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadCategoryStats() {
        try {
            const response = await fetch('/api/query?type=tossup&limit=0');
            const data = await response.json();
            
            const categoryCounts = {};
            const subcategoryCounts = {};
            
            // Count by category and subcategory
            data.tossups.forEach(tossup => {
                categoryCounts[tossup.category] = (categoryCounts[tossup.category] || 0) + 1;
                subcategoryCounts[tossup.subcategory] = (subcategoryCounts[tossup.subcategory] || 0) + 1;
            });
            
            // Update main category counts
            ['History', 'Literature', 'Language', 'Culture', 'Mythology'].forEach(category => {
                const count = categoryCounts[category] || 0;
                const element = document.getElementById(`${category.toLowerCase()}Count`);
                if (element) element.textContent = count;
            });
            
            // Update subcategory list
            this.updateSubcategoryList(subcategoryCounts);
            
        } catch (error) {
            console.error('Error loading category stats:', error);
        }
    }

    updateSubcategoryList(subcategoryCounts) {
        const container = document.getElementById('subcategoryList');
        const categories = {
            'History': ['Ancient History', 'Classical History', 'Roman History', 'Greek History', 'Other History'],
            'Literature': ['Classical Literature', 'Greek Literature', 'Roman Literature', 'Latin Literature', 'Other Literature'],
            'Language': ['Latin', 'Greek', 'Classical Languages', 'Linguistics', 'Other Language'],
            'Culture': ['Classical Culture', 'Roman Culture', 'Greek Culture', 'Daily Life', 'Other Culture'],
            'Mythology': ['Greek Mythology', 'Roman Mythology', 'Classical Mythology', 'Other Mythology']
        };
        
        let html = '';
        Object.entries(categories).forEach(([category, subcategories]) => {
            html += `<h6>${category}</h6>`;
            html += '<ul class="list-group mb-3">';
            subcategories.forEach(subcategory => {
                const count = subcategoryCounts[subcategory] || 0;
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${subcategory}
                        <span class="badge bg-secondary rounded-pill">${count}</span>
                    </li>
                `;
            });
            html += '</ul>';
        });
        
        container.innerHTML = html;
    }

    async searchQuestions() {
        const category = document.getElementById('filterCategory').value;
        const query = document.getElementById('searchQuery').value;
        
        try {
            let url = '/api/query?type=tossup&limit=50';
            if (category) url += `&categories=${category}`;
            if (query) url += `&q=${encodeURIComponent(query)}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            this.displayQuestionList(data.tossups || []);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showAlert('Search failed', 'danger');
        }
    }

    async loadQuestionList() {
        try {
            const response = await fetch('/api/query?type=tossup&limit=50');
            const data = await response.json();
            
            this.displayQuestionList(data.tossups || []);
            
        } catch (error) {
            console.error('Error loading questions:', error);
        }
    }

    displayQuestionList(questions) {
        const container = document.getElementById('questionList');
        
        if (questions.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No questions found.</div>';
            return;
        }
        
        let html = '<div class="table-responsive"><table class="table table-striped">';
        html += '<thead><tr><th>Question</th><th>Answer</th><th>Category</th><th>Difficulty</th><th>Actions</th></tr></thead><tbody>';
        
        questions.forEach(question => {
            const questionText = question.question.length > 100 ? 
                question.question.substring(0, 100) + '...' : question.question;
            
            html += `
                <tr>
                    <td>${questionText}</td>
                    <td>${question.answer}</td>
                    <td><span class="badge bg-primary">${question.category}</span></td>
                    <td>${question.difficulty || 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="questionManager.deleteQuestion('${question._id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    async deleteQuestion(questionId) {
        if (confirm('Are you sure you want to delete this question?')) {
            try {
                // Note: This would need a delete endpoint to be implemented
                console.log('Delete question:', questionId);
                this.showAlert('Question deletion not yet implemented', 'info');
            } catch (error) {
                console.error('Delete error:', error);
                this.showAlert('Failed to delete question', 'danger');
            }
        }
    }

    confirmClearAll() {
        this.showConfirmation(
            'Clear All Questions',
            'This will permanently delete ALL questions from the database. This action cannot be undone. Are you sure?',
            'clearAll'
        );
    }

    confirmReset() {
        this.showConfirmation(
            'Reset Database',
            'This will permanently delete ALL questions and reset the database to empty. This action cannot be undone. Are you sure?',
            'reset'
        );
    }

    showConfirmation(title, message, action) {
        document.getElementById('confirmationModalBody').innerHTML = `
            <h6>${title}</h6>
            <p>${message}</p>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        modal.show();
        
        this.pendingAction = action;
    }

    async executeConfirmedAction() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
        
        try {
            if (this.pendingAction === 'clearAll') {
                await this.clearAllQuestions();
            } else if (this.pendingAction === 'reset') {
                await this.resetDatabase();
            }
            
            modal.hide();
            this.loadStats();
            
        } catch (error) {
            console.error('Action execution error:', error);
            this.showAlert(`Action failed: ${error.message}`, 'danger');
        }
    }

    async clearAllQuestions() {
        // This would need to be implemented with proper API endpoints
        this.showAlert('Clear all questions functionality not yet implemented', 'info');
    }

    async resetDatabase() {
        // This would need to be implemented with proper API endpoints
        this.showAlert('Database reset functionality not yet implemented', 'info');
    }

    async createBackup() {
        try {
            // This would need to be implemented with proper API endpoints
            this.showAlert('Backup functionality not yet implemented', 'info');
        } catch (error) {
            console.error('Backup error:', error);
            this.showAlert('Backup failed', 'danger');
        }
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at the top of the main content
        const main = document.querySelector('main');
        main.insertBefore(alertDiv, main.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.questionManager = new QuestionManager();
});