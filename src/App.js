import React, { useRef, useState, useEffect } from "react";
import "./App.css";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

// Firebase Configuration
firebase.initializeApp({
  apiKey: "AIzaSyB9fEfQViWyOTdILLQLVTH4-iodqzP6ARE",
  authDomain: "food-app-41600.firebaseapp.com",
  projectId: "food-app-41600",
  storageBucket: "food-app-41600.appspot.com",
  messagingSenderId: "969413251152",
  appId: "1:969413251152:web:bae2c264500e03dfa80155",
});

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>CodeTach</h1>
        <SignOut />
      </header>

      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </>
  );
}

function SignOut() {
  return (
    auth.currentUser && (
      <button className="sign-out" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    )
  );
}

function ChatRoom() {
  const dummy = useRef();
  const messagesRef = firestore.collection("messages");
  const typingRef = firestore.collection("typing"); // Track typing users
  const query = messagesRef.orderBy("createdAt").limit(50);

  const [messages] = useCollectionData(query, { idField: "id" });
  const [formValue, setFormValue] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const { uid } = auth.currentUser;
  
    // Clean up typing status on unmount
    return () => {
      typingRef.doc(uid).delete();
    };
  }, []);
  

  useEffect(() => {
    // Listen for typing users
    const unsubscribe = typingRef.onSnapshot((snapshot) => {
      const typing = snapshot.docs.map((doc) => doc.data());
      setTypingUsers(typing);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
      seenBy: [],
    });

    setFormValue("");
    dummy.current.scrollIntoView({ behavior: "smooth" });

    // Remove typing status after sending
    typingRef.doc(uid).delete();
  };

  const handleTyping = async (value) => {
    setFormValue(value);

    const { uid, displayName } = auth.currentUser;

    if (value) {
      await typingRef.doc(uid).set({
        displayName,
        uid,
      });
    } else {
      await typingRef.doc(uid).delete();
    }
  };

  return (
    <>
      <main>
        {messages &&
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} messagesRef={messagesRef} />
          ))}

        {/* Display Typing Users */}
        {typingUsers.map((user) =>
          user.uid !== auth.currentUser.uid ? (
            <p key={user.uid} className="typing-indicator">
              {user.displayName} is typing...
            </p>
          ) : null
        )}
        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type your message"
        />
        <button type="submit" disabled={!formValue}>
          Submit
        </button>
      </form>
    </>
  );
}


function ChatMessage({ message, messagesRef }) {
  const { text, uid, photoURL, id, seenBy } = message;
  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";
  const [showModal, setShowModal] = useState(false);
  const [seenUsers, setSeenUsers] = useState([]);

  // Observer to mark the message as "seen"
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          const messageRef = messagesRef.doc(id);
          await messageRef.update({
            seenBy: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid),
          });
        }
      },
      { threshold: 1.0 }
    );

    const element = document.getElementById(`message-${id}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [id, messagesRef]);

  // Fetch users in `seenBy`
  const handleInfoClick = async () => {
    try {
      if (seenBy && seenBy.length > 0) {
        const userRefs = seenBy.map((userId) => firestore.collection("users").doc(userId));
        const usersSnapshot = await Promise.all(userRefs.map((ref) => ref.get()));

        const usersData = usersSnapshot
          .filter((snapshot) => snapshot.exists) // Ensure valid documents
          .map((snapshot) => snapshot.data()); // Get user data

        setSeenUsers(usersData);
      } else {
        setSeenUsers([]); // Empty if no one has seen it
      }

      setShowModal(true);
    } catch (error) {
      console.error("Error fetching seen users:", error);
    }
  };

  return (
    <>
      <div className={`message ${messageClass}`} id={`message-${id}`}>
        <img src={photoURL || "https://placekitten.com/50/50"} alt="User" />
        <p>{text}</p>
        {messageClass === "sent" && (
          <button className="message-options" onClick={handleInfoClick}>
            •••
          </button>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Seen by:</h3>
            {seenUsers.length > 0 ? (
              seenUsers.map((user, index) => (
                <div key={index} className="seen-user">
                  <p>{user.displayName || "Unknown User"}</p>
                </div>
              ))
            ) : (
              <p>No one has seen this message yet.</p>
            )}
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}


export default App;
