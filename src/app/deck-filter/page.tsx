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
    fetch("/api/cards")
      .then((res) => res.json())
      .then(setCards);

    fetch("/data/gumgum_decks.json")
      .then((res) => res.json())
      .then(setDecks);
  }, []);

  const runSearch = (value: string) => {
    const results = fuzzysort.go(value, cards, {
      keys: ["name", "cardId"],
      threshold: -10000,
      limit: 10,
    });
    setFilteredCards(results.map((result) => result.obj));
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
    <div className="p-4 max-w-screen-md mx-auto w-full">
      <h1 className="text-xl font-bold mb-4 text-center sm:text-left">
        Deck Filter
      </h1>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for a card..."
        value={search}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="border p-2 w-full mb-2 rounded"
      />

      {filteredCards.length > 0 && (
        <ul className="border rounded p-2 mb-4 divide-y">
          {filteredCards.map((card, index) => (
            <li
              key={card.id}
              className={`cursor-pointer p-2 text-indigo-900 ${
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
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2 text-center sm:text-left">
            Decks containing: {selectedCard.name} ({selectedCard.cardId}) —{" "}
            {deckCount} deck{deckCount !== 1 && "s"}
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            {filteredDecks.map((deck, i) => (
              <li
                key={i}
                className="flex flex-col sm:flex-row sm:items-center sm:gap-2"
              >
                <span>{deck.title}</span>
                {deck.url && (
                  <a
                    href={deck.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
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
