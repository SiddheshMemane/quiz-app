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
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

export default function QuizScreen() {
  const router = useRouter();
  const { subject, standard, chapter, name, mobile, studentId } = useLocalSearchParams();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(true);
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
        setAnswers(new Array(fetched.length).fill(null)); // initialize empty answers
      } catch (err) {
        console.error("Error fetching questions:", err);
        Alert.alert("Error", "Could not load quiz questions.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [subject, standard, chapter]);

  const handleOptionSelect = (option: string) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = option;
    setAnswers(updatedAnswers);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const totalQuestions = questions.length;
      const score = answers.reduce((count, ans, idx) => {
        return ans === questions[idx].answer ? count + 1 : count;
      }, 0);

      setFinished(true);

      await addDoc(collection(db, "responses"), {
        student_name: name,
        mobile,
        standard,
        subject,
        chapter,
        total_questions: totalQuestions,
        score,
        answers,
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
    const total = questions.length;
    const score = answers.filter((ans, i) => ans === questions[i].answer).length;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz Finished 🎉</Text>
        <Text style={styles.scoreText}>
          Your Score: {score} / {total}
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push({
          pathname: "/chapters",
          params: { name, mobile, studentId, standard },
        })}>
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
  const selectedOption = answers[currentIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Q{currentIndex + 1}. {currentQuestion.question_text}
      </Text>

      <View style={styles.optionsContainer}>
        {currentQuestion.options?.map((opt: string, index: number) => {
          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
          const isSelected = selectedOption === opt;

          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionRow, isSelected && styles.selectedRow]}
              onPress={() => handleOptionSelect(opt)}
            >
              <View
                style={[styles.radioCircle, isSelected && styles.selectedCircle]}
              >
                {isSelected && <View style={styles.innerCircle} />}
              </View>
              <Text style={styles.optionLabel}>{optionLabel}.</Text>
              <Text
                style={[
                  styles.optionText,
                  isSelected && { color: "#2196F3", fontWeight: "600" },
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && { opacity: 0.5 }]}
          disabled={currentIndex === 0}
          onPress={handlePrev}
        >
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex + 1 === questions.length ? "Submit" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
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
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  selectedOption: { backgroundColor: "#2196F3" },
  // optionText: { fontSize: 16, color: "#000" },
  navContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  navButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    flex: 0.45,
  },
  buttonText: { color: "#fff", fontSize: 16, textAlign: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scoreText: { fontSize: 20, fontWeight: "bold", marginVertical: 20, textAlign: "center" },
  noData: { textAlign: "center", fontSize: 16, color: "gray" },
  optionsContainer: {
    marginTop: 10,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedRow: {
    borderColor: "#2196F3",
    backgroundColor: "#E3F2FD",
  },
  radioCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  selectedCircle: {
    borderColor: "#2196F3",
  },
  innerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#2196F3",
  },
  optionLabel: {
    fontWeight: "600",
    marginRight: 6,
    color: "#000",
    fontSize: 16,
  },
  optionText: {
    flexShrink: 1,
    fontSize: 16,
    color: "#333",
  },

});
