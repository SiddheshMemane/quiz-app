import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Picker } from "@react-native-picker/picker";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export default function Index() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [standard, setStandard] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!mobile) {
      Alert.alert("Please enter your mobile number");
      return;
    }

    setLoading(true);
    try {
      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("mobile", "==", Number(mobile)));
      const snapshot = await getDocs(q);

      let studentId = null;

      if (mode === "login") {
        if (snapshot.empty) {
          Alert.alert("No student found", "Please sign up first.");
          setLoading(false);
          return;
        }
        const student = snapshot.docs[0].data();
        studentId = snapshot.docs[0].id;

        // Go to next screen with existing data
        router.push({
          pathname: "/chapters",
          params: {
            studentId,
            name: student.name,
            mobile: student.mobile,
            standard: student.standard,
          },
        });
      } else {
        // Signup mode
        if (!name || !standard) {
          Alert.alert("Please fill all mandatory fields (Name, Standard)");
          setLoading(false);
          return;
        }

        let studentDoc;
        if (!snapshot.empty) {
          // Already exists, reuse
          studentId = snapshot.docs[0].id;
          studentDoc = snapshot.docs[0].data();
        } else {
          const docRef = await addDoc(studentsRef, {
            name,
            email: email || "",
            mobile: Number(mobile),
            standard,
          });
          studentId = docRef.id;
          studentDoc = { name, mobile, standard };
        }

        router.push({
          pathname: "/chapters",
          params: {
            studentId,
            name: studentDoc.name,
            mobile: studentDoc.mobile,
            standard: studentDoc.standard,
          },
        });
      }
    } catch (err) {
      console.error("Firestore error:", err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Quiz App</Text>

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, mode === "login" && styles.activeTab]}
          onPress={() => setMode("login")}
        >
          <Text style={styles.toggleText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, mode === "signup" && styles.activeTab]}
          onPress={() => setMode("signup")}
        >
          <Text style={styles.toggleText}>Signup</Text>
        </TouchableOpacity>
      </View>

      {/* Common Field */}
      <TextInput
        style={styles.input}
        placeholder="Enter Mobile Number"
        keyboardType="numeric"
        value={mobile}
        onChangeText={setMobile}
      />

      {mode === "signup" && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Email (Optional)"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Text style={styles.label}>Select Standard</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={standard} onValueChange={setStandard}>
              <Picker.Item label="Select Standard" value="" />
              <Picker.Item label="11" value="11" />
              <Picker.Item label="12" value="12" />
            </Picker>
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.button, loading && { backgroundColor: "#aaa" }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Please Wait..." : mode === "login" ? "Login" : "Signup"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  toggleContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  toggleButton: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#2196F3",
  },
  toggleText: { fontSize: 18, color: "#333" },
  label: { fontSize: 16, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, textAlign: "center" },
});
