"use client";
import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState("");

  const handleGenerateLink = async () => {
    setLoading(true);
    setLink("");

    try {
      const res = await axios.post("/api/generate-link", { deckString: input });
      setLink(res.data.link);
    } catch (error) {
      console.error("Error generating link:", error);
      alert("Failed to generate link. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">
        One Piece TCG → TCGPlayer Link
      </h1>
      <textarea
        className="w-full h-64 p-2 border rounded mb-4"
        placeholder="Paste your deck list here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleGenerateLink}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Link"}
      </button>

      {link && (
        <div className="mt-4">
          <p className="font-semibold">TCGPlayer Link:</p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {link}
          </a>
        </div>
      )}
    </main>
  );
}
