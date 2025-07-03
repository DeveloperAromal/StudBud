"use client";

import { useEffect, useState } from "react";
import axios from "axios";

// Assuming these are valid imports from your UI library
import FlashCardDeck from "@/app/components/includes/FlashcardDeck";
import SingleFlashCard from "@/app/components/includes/SingleFlashCard";

// --- Type Definitions ---

// 1. Type for a single question-answer flashcard
interface Flashcard {
  question: string;
  answer: string;
}

// 2. Type for the 'details' object found at the beginning of the 'content' array
// Made subject and time explicitly string as per usage
interface FlashcardDetails {
  subject: string; // e.g., card.content[0]?.subject
  time: string; // e.g., card.content[0]?.time
  [key: string]: any; // Allows for other unknown properties in details
}

// 3. Type for an item within the 'content' array. It can be a 'details' object or a 'Flashcard'.
type ContentItem = FlashcardDetails | Flashcard;

// 4. Type for a "deck" object as fetched directly from your API response
// This is the shape of each item in the `flashcard` state array.
interface ApiFlashcardDeck {
  _id: string; // Assuming an ID from the database for unique keys
  subject: string; // Top-level subject property (used for setSelectedSubject(card.subject))
  title?: string; // Optional top-level title, if your API returns it like your static data
  progress: number;
  content: ContentItem[]; // The array containing details and actual flashcards
}

// 5. Type for the `selectedDeck` state, which is a processed version of ApiFlashcardDeck
interface SelectedDeck {
  title: string; // Derived from details.subject or top-level title
  cards: Flashcard[]; // Derived from content (filtered to be only Flashcard objects)
}

// --- Assuming FlashCardDeck component props ---
// This is a hypothetical interface for your FlashCardDeck component props.
// You should ensure your actual FlashcardDeck component matches this.
interface FlashCardDeckProps {
  title: string;
  cardsCount: number;
  timeTaken: string;
  progress: number;
  onClick: () => void;
  key: string; // Key prop for React lists
}

// --- Assuming SingleFlashCard component props ---
// This is a hypothetical interface for your SingleFlashCard component props.
// You should ensure your actual SingleFlashCard component matches this.
interface SingleFlashCardProps {
  question_and_answers: Flashcard[];
}

export default function FlashCards() {
  const [selectedDeck, setSelectedDeck] = useState<SelectedDeck | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // Initialize with an empty array or the static data you provided if it's meant to be initial fallback
  const [flashcard, setFlashcard] = useState<ApiFlashcardDeck[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Optionally, if you want your static data to be the initial state
    // and then fetch from API only if localStorage has flash_id,
    // you could do something like this:
    // setFlashcard(initialStaticDecks); // Make initialStaticDecks a constant outside the component

    const fetchFlashcardDecks = async () => {
      const flashId = localStorage.getItem("flash_id");
      if (!flashId) {
        console.warn(
          "⚠️ No flash_id found in localStorage. Using static data or empty."
        );
        // If no flash_id, perhaps load static data or keep it empty
        // setFlashcard(initialStaticDecks); // Uncomment if you have a static data constant
        return;
      }

      try {
        const response = await axios.get<ApiFlashcardDeck[]>(
          `https://studbud-backend-server.onrender.com/api/v1/get/flashcard/${flashId}`
        );
        setFlashcard(response.data);
        console.log("📦 Flashcard data fetched:", response.data);
      } catch (error) {
        console.error("❌ Error fetching flashcard decks:", error);
        // On error, revert to initial static data or clear state
        setFlashcard([]); // Clear or set to initial static if fetching fails
      }
    };

    fetchFlashcardDecks();
  }, []); // Run once on component mount

  return (
    <section className="flashcards p-6 bg-white text-black h-full">
      {/* Conditionally render header based on selectedDeck state */}
      {!selectedDeck && ( // Only show "Flashcard Study" when no deck is selected
        <div className="top">
          <h3 className="text-2xl font-bold">🎯 Flashcard Study</h3>
          <p>Choose a deck to start learning</p>
        </div>
      )}

      <div className="bottom flex flex-wrap w-full gap-2 mt-6">
        {selectedDeck ? (
          // Display single flashcard view
          <div className="activeDeckView w-full h-full">
            <div className="top mb-3 flex items-center justify-between">
              <button
                className="p-2 bg-blue-600 rounded-md text-white font-bold"
                onClick={() => setSelectedDeck(null)} // Clear selectedDeck to go back
              >
                ← Back to all decks
              </button>

              <h4 className="text-lg font-bold">{selectedDeck.title}</h4>

              <button className="p-2 bg-blue-600 rounded-md text-white font-bold">
                Reset
              </button>
            </div>

            <div className="question_and_answer w-full flex justify-center ">
              {/* Ensure SingleFlashCardProps match this */}
              <SingleFlashCard question_and_answers={selectedDeck.cards} />
            </div>
          </div>
        ) : (
          // Display all available flashcard decks
          <>
            {flashcard.length > 0 ? (
              flashcard.map((card, index) => {
                // Safely access the details object if it exists and is the correct type
                const details = card.content[0] as FlashcardDetails | undefined;
                const titleFromDetails = details?.subject;
                const timeFromDetails = details?.time;

                return (
                  // Ensure FlashCardDeckProps match this
                  <FlashCardDeck
                    key={card._id || `deck-${index}`} // Use _id for unique key, fallback to index
                    title={
                      card.title ||
                      titleFromDetails ||
                      card.subject ||
                      "Untitled Deck"
                    }
                    cardsCount={
                      // Filter out non-Flashcard items to get accurate count
                      (card.content || []).filter(
                        (item): item is Flashcard =>
                          "question" in item && "answer" in item
                      ).length
                    }
                    timeTaken={timeFromDetails || "N/A"}
                    progress={card.progress || 0}
                    onClick={() => {
                      // Filter out only the actual flashcard questions and answers
                      const qaCards: Flashcard[] = (card.content || []).filter(
                        (item): item is Flashcard =>
                          typeof item === "object" &&
                          item !== null &&
                          "question" in item &&
                          typeof (item as Flashcard).question === "string" &&
                          "answer" in item &&
                          typeof (item as Flashcard).answer === "string"
                      );

                      setSelectedDeck({
                        title:
                          card.title ||
                          titleFromDetails ||
                          card.subject ||
                          "Untitled Deck",
                        cards: qaCards,
                      });
                      setSelectedSubject(card.subject); // Use top-level subject
                    }}
                  />
                );
              })
            ) : (
              <p className="text-gray-500 w-full text-center mt-8">
                No flashcard decks available. Create one!
              </p>
            )}

            {/* "Create new deck" card */}
            <div
              className="addnewdeck w-1/3 max-w-[30%] hover:scale-105 bg-zinc-100 drop-shadow-md hover:drop-shadow-lg border-dashed border-2 border-gray-300 hover:border-2 hover:border-sky-500 transition-all duration-100z p-4 rounded-md cursor-pointer flex flex-col items-center justify-center min-h-[150px]"
              onClick={() => setShowModal(true)}
            >
              <div className="texts flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-4xl font-extrabold text-gray-300">+</h2>
                <h4 className="text-lg font-medium">Create new deck</h4>
                <p className="text-sm text-gray-400">
                  build your own flashcard collection
                </p>
              </div>
            </div>

            {/* Modal for creating a new deck */}
            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-lg w-[400px] relative">
                  <button
                    className="absolute top-2 right-3 text-gray-600 text-xl"
                    onClick={() => setShowModal(false)}
                  >
                    ×
                  </button>
                  <h3 className="text-xl font-bold mb-4">🧠 Create New Deck</h3>

                  <div className="mb-4">
                    <label className="block mb-1 text-sm font-semibold text-gray-700">
                      📺 YouTube Video Link
                    </label>
                    <input
                      type="text"
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      value={youtubeUrl}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      placeholder="Paste your YouTube link"
                    />
                  </div>

                  <button
                    className="w-full mt-2 bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition-all"
                    onClick={async () => {
                      if (!youtubeUrl)
                        return alert("Please paste a YouTube link first.");

                      try {
                        setLoading(true);
                        interface PostFlashcardResponse {
                          flash_id?: string;
                          // Add other properties that the POST response might have
                        }

                        const response =
                          await axios.post<PostFlashcardResponse>(
                            "https://studbud-backend-server.onrender.com/api/v1/generate/flashcard",
                            { videoUrl: youtubeUrl }
                          );

                        const newFlashId =
                          response.data.flash_id ||
                          "766faffd-4706-4c82-ac86-0b667117a2d7";
                        localStorage.setItem("flash_id", newFlashId);
                        setLoading(false);

                        console.log(
                          "✅ flash_id saved in localStorage:",
                          newFlashId
                        );

                        // Refetch decks to include the newly created one
                        const updatedDecksResponse = await axios.get<
                          ApiFlashcardDeck[]
                        >(
                          `https://studbud-backend-server.onrender.com/api/v1/get/flashcard/${newFlashId}`
                        );
                        setFlashcard(updatedDecksResponse.data);

                        // Optional: reset and close modal
                        setYoutubeUrl("");
                        setShowModal(false);
                      } catch (error) {
                        console.error(
                          "❌ Failed to generate flashcards:",
                          error
                        );
                        alert(
                          "Failed to generate flashcards. Please try again."
                        );
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading} // Disable button when loading
                  >
                    {loading ? "Generating..." : "Generate"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// --- Initial Static Data (Optional, for development/fallback) ---
// If you want to use this data as an initial fallback, you can uncomment and
// set your `flashcard` state to this array initially.
const initialStaticDecks: ApiFlashcardDeck[] = [
  {
    _id: "deck-001",
    title: "Biology Basics", // Top-level title for convenience
    progress: 70,
    subject: "Biology",
    content: [
      { subject: "Biology", time: "8" }, // details object
      { question: "What is the basic unit of life?", answer: "Cell" },
      { question: "What does DNA stand for?", answer: "Deoxyribonucleic Acid" },
      {
        question: "What organelle is the powerhouse of the cell?",
        answer: "Mitochondria",
      },
      {
        question: "What is the process of cell division called?",
        answer: "Mitosis",
      },
      {
        question: "Which system is responsible for transporting blood?",
        answer: "Circulatory system",
      },
      {
        question: "What is the function of red blood cells?",
        answer: "Transport oxygen",
      },
      {
        question: "What is osmosis?",
        answer: "Movement of water through a semipermeable membrane",
      },
    ],
  },
  {
    _id: "deck-002",
    title: "Math Essentials",
    progress: 40,
    subject: "Maths",
    content: [
      { subject: "Maths", time: "10" },
      { question: "What is 7 x 8?", answer: "56" },
      { question: "What is the value of π?", answer: "Approximately 3.1416" },
      { question: "Solve: 12 + 5 x 2", answer: "22" },
      { question: "What is the square root of 64?", answer: "8" },
      { question: "What is 15% of 200?", answer: "30" },
      { question: "What is the formula for area of a circle?", answer: "πr²" },
      { question: "What is 10 to the power of 0?", answer: "1" },
    ],
  },
  {
    _id: "deck-003",
    title: "History Overview",
    progress: 90,
    subject: "History",
    content: [
      { subject: "History", time: "6" },
      {
        question: "Who was the first President of the USA?",
        answer: "George Washington",
      },
      { question: "When did World War II end?", answer: "1945" },
      { question: "Who discovered America?", answer: "Christopher Columbus" },
      { question: "What wall fell in 1989?", answer: "Berlin Wall" },
      {
        question: "Who was the leader of Nazi Germany?",
        answer: "Adolf Hitler",
      },
      {
        question: "When was the Declaration of Independence signed?",
        answer: "1776",
      },
      {
        question: "Who was the first emperor of Rome?",
        answer: "Augustus Caesar",
      },
    ],
  },
  {
    _id: "deck-004",
    title: "Physics Formulas",
    progress: 55,
    subject: "Physics",
    content: [
      { subject: "Physics", time: "11" },
      { question: "What is Newton's Second Law?", answer: "F = ma" },
      { question: "Speed formula?", answer: "Speed = Distance / Time" },
      { question: "What is the unit of force?", answer: "Newton" },
      { question: "Formula for potential energy?", answer: "PE = mgh" },
      { question: "What is Ohm's Law?", answer: "V = IR" },
      { question: "What is the speed of light?", answer: "3 x 10⁸ m/s" },
      { question: "Acceleration formula?", answer: "a = (v - u) / t" },
    ],
  },
  {
    _id: "deck-005",
    title: "Chemistry Core",
    progress: 60,
    subject: "Chemistry",
    content: [
      { subject: "Chemistry", time: "7" },
      { question: "Symbol for Sodium?", answer: "Na" },
      { question: "Atomic number of Oxygen?", answer: "8" },
      { question: "pH of neutral water?", answer: "7" },
      { question: "Formula for common salt?", answer: "NaCl" },
      { question: "Name of H2O2?", answer: "Hydrogen Peroxide" },
      { question: "Symbol for Iron?", answer: "Fe" },
      {
        question: "What is an acid?",
        answer: "A substance with pH less than 7",
      },
    ],
  },
  {
    _id: "deck-006",
    title: "English Grammar",
    progress: 75,
    subject: "English",
    content: [
      { subject: "English", time: "9" },
      { question: "What is a noun?", answer: "A person, place, or thing" },
      { question: "Give an example of a verb.", answer: "Run, eat, think..." },
      {
        question: "What is an adjective?",
        answer: "A word that describes a noun",
      },
      { question: "What is a synonym for 'happy'?", answer: "Joyful" },
      { question: "Define a pronoun.", answer: "A word that replaces a noun" },
      {
        question: "What is a conjunction?",
        answer: "A word that connects clauses",
      },
      {
        question: "What is a preposition?",
        answer: "A word showing relation to time/place",
      },
    ],
  },
];
