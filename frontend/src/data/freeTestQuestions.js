/**
 * Free-test question bank.
 * This shape is the reusable contract for all mock-test questions in JeeX —
 * the personalisation engine will eventually generate/select arrays of this
 * same shape instead of this hardcoded list.
 *
 * id, subject, topic, difficulty, question, options, correctAnswer, explanation
 */
export const freeTestQuestions = [
  {
    id: 1,
    subject: 'Physics',
    topic: 'Kinematics',
    difficulty: 'easy',
    question: 'A particle starts from rest and moves with a constant acceleration of 2 m/s². What distance does it cover in 5 seconds?',
    options: ['10 m', '20 m', '25 m', '50 m'],
    correctAnswer: 2,
    explanation: 'Using s = ut + ½at². Since the initial velocity is zero, s = ½ × 2 × 5² = 25 m.',
  },
  {
    id: 2,
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'easy',
    question: 'If the roots of x² − 5x + 6 = 0 are α and β, what is α + β?',
    options: ['2', '3', '5', '6'],
    correctAnswer: 2,
    explanation: 'The sum of roots of ax² + bx + c = 0 is −b/a. Therefore α + β = 5.',
  },
  {
    id: 3,
    subject: 'Chemistry',
    topic: 'Mole Concept',
    difficulty: 'easy',
    question: 'How many moles are present in 18 grams of water?',
    options: ['0.5', '1', '2', '18'],
    correctAnswer: 1,
    explanation: 'Molar mass of water is 18 g/mol. Therefore 18 ÷ 18 = 1 mole.',
  },
  {
    id: 4,
    subject: 'Physics',
    topic: 'Current Electricity',
    difficulty: 'easy',
    question: 'Two resistors of 2 Ω and 3 Ω are connected in series. What is their equivalent resistance?',
    options: ['1.2 Ω', '5 Ω', '6 Ω', '12 Ω'],
    correctAnswer: 1,
    explanation: 'For resistors in series, R = R₁ + R₂. Therefore R = 2 + 3 = 5 Ω.',
  },
  {
    id: 5,
    subject: 'Mathematics',
    topic: 'Algebra',
    difficulty: 'medium',
    question: 'If x + 1/x = 3, find x² + 1/x².',
    options: ['5', '7', '9', '11'],
    correctAnswer: 1,
    explanation: 'Squaring both sides: (x + 1/x)² = 9, so x² + 1/x² + 2 = 9. Therefore x² + 1/x² = 7.',
  },
  {
    id: 6,
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'easy',
    question: 'An element has atomic number 17. How many electrons are present in its outermost shell?',
    options: ['2', '5', '7', '8'],
    correctAnswer: 2,
    explanation: 'Atomic number 17 corresponds to chlorine. Its electronic configuration is 2, 8, 7 — so it has 7 electrons in its outermost shell.',
  },
  {
    id: 7,
    subject: 'Physics',
    topic: 'Mechanics',
    difficulty: 'medium',
    question: 'A body is projected vertically upward with an initial velocity of 20 m/s. Take g = 10 m/s². What maximum height does it reach?',
    options: ['10 m', '20 m', '30 m', '40 m'],
    correctAnswer: 1,
    explanation: 'Using v² = u² − 2gh, at maximum height v = 0, so h = u² / 2g = 400 / 20 = 20 m.',
  },
  {
    id: 8,
    subject: 'Mathematics',
    topic: 'Trigonometry',
    difficulty: 'easy',
    question: 'What is the value of sin²30° + cos²30°?',
    options: ['0', '1/2', '1', '√3'],
    correctAnswer: 2,
    explanation: 'Using the identity sin²θ + cos²θ = 1.',
  },
  {
    id: 9,
    subject: 'Chemistry',
    topic: 'Periodic Properties',
    difficulty: 'easy',
    question: 'Which element has the highest electronegativity?',
    options: ['Oxygen', 'Nitrogen', 'Fluorine', 'Chlorine'],
    correctAnswer: 2,
    explanation: 'Fluorine is the most electronegative element on the periodic table.',
  },
  {
    id: 10,
    subject: 'Physics',
    topic: 'Work and Energy',
    difficulty: 'easy',
    question: 'A force of 10 N moves an object by 5 metres in the direction of the force. What is the work done?',
    options: ['2 J', '10 J', '15 J', '50 J'],
    correctAnswer: 3,
    explanation: 'W = F × s. Therefore W = 10 × 5 = 50 J.',
  },
]

export const SECONDS_PER_QUESTION = 30
