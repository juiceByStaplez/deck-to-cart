// File: src/app/deck-filter/page.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import fuzzysort from "fuzzysort";

interface Card {
  id: number;
  name: string;
  cardId: string;
}

interface DeckEntry {
  cardCode: string;
  quantity: number;
}

interface Deck {
  title: string;
  cards: DeckEntry[];
  url?: string;
}

export default function DeckFilterPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [search, setSearch] = useState("");
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [filteredDecks, setFilteredDecks] = useState<Deck[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("cards-cache");
    const cachedAt = localStorage.getItem("cards-cache-timestamp");

    if (cached && cachedAt) {
      const age = Date.now() - parseInt(cachedAt, 10);
      const oneDay = 1000 * 60 * 60 * 24;

      if (age < oneDay) {
        setCards(JSON.parse(cached));
      } else {
        localStorage.removeItem("cards-cache");
        localStorage.removeItem("cards-cache-timestamp");
      }
    }

    if (!cached || !cachedAt) {
      fetch("/api/cards")
        .then((res) => res.json())
        .then((data) => {
          setCards(data);
          localStorage.setItem("cards-cache", JSON.stringify(data));
          localStorage.setItem("cards-cache-timestamp", Date.now().toString());
        });
    }

    fetch("/data/gumgum_decks.json")
      .then((res) => res.json())
      .then(setDecks);
  }, []);
  const runSearch = (value: string) => {
    const lowerValue = value.toLowerCase();

    const results = fuzzysort.go(value, cards, {
      keys: ["name", "cardId"],
      threshold: -20,
    });

    const boosted = results.map((result) => {
      const { name } = result.obj;
      const nameLower = name.toLowerCase();

      let priority = 2; // default

      if (nameLower === lowerValue) {
        priority = 0; // exact name match
      } else if (nameLower.startsWith(lowerValue)) {
        priority = 1; // name prefix match
      }

      return { ...result, priority };
    });

    const sorted = boosted
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.score - b.score;
      })
      .map((r) => r.obj);

    setFilteredCards(sorted);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => runSearch(value), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredCards.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredCards.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + filteredCards.length) % filteredCards.length
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectCard(filteredCards[highlightedIndex]);
    }
  };

  const handleSelectCard = (card: Card) => {
    setSelectedCard(card);
    const matchingDecks = decks.filter((deck) =>
      deck.cards.some((c) => c.cardCode === card.cardId)
    );
    setFilteredDecks(matchingDecks);
    setSearch("");
    setFilteredCards([]);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const deckCount = useMemo(() => {
    if (!selectedCard) return 0;
    return decks.filter((deck) =>
      deck.cards.some((c) => c.cardCode === selectedCard.cardId)
    ).length;
  }, [selectedCard, decks]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Deck Filter</h1>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for a card..."
        value={search}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="border p-2 w-full mb-2"
      />

      {filteredCards.length > 0 && (
        <ul className="border rounded p-2 mb-4 max-h-60 overflow-y-auto">
          {filteredCards.map((card, index) => (
            <li
              key={card.id}
              className={`cursor-pointer p-1 text-indigo-900 ${
                index === highlightedIndex
                  ? "bg-indigo-100"
                  : "hover:bg-indigo-50"
              }`}
              onClick={() => handleSelectCard(card)}
            >
              {card.name} ({card.cardId})
            </li>
          ))}
        </ul>
      )}

      {selectedCard && (
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Decks containing: {selectedCard.name} ({selectedCard.cardId}) —{" "}
            {deckCount} deck{deckCount !== 1 && "s"}
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            {filteredDecks.map((deck, i) => (
              <li key={i}>
                {deck.title}
                {deck.url && (
                  <a
                    href={deck.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-sm text-blue-600 hover:underline"
                  >
                    (View Full Decklist)
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
