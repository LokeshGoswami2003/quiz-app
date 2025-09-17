let quizData;
let currentSection = null;
let currentQuestionIndex = 0;
let score = 0;
let sectionScores = {
    'General Knowledge': 0,
    'Science': 0,
    'Mathematics': 0,
    'Indian History': 0
};
let sectionProgress = {};
let totalQuestionsAnswered = 0;
let correctAnswers = 0;

// Load saved progress from localStorage
function loadProgress() {
    const savedProgress = localStorage.getItem('quizProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        sectionScores = progress.sectionScores || sectionScores;
        sectionProgress = progress.sectionProgress || {};
        updateScoreDisplay();
    }
}

// Save progress to localStorage
function saveProgress() {
    const progress = {
        sectionScores,
        sectionProgress
    };
    localStorage.setItem('quizProgress', JSON.stringify(progress));
}

// Fetch quiz data
async function fetchQuizData() {
    try {
        const response = await fetch('quiz-data.json');
        quizData = await response.json();
        initializeQuiz();
    } catch (error) {
        console.error('Error loading quiz data:', error);
    }
}

// Initialize the quiz
function initializeQuiz() {
    loadProgress();
    const sections = document.querySelectorAll('.section');
    sections.forEach((section, index) => {
        // Add completion indicator
        const completionRate = getCompletionRate(index);
        const indicator = document.createElement('div');
        indicator.className = 'completion-indicator';
        indicator.style.width = `${completionRate}%`;
        section.appendChild(indicator);

        section.addEventListener('click', () => startSection(index));
    });
}



// Start a quiz section
function startSection(sectionIndex) {
    currentSection = quizData.sections[sectionIndex];
    currentQuestionIndex = 0;
    const quizContainer = document.getElementById('quiz-container');
    const questionContainer = document.getElementById('question-container');
    
    // Animate transition
    quizContainer.style.animation = 'fadeOut 0.5s forwards';
    setTimeout(() => {
        quizContainer.style.display = 'none';
        questionContainer.style.display = 'block';
        questionContainer.style.animation = 'fadeIn 0.5s forwards';
        displayQuestion();
    }, 500);
}

// Display current question
function displayQuestion() {
    const questionData = currentSection.questions[currentQuestionIndex];
    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');
    const nextButton = document.getElementById('next-button');
    
    // Clear previous feedback
    const existingFeedback = document.getElementById('feedback');
    if (existingFeedback) existingFeedback.remove();

    questionElement.textContent = `${currentQuestionIndex + 1}. ${questionData.question}`;
    optionsElement.innerHTML = '';

    switch (questionData.questionType) {
        case 'mcq':
            questionData.options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.textContent = option;
                optionDiv.addEventListener('click', () => selectOption(optionDiv));
                optionsElement.appendChild(optionDiv);
            });
            nextButton.style.display = 'none';
            break;

        case 'text':
        case 'number':
            const input = document.createElement('input');
            input.type = questionData.questionType;
            input.placeholder = `Enter your ${questionData.questionType} answer...`;
            optionsElement.appendChild(input);

            const submitButton = document.createElement('button');
            submitButton.textContent = 'Submit';
            submitButton.className = 'submit-answer';
            submitButton.addEventListener('click', () => checkInputAnswer(input.value));
            optionsElement.appendChild(submitButton);
            nextButton.style.display = 'none';
            break;
    }

    updateScoreDisplay();
}

// Select an MCQ option
function selectOption(selectedOption) {
    const options = document.querySelectorAll('#options div');
    options.forEach(option => option.classList.remove('selected'));
    selectedOption.classList.add('selected');

    const questionData = currentSection.questions[currentQuestionIndex];
    const isCorrect = selectedOption.textContent === questionData.answer;
    
    showFeedback(isCorrect);
    updateScore(isCorrect);
    document.getElementById('next-button').style.display = 'block';
}

// Check input answer
function checkInputAnswer(answer) {
    const questionData = currentSection.questions[currentQuestionIndex];
    let isCorrect = false;

    if (questionData.questionType === 'number') {
        isCorrect = parseInt(answer) === questionData.answer;
    } else {
        isCorrect = answer.toLowerCase() === questionData.answer.toLowerCase();
    }

    showFeedback(isCorrect);
    updateScore(isCorrect);
    document.getElementById('next-button').style.display = 'block';
}

// Show feedback for answer
function showFeedback(isCorrect) {
    const optionsElement = document.getElementById('options');
    const feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'feedback';
    
    const questionData = currentSection.questions[currentQuestionIndex];
    
    if (isCorrect) {
        feedbackDiv.innerHTML = `<div class="feedback-icon">✅</div><div class="feedback-text">Correct!</div>`;
        feedbackDiv.className = 'feedback correct';
    } else {
        feedbackDiv.innerHTML = `
            <div class="feedback-icon">❌</div>
            <div class="feedback-text">
                <div>Incorrect!</div>
                <div class="correct-answer">Correct answer: ${questionData.answer}</div>
            </div>
        `;
        feedbackDiv.className = 'feedback incorrect';
    }
    
    optionsElement.appendChild(feedbackDiv);

    // Highlight the correct answer if it was wrong
    if (!isCorrect && questionData.questionType === 'mcq') {
        const options = optionsElement.querySelectorAll('div:not(#feedback)');
        options.forEach(option => {
            if (option.textContent === questionData.answer) {
                option.classList.add('correct-option');
            }
        });
    }

    // Add to section progress
    if (!sectionProgress[currentSection.sectionTitle]) {
        sectionProgress[currentSection.sectionTitle] = {};
    }
    sectionProgress[currentSection.sectionTitle][currentQuestionIndex] = isCorrect;
    saveProgress();
}

// Update score based on question difficulty
function updateScore(isCorrect) {
    totalQuestionsAnswered++;
    if (isCorrect) {
        correctAnswers++;
        // Calculate bonus points based on question type
        const questionData = currentSection.questions[currentQuestionIndex];
        let points = 10; // Base points

        // Bonus points for different question types
        switch (questionData.questionType) {
            case 'text':
                points += 5; // Text answers are harder
                break;
            case 'number':
                points += 3; // Exact number matches are moderately hard
                break;
        }

        // Bonus points for quick answers (if answered within 10 seconds)
        if (questionData.timeToAnswer && questionData.timeToAnswer < 10) {
            points += 2;
        }

        score += points;
        sectionScores[currentSection.sectionTitle] += points;
        saveProgress();
    }
    updateScoreDisplay();
}

// Update score display
function updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    
    // Update score in question container
    if (scoreElement) {
        scoreElement.textContent = `Score: ${currentSection ? sectionScores[currentSection.sectionTitle] : 0}`;
    }
}

// Handle next question
document.getElementById('next-button').addEventListener('click', () => {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < currentSection.questions.length) {
        displayQuestion();
    } else {
        showSectionSummary();
    }
});

// Show section summary
function showSectionSummary() {
    const questionContainer = document.getElementById('question-container');
    questionContainer.innerHTML = `
        <h2>Section Complete!</h2>
        <div class="summary">
            <p>Section: ${currentSection.sectionTitle}</p>
            <p>Score: ${sectionScores[currentSection.sectionTitle]}</p>
            <p>Correct Answers: ${
                Object.values(sectionProgress[currentSection.sectionTitle] || {})
                    .filter(correct => correct).length
            }/${currentSection.questions.length}</p>
        </div>
        <button onclick="returnToMenu()" class="submit-answer">Return to Menu</button>
    `;
}

// Return to main menu
function returnToMenu() {
    const quizContainer = document.getElementById('quiz-container');
    const questionContainer = document.getElementById('question-container');
    
    questionContainer.style.animation = 'fadeOut 0.5s forwards';
    setTimeout(() => {
        questionContainer.style.display = 'none';
        quizContainer.style.display = 'grid';
        quizContainer.style.animation = 'fadeIn 0.5s forwards';
        updateScoreDisplay();
    }, 500);
}

// Add back button functionality
document.querySelector('.back-button')?.addEventListener('click', returnToMenu);

// Start section
function startSection(sectionIndex) {
    currentSection = quizData.sections[sectionIndex];
    currentQuestionIndex = 0;
    const quizContainer = document.getElementById('quiz-container');
    const questionContainer = document.getElementById('question-container');
    
    // Animate transition
    quizContainer.style.animation = 'fadeOut 0.5s forwards';
    setTimeout(() => {
        quizContainer.style.display = 'none';
        questionContainer.style.display = 'block';
        questionContainer.style.animation = 'fadeIn 0.5s forwards';
        displayQuestion();
    }, 500);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
    .completion-indicator {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 4px;
        background-color: rgba(0, 0, 0, 0.2);
        transition: width 0.3s ease;
    }
    .section {
        position: relative;
        overflow: hidden;
    }
    .summary {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        margin: 20px 0;
    }
`;
document.head.appendChild(style);

// Initialize the quiz
fetchQuizData();
