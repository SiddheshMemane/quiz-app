import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";

export default function QuizScreen() {
  const router = useRouter();
  const { subject, standard, chapter, name, mobile, studentId } = useLocalSearchParams();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Fetch questions from Firestore
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(
          collection(db, "questions"),
          where("subject", "==", subject),
          where("standard", "==", standard),
          where("chapter", "==", chapter)
        );

        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((doc) => doc.data());
        setQuestions(fetched);
      } catch (err) {
        console.error("Error fetching questions:", err);
        Alert.alert("Error", "Could not load quiz questions.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [subject, standard, chapter]);

  const handleNext = () => {
    const currentQuestion = questions[currentIndex];
    if (!selectedOption) {
      Alert.alert("Please select an option before proceeding.");
      return;
    }

    if (selectedOption === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setFinished(true); // show finished screen
      await addDoc(collection(db, "responses"), {
        student_name: name,
        mobile,
        standard,
        subject,
        chapter,
        total_questions: questions.length,
        score,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error saving response:", err);
      Alert.alert("Error", "Could not save your result.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>Loading quiz...</Text>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz Finished 🎉</Text>
        <Text style={styles.scoreText}>
          Your Score: {score} / {questions.length}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/")}
        >
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!questions.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>No questions found for this chapter.</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Q{currentIndex + 1}. {currentQuestion.question_text}
      </Text>

      {currentQuestion.options?.map((opt: string, index: number) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            selectedOption === opt && styles.selectedOption,
          ]}
          onPress={() => setSelectedOption(opt)}
        >
          <Text
            style={[
              styles.optionText,
              selectedOption === opt && { color: "white" },
            ]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentIndex + 1 === questions.length ? "Submit" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  optionButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#2196F3",
    borderRadius: 10,
    marginVertical: 6,
  },
  selectedOption: { backgroundColor: "#2196F3" },
  optionText: { fontSize: 16, color: "#000" },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontSize: 18, textAlign: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scoreText: { fontSize: 20, fontWeight: "bold", marginVertical: 20, textAlign: "center" },
  noData: { textAlign: "center", fontSize: 16, color: "gray" },
});
