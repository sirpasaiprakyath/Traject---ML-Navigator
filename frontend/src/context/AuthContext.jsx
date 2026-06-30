/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  db, 
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Detect if Firebase configuration is using placeholder keys
const isFirebaseMock = 
  !import.meta.env.VITE_FIREBASE_API_KEY || 
  import.meta.env.VITE_FIREBASE_API_KEY.includes("your-firebase-api-key") ||
  import.meta.env.VITE_FIREBASE_API_KEY === "mock-api-key";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    if (isFirebaseMock) {
      try {
        const localUser = JSON.parse(localStorage.getItem("traject_user"));
        if (localUser) {
          localUser.getIdToken = async () => "mock-jwt-token";
          return localUser;
        }
      } catch (err) {
        console.error("Error parsing user from localStorage", err);
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(!isFirebaseMock);
  const [profileData, setProfileData] = useState(() => {
    if (isFirebaseMock) {
      try {
        return JSON.parse(localStorage.getItem("traject_profile")) || { onboardingComplete: false };
      } catch (err) {
        console.error("Error parsing profile from localStorage", err);
      }
    }
    return null;
  });

  // Sign up with email & password
  async function signup(email, password, name) {
    if (isFirebaseMock) {
      const mockCred = {
        user: {
          uid: "mock-user-123",
          email: email,
          displayName: name,
          getIdToken: async () => "mock-jwt-token"
        }
      };
      localStorage.setItem("traject_user", JSON.stringify(mockCred.user));
      const initProfile = {
        name: name,
        email: email,
        onboardingComplete: false,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("traject_profile", JSON.stringify(initProfile));
      
      setCurrentUser(mockCred.user);
      setProfileData(initProfile);
      return mockCred;
    }

    return createUserWithEmailAndPassword(auth, email, password)
      .then(async (credential) => {
        const userRef = doc(db, "users", credential.user.uid);
        await setDoc(userRef, {
          name: name,
          email: email,
          onboardingComplete: false,
          createdAt: new Date().toISOString()
        }, { merge: true });
        return credential;
      });
  }

  // Log in with email & password
  async function login(email, password) {
    if (isFirebaseMock) {
      const mockUser = {
        uid: "mock-user-123",
        email: email,
        displayName: "MLE Student",
        getIdToken: async () => "mock-jwt-token"
      };
      localStorage.setItem("traject_user", JSON.stringify(mockUser));
      const existingProfile = JSON.parse(localStorage.getItem("traject_profile")) || { onboardingComplete: false };
      
      setCurrentUser(mockUser);
      setProfileData(existingProfile);
      return { user: mockUser };
    }

    return signInWithEmailAndPassword(auth, email, password);
  }

  // Log in with Google
  async function loginWithGoogle() {
    if (isFirebaseMock) {
      const mockUser = {
        uid: "mock-user-123",
        email: "google.student@traject.dev",
        displayName: "Google MLE Student",
        getIdToken: async () => "mock-jwt-token"
      };
      localStorage.setItem("traject_user", JSON.stringify(mockUser));
      const existingProfile = JSON.parse(localStorage.getItem("traject_profile")) || { onboardingComplete: false };
      
      setCurrentUser(mockUser);
      setProfileData(existingProfile);
      return { user: mockUser };
    }

    return signInWithPopup(auth, googleProvider)
      .then(async (credential) => {
        const userRef = doc(db, "users", credential.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            name: credential.user.displayName || "MLE Student",
            email: credential.user.email,
            onboardingComplete: false,
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
        return credential;
      });
  }

  // Log out
  async function logout() {
    if (isFirebaseMock) {
      localStorage.removeItem("traject_user");
      setCurrentUser(null);
      setProfileData(null);
      return;
    }

    setProfileData(null);
    return signOut(auth);
  }

  // Refresh profile data manually (e.g. after onboarding completion)
  async function refreshProfile() {
    if (isFirebaseMock) {
      const data = JSON.parse(localStorage.getItem("traject_profile"));
      setProfileData(data);
      return data;
    }

    if (!auth.currentUser) return null;
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfileData(data);
        return data;
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
    return null;
  }

  useEffect(() => {
    if (isFirebaseMock) {
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setProfileData(userSnap.data());
          } else {
            setProfileData({ onboardingComplete: false });
          }
        } catch (err) {
          console.error("Error checking user profile in state change:", err);
          // If firestore fails (rules, connection), fallback to localStorage so demo can run
          const localProfile = JSON.parse(localStorage.getItem("traject_profile")) || { onboardingComplete: false };
          setProfileData(localProfile);
        }
      } else {
        setProfileData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    profileData,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    refreshProfile,
    isFirebaseMock
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
