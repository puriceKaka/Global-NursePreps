/**
 * Lecturer Portal JavaScript
 * Handles lecturer dashboard, student management, exam creation, and results
 */

class LecturerPortal {
    constructor() {
        this.storageKeys = {
            lecturerSession: 'lecturer_session',
            students: 'lecturer_students',
            courses: 'lecturer_courses',
            exams: 'lecturer_exams',
            results: 'lecturer_results',
            activity: 'lecturer_activity'
        };
        
        this.currentUser = null;
        this.init();
    }
    
    init() {
        this.checkAuth();
        this.loadUserData();
        this.bindEvents();
        this.loadDashboardData();
    }
    
    checkAuth() {
        const session = localStorage.getItem(this.storageKeys.lecturerSession);
        if (!session) {
            // For demo purposes, create a default session
            this.currentUser = {
                id: 'lecturer_001',
                name: 'Dr. Sarah Johnson',
                email: 'sarah.johnson@globalnurseprep.com',
                role: 'lecturer',
                specializations: ['Medical-Surgical Nursing', 'Critical Care'],
                approved: true
            };
            localStorage.setItem(this.storageKeys.lecturerSession, JSON.stringify(this.currentUser));
        } else {
            this.currentUser = JSON.parse(session);
        }
        
        // Update UI with user data
        this.updateUserUI();
    }
    
    loadUserData() {
        // Initialize storage if not exists
        if (!localStorage.getItem(this.storageKeys.students)) {
            localStorage.setItem(this.storageKeys.students, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.storageKeys.courses)) {
            localStorage.setItem(this.storageKeys.courses, JSON.stringify(this.getDefaultCourses()));
        }
        if (!localStorage.getItem(this.storageKeys.exams)) {
            localStorage.setItem(this.storageKeys.exams, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.storageKeys.results)) {
            localStorage.setItem(this.storageKeys.results, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.storageKeys.activity)) {
            localStorage.setItem(this.storageKeys.activity, JSON.stringify([]));
        }
    }
    
    getDefaultCourses() {
        return [
            {
                id: 'course_001',
                title: 'BSN Year 1: Nursing Foundations',
                code: 'NSG101',
                students: 45,
                description: 'First-year BSN learning path covering core sciences and nursing foundations.'
            },
            {
                id: 'course_002',
                title: 'Medical-Surgical Nursing I',
                code: 'NSG201',
                students: 38,
                description: 'Adult health nursing care for common medical conditions.'
            },
            {
                id: 'course_003',
                title: 'Pharmacology for Nurses',
                code: 'NSG205',
                students: 52,
                description: 'Drug classifications, medication safety, and clinical applications.'
            }
        ];
    }
    
    updateUserUI() {
        const nameElements = document.querySelectorAll('#lecturerName, #welcomeName');
        nameElements.forEach(el => {
            if (el) el.textContent = this.currentUser.name.split(' ')[0];
        });
        
        const emailElement = document.getElementById('drawerEmail');
        if (emailElement) emailElement.textContent = this.currentUser.email;
    }
    
    bindEvents() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        // Course performance select
        const performanceSelect = document.getElementById('coursePerformanceSelect');
        if (performanceSelect) {
            performanceSelect.addEventListener('change', () => {
                this.loadPerformanceChart(performanceSelect.value);
            });
        }
    }
    
    loadDashboardData() {
        this.updateStats();
        this.loadUpcomingExams();
        this.loadRecentActivity();
        this.loadStudentsNeedingAttention();
        this.populateCourseSelect();
    }
    
    updateStats() {
        const courses = this.getCourses();
        const students = this.getStudents();
        const exams = this.getExams();
        const results = this.getResults();
        
        // Count upcoming exams (next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const upcomingExams = exams.filter(exam => {
            const examDate = new Date(exam.scheduledDate);
            return examDate > new Date() && examDate <= nextWeek;
        }).length;
        
        // Count graded exams this month
        const thisMonth = new Date().getMonth();
        const gradedThisMonth = results.filter(result => {
            const resultDate = new Date(result.submittedAt);
            return resultDate.getMonth() === thisMonth;
        }).length;
        
        document.getElementById('totalCourses').textContent = courses.length;
        document.getElementById('totalStudents').textContent = students.length;
        document.getElementById('pendingExams').textContent = upcomingExams;
        document.getElementById('gradedExams').textContent = gradedThisMonth;
    }
    
    loadUpcomingExams() {
        const exams = this.getExams();
        const upcomingList = document.getElementById('upcomingExamsList');
        
        if (!upcomingList) return;
        
        const upcomingExams = exams
            .filter(exam => new Date(exam.scheduledDate) > new Date())
            .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
            .slice(0, 5);
        
        if (upcomingExams.length === 0) {
            upcomingList.innerHTML = '<p class="empty-message">No upcoming exams scheduled.</p>';
            return;
        }
        
        upcomingList.innerHTML = upcomingExams.map(exam => `
            <div class="exam-item">
                <div class="exam-info">
                    <h4>${exam.title}</h4>
                    <span>${exam.courseTitle} • ${exam.duration} minutes • ${new Date(exam.scheduledDate).toLocaleDateString()}</span>
                </div>
                <div class="exam-actions">
                    <button onclick="lecturerPortal.editExam('${exam.id}')">Edit</button>
                    <button class="primary" onclick="lecturerPortal.monitorExam('${exam.id}')">Monitor</button>
                </div>
            </div>
        `).join('');
    }
    
    loadRecentActivity() {
        const activity = this.getActivity();
        const activityList = document.getElementById('recentActivityList');
        
        if (!activityList) return;
        
        const recentActivity = activity
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 8);
        
        if (recentActivity.length === 0) {
            activityList.innerHTML = '<p class="empty-message">No recent activity.</p>';
            return;
        }
        
        activityList.innerHTML = recentActivity.map(item => `
            <div class="activity-item">
                <div class="activity-icon">${this.getActivityIcon(item.type)}</div>
                <div class="activity-info">
                    <strong>${item.message}</strong>
                    <span>${item.studentName || ''} • ${item.courseTitle || ''}</span>
                </div>
                <span class="activity-time">${this.getTimeAgo(item.timestamp)}</span>
            </div>
        `).join('');
    }
    
    getActivityIcon(type) {
        const icons = {
            'exam_started': '📝',
            'exam_completed': '✅',
            'module_completed': '📚',
            'course_enrolled': '🎓',
            'quiz_passed': '⭐',
            'quiz_failed': '📊'
        };
        return icons[type] || '📋';
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000);
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }
    
    loadStudentsNeedingAttention() {
        const students = this.getStudents();
        const tableBody = document.getElementById('attentionTableBody');
        
        if (!tableBody) return;
        
        // Find students with low progress or scores
        const attentionStudents = students
            .filter(student => student.progress < 50 || student.avgScore < 60)
            .slice(0, 10);
        
        document.getElementById('attentionCount').textContent = attentionStudents.length;
        
        if (attentionStudents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-message">All students are on track.</td></tr>';
            return;
        }
        
        tableBody.innerHTML = attentionStudents.map(student => `
            <tr>
                <td>
                    <strong>${student.name}</strong><br>
                    <span class="muted">${student.email}</span>
                </td>
                <td>${student.courseTitle}</td>
                <td>
                    <div class="progress-mini">
                        <span style="width: ${student.progress}%"></span>
                    </div>
                    <span>${student.progress}%</span>
                </td>
                <td>${student.avgScore}%</td>
                <td>
                    <span class="badge ${student.progress < 30 ? 'danger' : 'warning'}">
                        ${student.progress < 30 ? 'At Risk' : 'Needs Attention'}
                    </span>
                </td>
                <td>
                    <button onclick="lecturerPortal.contactStudent('${student.id}')">Contact</button>
                </td>
            </tr>
        `).join('');
    }
    
    populateCourseSelect() {
        const courses = this.getCourses();
        const select = document.getElementById('coursePerformanceSelect');
        
        if (!select) return;
        
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.title;
            select.appendChild(option);
        });
    }
    
    loadPerformanceChart(courseId) {
        const chartContainer = document.getElementById('performanceChart');
        
        if (!chartContainer) return;
        
        const results = this.getResults();
        const courseResults = courseId === 'all' 
            ? results 
            : results.filter(r => r.courseId === courseId);
        
        if (courseResults.length === 0) {
            chartContainer.innerHTML = '<div class="chart-placeholder"><p>No performance data available yet.</p></div>';
            return;
        }
        
        // Calculate average scores by category
        const categoryScores = {};
        courseResults.forEach(result => {
            if (result.categoryResults) {
                Object.entries(result.categoryResults).forEach(([category, data]) => {
                    if (!categoryScores[category]) {
                        categoryScores[category] = { total: 0, count: 0 };
                    }
                    categoryScores[category].total += (data.earned / data.total) * 100;
                    categoryScores[category].count += 1;
                });
            }
        });
        
        // Build chart HTML
        const categories = Object.entries(categoryScores)
            .map(([category, data]) => ({
                category,
                avgScore: Math.round(data.total / data.count)
            }))
            .sort((a, b) => b.avgScore - a.avgScore);
        
        chartContainer.innerHTML = `
            <div class="performance-bars">
                ${categories.map(cat => `
                    <div class="performance-bar-item">
                        <div class="bar-label">${cat.category}</div>
                        <div class="bar-track">
                            <div class="bar-fill" style="width: ${cat.avgScore}%">
                                <span class="bar-value">${cat.avgScore}%</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Data access methods
    getCourses() {
        return JSON.parse(localStorage.getItem(this.storageKeys.courses) || '[]');
    }
    
    getStudents() {
        return JSON.parse(localStorage.getItem(this.storageKeys.students) || '[]');
    }
    
    getExams() {
        return JSON.parse(localStorage.getItem(this.storageKeys.exams) || '[]');
    }
    
    getResults() {
        return JSON.parse(localStorage.getItem(this.storageKeys.results) || '[]');
    }
    
    getActivity() {
        return JSON.parse(localStorage.getItem(this.storageKeys.activity) || '[]');
    }
    
    // Actions
    logout() {
        localStorage.removeItem(this.storageKeys.lecturerSession);
        window.location.href = '../login.html';
    }
    
    editExam(examId) {
        window.location.href = `lecturer-exams.html?edit=${examId}`;
    }
    
    monitorExam(examId) {
        window.location.href = `lecturer-exam-monitor.html?exam=${examId}`;
    }
    
    contactStudent(studentId) {
        const students = this.getStudents();
        const student = students.find(s => s.id === studentId);
        if (student) {
            window.open(`mailto:${student.email}?subject=Checking in - Global NursePrep`);
        }
    }
    
    // Add student to membership (free course access)
    addStudentToMembership(studentData) {
        const students = this.getStudents();
        const newStudent = {
            id: `student_${Date.now()}`,
            ...studentData,
            enrolledAt: new Date().toISOString(),
            membershipType: 'free',
            approved: true,
            progress: 0,
            avgScore: 0
        };
        
        students.push(newStudent);
        localStorage.setItem(this.storageKeys.students, JSON.stringify(students));
        
        // Log activity
        this.logActivity('student_enrolled', {
            studentId: newStudent.id,
            studentName: newStudent.name,
            message: `${newStudent.name} added to membership`
        });
        
        return newStudent;
    }
    
    // Create exam
    createExam(examData) {
        const exams = this.getExams();
        const newExam = {
            id: `exam_${Date.now()}`,
            ...examData,
            createdAt: new Date().toISOString(),
            status: 'scheduled',
            submissions: 0
        };
        
        exams.push(newExam);
        localStorage.setItem(this.storageKeys.exams, JSON.stringify(exams));
        
        this.logActivity('exam_created', {
            examId: newExam.id,
            message: `Exam "${examData.title}" created`
        });
        
        return newExam;
    }
    
    // Log activity
    logActivity(type, data) {
        const activity = this.getActivity();
        activity.push({
            id: `activity_${Date.now()}`,
            type,
            timestamp: new Date().toISOString(),
            lecturerId: this.currentUser.id,
            ...data
        });
        
        // Keep only last 100 activities
        if (activity.length > 100) {
            activity.splice(0, activity.length - 100);
        }
        
        localStorage.setItem(this.storageKeys.activity, JSON.stringify(activity));
    }
}

// Initialize lecturer portal
let lecturerPortal;
document.addEventListener('DOMContentLoaded', () => {
    lecturerPortal = new LecturerPortal();
});