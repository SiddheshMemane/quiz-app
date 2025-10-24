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

  // 🔹 Get all params
  const {
    name,
    mobile,
    studentId,
    testType,
    standard,
    subject,
    chapter,
    topic,
    examType,
    difficulty,
    subjects,
    chapters,
  } = useLocalSearchParams();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);

  // 🔹 Fetch questions based on test type
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        let q;

        if (testType === "practice") {
          // 👉 Practice Test: filter by single subject + topic
          if (!standard || !subject || !chapter) {
            console.warn("Missing fields for practice query:", { standard, subject, chapter });
            setLoading(false);
            Alert.alert("Missing fields", "Please select all fields before starting the quiz.");
            return;
          }
          const filters = [
            where("standard", "==", standard),
            where("subject", "==", subject),
            where("chapter", "==", chapter),
          ];

          if (topic) filters.push(where("topic", "==", topic));

          q = query(collection(db, "questions"), ...filters);
        } else {
          // 👉 Competitive Test: multiple subjects + chapters + difficulty
          if (!standard || !subjects || !chapters) {
            console.warn("Missing fields for practice query:", { standard, subject, chapter });
            setLoading(false);
            Alert.alert("Missing fields", "Please select all fields before starting the quiz.");
            return;
          }
          const subjectsArray = subjects ? JSON.parse(subjects as string) : [];
          const chaptersArray = chapters ? JSON.parse(chapters as string) : [];


          const qBase = query(collection(db, "questions"), where("standard", "==", standard));
          const snapshot = await getDocs(qBase);

          // Client-side filtering (since Firestore can't OR across arrays)
          const filtered = snapshot.docs
            .map((doc) => doc.data())
            .filter((data) => {
              const matchSubject = subjectsArray.includes(data.subject);
              const matchChapter = chaptersArray.includes(data.chapter);
              const matchExamType =
                !examType || (data.question_type && data.question_type.includes(examType));
              const matchDifficulty =
                !difficulty || data.question_level === difficulty;

              return matchSubject && matchChapter && matchExamType && matchDifficulty;
            });

          setQuestions(filtered);
          setQuestionCount(filtered.length);

          setAnswers(new Array(filtered.length).fill(null));
          setLoading(false);
          return;
        }

        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((doc) => doc.data());

        setQuestions(fetched);
        setQuestionCount(fetched.length);
        setAnswers(new Array(fetched.length).fill(null));
      } catch (err) {
        console.error("Error fetching questions:", err);
        Alert.alert("Error", "Could not load quiz questions.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [testType, subject, chapter, topic, examType, difficulty, subjects, chapters]);

  // 🔹 Option Selection
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

  // 🔹 Submit Answers
  const handleSubmit = async () => {
    try {
      const totalQuestions = questions.length;
      const score = answers.reduce(
        (count, ans, idx) => (ans === questions[idx].answer ? count + 1 : count),
        0
      );

      setFinished(true);

      await addDoc(collection(db, "responses"), {
        student_name: name,
        mobile,
        studentId,
        testType,
        standard,
        subject,
        chapter,
        topic: topic || null,
        examType: examType || null,
        difficulty: difficulty || null,
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

  // 🔹 Loading UI
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>Loading quiz...</Text>
      </View>
    );
  }

  // 🔹 No Questions Found
  if (!questions.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>No questions found for this selection.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/chapters",
              params: { name, mobile, studentId, standard },
            })
          }
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 🔹 Quiz Finished
  if (finished) {
    const total = questions.length;
    const score = answers.filter((ans, i) => ans === questions[i].answer).length;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz Finished 🎉</Text>
        <Text style={styles.scoreText}>
          Your Score: {score} / {total}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/chapters",
              params: { name, mobile, studentId, standard },
            })
          }
        >
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 🔹 Render Current Question
  const currentQuestion = questions[currentIndex];
  const selectedOption = answers[currentIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Q{currentIndex + 1}. {currentQuestion.question_text}
      </Text>
      {/* {console.log(currentQuestion)}
      <Text style={styles.countText}>Total Questions: {questionCount}</Text>
      <Text style={styles.countText}>Exam type Questions: {currentQuestion.question_type}</Text>
      <Text style={styles.countText}>Difficulty level of Questions: {currentQuestion.question_level}</Text>
      <Text style={styles.countText}>Topic Questions: {currentQuestion.topic}</Text>
      <Text style={styles.countText}>Chapter Questions: {currentQuestion.chapter}</Text> */}



      <View style={styles.optionsContainer}>
        {currentQuestion.options?.map((opt: string, index: number) => {
          const optionLabel = String.fromCharCode(65 + index);
          const isSelected = selectedOption === opt;

          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionRow, isSelected && styles.selectedRow]}
              onPress={() => handleOptionSelect(opt)}
            >
              <View style={[styles.radioCircle, isSelected && styles.selectedCircle]}>
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scoreText: { fontSize: 20, fontWeight: "bold", marginVertical: 20, textAlign: "center" },
  noData: { textAlign: "center", fontSize: 16, color: "gray", marginBottom: 20 },
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600", textAlign: "center" },
  optionsContainer: { marginTop: 10 },
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
  selectedRow: { borderColor: "#2196F3", backgroundColor: "#E3F2FD" },
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
  selectedCircle: { borderColor: "#2196F3" },
  innerCircle: { height: 10, width: 10, borderRadius: 5, backgroundColor: "#2196F3" },
  optionLabel: { fontWeight: "600", marginRight: 6, color: "#000", fontSize: 16 },
  optionText: { flexShrink: 1, fontSize: 16, color: "#333" },
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
  countText: {
  fontSize: 14,
  color: "#666",
  textAlign: "right",
  marginBottom: 10,
},
});
