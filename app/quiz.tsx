import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";

// Dummy questions
const dummyQuestions = [
  {
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    answer: "4",
  },
  {
    question: "Capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    answer: "Paris",
  },
  {
    question: "Which planet is known as Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    answer: "Mars",
  },
];

export default function Quiz() {
  const params = useLocalSearchParams();
  const { chapter } = params as { chapter: string };

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<(string | null)[]>(Array(dummyQuestions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const question = dummyQuestions[current];

  const handleSelectOption = (option: string) => {
    const updated = [...selected];
    updated[current] = option;
    setSelected(updated);
  };

  const handleNext = () => {
    if (current + 1 < dummyQuestions.length) setCurrent(current + 1);
  };

  const handleBack = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleSubmit = () => {
    let calculatedScore = 0;
    dummyQuestions.forEach((q, idx) => {
      if (selected[idx] === q.answer) calculatedScore++;
    });
    setScore(calculatedScore);
    setSubmitted(true);
    Alert.alert("Quiz finished!", `Your score: ${calculatedScore} / ${dummyQuestions.length}`);
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz Result</Text>
        <Text style={styles.scoreText}>
          Your Score: {score} / {dummyQuestions.length}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setCurrent(0);
            setSelected(Array(dummyQuestions.length).fill(null));
            setSubmitted(false);
            setScore(0);
          }}
        >
          <Text style={styles.buttonText}>Restart Quiz</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.chapterText}>Chapter: {chapter}</Text>
      <Text style={styles.questionNumber}>
        Question {current + 1} / {dummyQuestions.length}
      </Text>
      <Text style={styles.questionText}>{question.question}</Text>

      {question.options.map((opt) => {
        const isSelected = selected[current] === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.optionButton, isSelected && styles.selectedOption]}
            onPress={() => handleSelectOption(opt)}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.navigation}>
        <TouchableOpacity style={styles.navButton} onPress={handleBack} disabled={current === 0}>
          <Text style={[styles.navText, current === 0 && styles.disabledText]}>Back</Text>
        </TouchableOpacity>

        {current + 1 === dummyQuestions.length ? (
          <TouchableOpacity style={styles.navButton} onPress={handleSubmit}>
            <Text style={styles.navText}>Submit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Text style={styles.navText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  chapterText: { fontSize: 16, marginBottom: 5 },
  questionNumber: { fontSize: 14, marginBottom: 10 },
  questionText: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  optionButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
  },
  selectedOption: { backgroundColor: "#4CAF50" },
  optionText: { color: "#fff", fontSize: 16, textAlign: "center" },
  navigation: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  navButton: { padding: 12, borderRadius: 8, backgroundColor: "#555", minWidth: 100 },
  navText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  disabledText: { color: "#ccc" },
  scoreText: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginVertical: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  button: { backgroundColor: "#2196F3", padding: 15, borderRadius: 8 },
  buttonText: { color: "#fff", fontSize: 18, textAlign: "center" },
});
