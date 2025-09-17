let quizData;
let currentSection = null;
let currentQuestionIndex = 0;
let score = 0;

// Fetch quiz data
async function fetchQuizData() {
  try {
    const response = await fetch("quiz-data.json");
    quizData = await response.json();
    initializeQuiz();
  } catch (error) {
    console.error("Error loading quiz data:", error);
  }
}

// Initialize the quiz
function initializeQuiz() {
  const sections = document.querySelectorAll(".section");
  sections.forEach((section, index) => {
    section.addEventListener("click", () => startSection(index));
  });
}

// Shuffle helper
function shuffleArray(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// Start a quiz section
function startSection(sectionIndex) {
  const section = quizData.sections[sectionIndex];
  currentSection = {
    ...section,
    questions: shuffleArray([...section.questions]),
  };
  currentQuestionIndex = 0;
  score = 0;

  const quizContainer = document.getElementById("quiz-container");
  const questionContainer = document.getElementById("question-container");

  quizContainer.style.display = "none";
  questionContainer.style.display = "block";

  displayQuestion();
}

// Display current question
function displayQuestion() {
  const questionData = currentSection.questions[currentQuestionIndex];
  const questionElement = document.getElementById("question");
  const optionsElement = document.getElementById("options");
  const nextButton = document.getElementById("next-button");

  // Reset UI
  optionsElement.innerHTML = "";
  const existingFeedback = document.getElementById("feedback");
  if (existingFeedback) existingFeedback.remove();

  questionElement.textContent = `${currentQuestionIndex + 1}. ${questionData.question}`;

  switch (questionData.questionType) {
    case "mcq":
      shuffleArray([...questionData.options]).forEach((option) => {
        const optionDiv = document.createElement("div");
        optionDiv.textContent = option;
        optionDiv.addEventListener("click", () => selectOption(optionDiv));
        optionsElement.appendChild(optionDiv);
      });
      nextButton.style.display = "none";
      break;

    case "text":
    case "number":
      const input = document.createElement("input");
      input.type = questionData.questionType;
      input.placeholder = `Enter your ${questionData.questionType} answer...`;
      optionsElement.appendChild(input);

      const submitButton = document.createElement("button");
      submitButton.textContent = "Submit";
      submitButton.className = "submit-answer";
      submitButton.addEventListener("click", () => checkInputAnswer(input.value));
      optionsElement.appendChild(submitButton);
      nextButton.style.display = "none";
      break;
  }

  updateScoreDisplay();
}

// Select MCQ option
function selectOption(selectedOption) {
  const options = document.querySelectorAll("#options div");
  options.forEach((option) => option.classList.remove("selected"));
  selectedOption.classList.add("selected");

  const questionData = currentSection.questions[currentQuestionIndex];
  const isCorrect = selectedOption.textContent === questionData.answer;

  showFeedback(isCorrect);
  updateScore(isCorrect);
  document.getElementById("next-button").style.display = "block";
}

// Check input answer
function checkInputAnswer(answer) {
  const questionData = currentSection.questions[currentQuestionIndex];
  let isCorrect = false;

  if (questionData.questionType === "number") {
    isCorrect = parseInt(answer) === questionData.answer;
  } else {
    isCorrect = answer.toLowerCase() === questionData.answer.toLowerCase();
  }

  showFeedback(isCorrect);
  updateScore(isCorrect);
  document.getElementById("next-button").style.display = "block";
}

// Show feedback
function showFeedback(isCorrect) {
  const optionsElement = document.getElementById("options");
  const feedbackDiv = document.createElement("div");
  feedbackDiv.id = "feedback";

  const questionData = currentSection.questions[currentQuestionIndex];

  if (isCorrect) {
    feedbackDiv.innerHTML =
      `<div class="feedback-icon">✅</div><div class="feedback-text">Correct!</div>`;
    feedbackDiv.className = "feedback correct";
  } else {
    feedbackDiv.innerHTML = `
      <div class="feedback-icon">❌</div>
      <div class="feedback-text">
        <div>Incorrect!</div>
        <div class="correct-answer">Correct answer: ${questionData.answer}</div>
      </div>`;
    feedbackDiv.className = "feedback incorrect";
  }

  optionsElement.appendChild(feedbackDiv);
}

// Update score
function updateScore(isCorrect) {
  if (isCorrect) {
    score += 10;
  }
  updateScoreDisplay();
}

// Update score display
function updateScoreDisplay() {
  const scoreElement = document.getElementById("score");
  if (scoreElement) {
    scoreElement.textContent = `Score: ${score}`;
  }
}

// Handle next question
document.getElementById("next-button").addEventListener("click", () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < currentSection.questions.length) {
    displayQuestion();
  } else {
    showSectionSummary();
  }
});

// Show section summary
function showSectionSummary() {
  const questionContainer = document.getElementById("question-container");
  questionContainer.innerHTML = `
    <h2>Section Complete!</h2>
    <div class="summary">
      <p>Section: ${currentSection.sectionTitle}</p>
      <p>Score: ${score}</p>
    </div>
    <button onclick="returnToMenu()" class="submit-answer">Return to Menu</button>
  `;
}

// Return to main menu (reset quiz)
function returnToMenu() {
  location.reload(); // Simply refresh page for clean reset
}

// Init
fetchQuizData();
