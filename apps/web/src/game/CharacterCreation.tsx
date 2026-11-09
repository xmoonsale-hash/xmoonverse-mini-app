import { useState, type CSSProperties, type FormEvent } from "react";
import {
  createCharacter,
  type CharacterClass,
  type CreateCharacterResponse,
} from "../platform/game";

type CharacterCreationProps = {
  sessionToken: string;
  onCreated: (data: CreateCharacterResponse) => void;
};

type ClassOption = {
  id: CharacterClass;
  name: string;
  icon: string;
  description: string;
  role: string;
};

const classes: ClassOption[] = [
  {
    id: "warrior",
    name: "Воин",
    icon: "⚔️",
    description: "Сражается в первых рядах и не отступает перед опасностью.",
    role: "Ближний бой",
  },
  {
    id: "ranger",
    name: "Следопыт",
    icon: "🏹",
    description: "Исследует неизведанные земли и поражает врагов на расстоянии.",
    role: "Дальний бой",
  },
  {
    id: "mage",
    name: "Маг",
    icon: "✦",
    description: "Изучает тайны магии и управляет мистической энергией.",
    role: "Магия",
  },
  {
    id: "adventurer",
    name: "Искатель",
    icon: "🌙",
    description: "Универсальный путешественник, готовый к любым испытаниям.",
    role: "Универсальный",
  },
];

const styles: Record<string, CSSProperties> = {
  container: {
    position: "relative",
    display: "flex",
    width: "100%",
    minHeight: "min(68vh, 650px)",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    overflow: "hidden",
    padding: "28px 18px",
    border: "1px solid rgba(190, 105, 255, 0.75)",
    borderRadius: 22,
    background:
      "radial-gradient(ellipse at 50% 0%, rgba(120, 48, 210, .25), transparent 60%), linear-gradient(145deg, rgba(27, 10, 65, .97), rgba(11, 4, 34, .99))",
    boxShadow:
      "0 0 8px rgba(183, 95, 255, .65), 0 0 24px rgba(139, 43, 255, .3)",
  },
  content: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    width: "100%",
    maxWidth: 440,
    flexDirection: "column",
    gap: 18,
  },
  heading: {
    margin: 0,
    color: "#fff8ff",
    fontSize: "clamp(25px, 6vw, 34px)",
    fontWeight: 800,
    textAlign: "center",
    textShadow: "0 0 18px rgba(168, 91, 255, .55)",
  },
  subtitle: {
    margin: 0,
    color: "#c7b4df",
    fontSize: 13,
    lineHeight: 1.7,
    textAlign: "center",
  },
  eyebrow: {
    margin: 0,
    color: "#ce8cff",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 3,
    textAlign: "center",
  },
  label: {
    display: "block",
    marginBottom: 8,
    color: "#e8c5ff",
    fontSize: 12,
    fontWeight: 700,
  },
  input: {
    width: "100%",
    minHeight: 48,
    padding: "0 14px",
    border: "1px solid rgba(177, 105, 255, .55)",
    borderRadius: 12,
    outline: "none",
    background: "rgba(8, 3, 27, .8)",
    color: "#fff8ff",
    font: "inherit",
    fontSize: 14,
  },
  classGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  classCard: {
    display: "flex",
    minWidth: 0,
    minHeight: 145,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 7,
    padding: 12,
    border: "1px solid rgba(177, 105, 255, .35)",
    borderRadius: 14,
    background: "rgba(18, 5, 43, .75)",
    color: "#fff8ff",
    textAlign: "left",
    cursor: "pointer",
    transition: "border-color 160ms ease, background 160ms ease",
  },
  selectedCard: {
    border: "1px solid #d29aff",
    background:
      "linear-gradient(145deg, rgba(91, 34, 166, .55), rgba(25, 7, 59, .9))",
    boxShadow: "0 0 10px rgba(183, 95, 255, .4)",
  },
  classIcon: {
    fontSize: 25,
    lineHeight: 1.2,
  },
  className: {
    fontSize: 14,
    fontWeight: 800,
  },
  classRole: {
    color: "#ce8cff",
    fontSize: 10,
    fontWeight: 700,
  },
  classDescription: {
    color: "#c7b4df",
    fontSize: 10,
    lineHeight: 1.5,
  },
  submit: {
    width: "100%",
    minHeight: 50,
    border: "1px solid #d29aff",
    borderRadius: 13,
    background: "linear-gradient(135deg, #8538d5, #4b168d)",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 0 14px rgba(155, 59, 255, .45)",
  },
  error: {
    margin: 0,
    padding: 11,
    border: "1px solid rgba(255, 119, 119, .45)",
    borderRadius: 10,
    background: "rgba(100, 20, 35, .25)",
    color: "#ffaaaa",
    fontSize: 12,
    lineHeight: 1.5,
    textAlign: "center",
  },
  hint: {
    margin: 0,
    color: "#917eae",
    fontSize: 10,
    lineHeight: 1.5,
    textAlign: "center",
  },
};

function getErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    api_not_configured: "Игровой сервер пока не настроен.",
    network_error: "Не удалось связаться с сервером. Проверь соединение.",
    session_invalid: "Игровая сессия завершилась. Попробуй войти заново.",
    character_exists: "У тебя уже есть персонаж. Обнови игровое состояние.",
    invalid_request: "Проверь имя персонажа и выбранный класс.",
    server_error: "Сервер временно недоступен. Попробуй позже.",
    invalid_response: "Сервер вернул некорректный ответ.",
  };

  return messages[error] ?? "Не удалось создать персонажа.";
}

export default function CharacterCreation({
  sessionToken,
  onCreated,
}: CharacterCreationProps) {
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] =
    useState<CharacterClass>("adventurer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const normalizedName = name.trim();
  const isNameValid =
    normalizedName.length >= 2 &&
    normalizedName.length <= 24;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || !isNameValid || !sessionToken) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await createCharacter(sessionToken, {
        name: normalizedName,
        characterClass: selectedClass,
      });

      if (!result.ok) {
        setErrorMessage(getErrorMessage(result.error));
        return;
      }

      onCreated(result.data);
    } catch {
      setErrorMessage("Произошла непредвиденная ошибка. Попробуй ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section style={styles.container} aria-label="Создание персонажа">
      <div style={styles.content}>
        <p style={styles.eyebrow}>XMOONVERSE REALM</p>

        <div>
          <h1 style={styles.heading}>Твоя история начинается</h1>
          <p style={styles.subtitle}>
            Создай своего первого героя и отправляйся исследовать
            мир Realm.
          </p>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label htmlFor="character-name" style={styles.label}>
              Имя персонажа
            </label>

            <input
              id="character-name"
              type="text"
              autoComplete="off"
              maxLength={24}
              minLength={2}
              placeholder="Как тебя будут звать?"
              value={name}
              disabled={isSubmitting}
              onChange={(event) => setName(event.target.value)}
              style={styles.input}
              required
            />

            <p
              style={{
                margin: "6px 0 0",
                color: "#917eae",
                fontSize: 10,
                textAlign: "right",
              }}
            >
              {normalizedName.length}/24
            </p>
          </div>

          <div>
            <p style={styles.label}>Выбери свой путь</p>

            <div style={styles.classGrid}>
              {classes.map((option) => {
                const selected = selectedClass === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={isSubmitting}
                    aria-pressed={selected}
                    onClick={() => setSelectedClass(option.id)}
                    style={{
                      ...styles.classCard,
                      ...(selected ? styles.selectedCard : {}),
                    }}
                  >
                    <span style={styles.classIcon}>{option.icon}</span>
                    <span style={styles.className}>{option.name}</span>
                    <span style={styles.classRole}>{option.role}</span>
                    <span style={styles.classDescription}>
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <p role="alert" style={styles.error}>
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={!isNameValid || isSubmitting || !sessionToken}
            style={{
              ...styles.submit,
              opacity:
                !isNameValid || isSubmitting || !sessionToken ? 0.55 : 1,
              cursor:
                !isNameValid || isSubmitting || !sessionToken
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isSubmitting ? "Создаём персонажа…" : "Создать персонажа"}
          </button>

          <p style={styles.hint}>
            Класс определяет выбранную роль героя. Баланс характеристик
            будет настраиваться отдельной игровой системой.
          </p>
        </form>
      </div>
    </section>
  );
}